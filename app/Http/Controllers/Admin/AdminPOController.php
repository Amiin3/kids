<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use App\Services\AdammediaService;

class AdminPOController extends Controller
{
    // Proteksi Khusus Admin
    private function checkAdmin(Request $request) {
        $user = $request->user();
        if (!$user || $user->level !== 'admin') {
            abort(403, 'Akses Ditolak. Khusus Sultan!');
        }
    }

    public function index(Request $request) {
        $this->checkAdmin($request);
        $antrean = DB::table('transaksi')
            ->where('is_po', 1)
            ->where('status', 'Pre-Order')
            ->orderBy('id', 'desc')
            ->get();
        $mode = Cache::get('po_v8_mode', 'auto');
        return inertia('Admin/ManagePOV8', [
            'antrean' => $antrean,
            'mode' => $mode
        ]);
    }

    public function toggleMode(Request $request) {
        $this->checkAdmin($request);
        $current = Cache::get('po_v8_mode', 'auto');
        $newMode = $current === 'auto' ? 'manual' : 'auto';
        Cache::put('po_v8_mode', $newMode);
        return response()->json(['success' => true, 'message' => 'Sistem PO kini berjalan di mode: ' . strtoupper($newMode)]);
    }

    public function retry(Request $request, $id, AdammediaService $srv) {
        $this->checkAdmin($request);
        $trx = DB::table('transaksi')->where('id', $id)->where('status', 'Pre-Order')->first();
        if (!$trx) return response()->json(['success' => false, 'message' => 'Data tidak valid atau sudah dieksekusi.']);
        
        try {
            // === 🛡️ FITUR ANTI-DDOS: INTIP STOK SEBELUM TEMBAK ===
            $key = env('ADAMMEDIA_API_KEY');
            if (empty($key) && file_exists(base_path('.env'))) {
                preg_match('/ADAMMEDIA_API_KEY=(.*)/', file_get_contents(base_path('.env')), $matches);
                $key = trim($matches[1] ?? '');
            }

            $stokTersedia = false;
            // Pastikan format kode layanan sama dengan yang ada di server pusat
            $kodeLayanan = strtoupper($trx->kode_layanan);

            // 1. Intip Jalur Reguler
            $reqReg = Http::withHeaders(['x-api-key' => $key])->timeout(5)->get("https://juraganxl.my.id/api/regulers");
            if ($reqReg->successful() && is_array($reqReg->json())) {
                foreach ($reqReg->json() as $i) {
                    if (isset($i['config']) && strtoupper($i['config']) === $kodeLayanan) {
                        $isOpen = $i['open'] ?? true;
                        $count = (int)($i['count'] ?? 0);
                        if ($isOpen && $count > 0) {
                            $stokTersedia = true;
                        }
                        break;
                    }
                }
            }

            // 2. Jika di Reguler kosong, Intip Jalur Circle
            if (!$stokTersedia) {
                $reqCir = Http::withHeaders(['x-api-key' => $key])->timeout(5)->get("https://juraganxl.my.id/api/circles");
                if ($reqCir->successful() && is_array($reqCir->json())) {
                    foreach ($reqCir->json() as $i) {
                        if (isset($i['config']) && strtoupper($i['config']) === $kodeLayanan) {
                            $isOpen = $i['open'] ?? true;
                            $count = (int)($i['count'] ?? 0);
                            if ($isOpen && $count > 0) {
                                $stokTersedia = true;
                            }
                            break;
                        }
                    }
                }
            }

            // 3. KEPUTUSAN: Eksekusi Beli atau Mundur Tiarap?
            if (!$stokTersedia) {
                DB::table('transaksi')->where('id', $trx->id)->update([
                    'sn' => 'Menunggu Stok (Mode Aman)',
                    'updated_at' => now()
                ]);
                
                // Balasan false ini akan ditangkap oleh React UI, membuat UI memberikan Jeda 15 detik!
                return response()->json(['success' => false, 'message' => '⚠️ Stok terpantau kosong! Tembakan ditahan agar IP aman.']);
            }
            // === END FITUR ANTI-DDOS ===

            // 4. JIKA STOK ADA -> DOR BRUTAL!
            $res = $srv->placeOrder($trx->ref_id, $trx->tujuan, $trx->kode_layanan);
            $statusAsli = strtoupper($res['status'] ?? '');
            $pesan = $res['sn'] ?? $res['message'] ?? 'Gangguan';
            $isNomorSalah = ($statusAsli === '52' || str_contains(strtolower($pesan), 'salah'));
            
            if ($statusAsli === '20' || $statusAsli === 'SUCCESS' || $statusAsli === 'SUKSES') {
                DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Sukses', 'sn' => $pesan, 'updated_at' => now()]);
                return response()->json(['success' => true, 'message' => '🔥 TEMBUS! Status berhasil diubah jadi Sukses.']);
            } elseif ($isNomorSalah) {
                // 🚀 FIX: Mengembalikan saldo jika nomor target terindikasi salah/mati
                $user = DB::table('users')->where('name', $trx->username)->first();
                if ($user && $trx->is_refunded == 0) {
                    DB::transaction(function() use ($user, $trx, $pesan) {
                        DB::table('users')->where('id', $user->id)->increment('saldo', $trx->harga);
                        DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Gagal', 'sn' => 'Refunded: ' . $pesan, 'is_refunded' => 1]);
                    });
                }
                return response()->json(['success' => true, 'message' => '❌ Nomor Salah! Status digagalkan dan Saldo dikembalikan.']);
            } else {
                DB::table('transaksi')->where('id', $trx->id)->update([
                    'retry_count' => DB::raw('retry_count + 1'),
                    'sn' => 'Retry Manual: ' . $pesan,
                    'updated_at' => now()
                ]);
                return response()->json(['success' => false, 'message' => '⚠️ Gagal tembus: ' . $pesan . ' (Stok mungkin baru saja diambil orang lain)']);
            }
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function cancel(Request $request, $id) {
        $this->checkAdmin($request);
        $trx = DB::table('transaksi')->where('id', $id)->where('status', 'Pre-Order')->first();
        if (!$trx) return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan.']);
        if ($trx->is_refunded == 1) return response()->json(['success' => false, 'message' => 'Dana sudah pernah direfund!']);
        
        $user = DB::table('users')->where('name', $trx->username)->first();
        if (!$user) return response()->json(['success' => false, 'message' => 'User tidak ditemukan.']);
        
        DB::transaction(function() use ($user, $trx) {
            DB::table('users')->where('id', $user->id)->increment('saldo', $trx->harga);
            DB::table('transaksi')->where('id', $trx->id)->update([
                'status' => 'Gagal',
                'sn' => 'Dibatalkan paksa oleh Admin (Refunded)',
                'is_refunded' => 1,
                'updated_at' => now()
            ]);
        });
        return response()->json(['success' => true, 'message' => 'Pesanan dibatalkan. Saldo Rp ' . number_format($trx->harga, 0, ',', '.') . ' dikembalikan ke user.']);
    }
}
