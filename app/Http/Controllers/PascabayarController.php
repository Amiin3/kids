<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Services\DigiflazzService;
use Inertia\Inertia;
use Exception;

class PascabayarController extends Controller
{
    protected $digiflazz;
    
    public function __construct(DigiflazzService $digiflazz) {
        $this->digiflazz = $digiflazz;
    }

    public function index() {
        $digi = DB::table('layanan')->where('status', 'active')->where(function($q) {
            $q->where('tipe', 'LIKE', '%pasca%')->orWhere('tipe', 'LIKE', '%postpaid%')->orWhere('nama_layanan', 'LIKE', '%pasca%')->orWhere('nama_layanan', 'LIKE', '%pascabayar%')->orWhere('nama_layanan', 'LIKE', '%tagihan%')->orWhere('nama_layanan', 'LIKE', '%bpjs%')->orWhere('nama_layanan', 'LIKE', '%pdam%');
        })->get()->map(function($item) { $item->server = 'DIGIFLAZZ'; return $item; });
        
        $oke = DB::table('layanan_okeconnect')->where('status', 'active')->where(function($q) {
            $q->where('tipe', 'LIKE', '%pasca%')->orWhere('tipe', 'LIKE', '%postpaid%')->orWhere('nama_layanan', 'LIKE', '%pasca%')->orWhere('nama_layanan', 'LIKE', '%pascabayar%')->orWhere('nama_layanan', 'LIKE', '%tagihan%')->orWhere('nama_layanan', 'LIKE', '%bpjs%')->orWhere('nama_layanan', 'LIKE', '%pdam%');
        })->get()->map(function($item) { $item->server = 'OKECONNECT'; return $item; });
        
        $products = collect($digi)->merge($oke)->sortBy('nama_layanan')->values();
        
        $grouped = ['PLN Pasca' => [], 'PDAM' => [], 'BPJS' => [], 'HP Pasca' => [], 'Internet / Telkom' => [], 'Lainnya' => []];
        $pdamRegions = ['DKI JAKARTA & JABODETABEK' => [], 'JAWA BARAT' => [], 'JAWA TENGAH & DIY' => [], 'JAWA TIMUR' => [], 'SUMATERA' => [], 'BALI, NTB & NTT' => [], 'KALIMANTAN & SULAWESI' => [], 'WILAYAH LAINNYA' => []];

        foreach ($products as $p) {
            $name = strtoupper($p->nama_layanan);
            if (str_contains($name, 'PLN') || str_contains($name, 'LISTRIK')) $grouped['PLN Pasca'][] = $p;
            elseif (str_contains($name, 'BPJS')) $grouped['BPJS'][] = $p;
            elseif (str_contains($name, 'HALO') || str_contains($name, 'MATRIX') || str_contains($name, 'PRIORITAS') || str_contains($name, 'XL') || str_contains($name, 'TELKOMSEL')) $grouped['HP Pasca'][] = $p;
            elseif (str_contains($name, 'TELKOM') || str_contains($name, 'INDIHOME') || str_contains($name, 'WIFI')) $grouped['Internet / Telkom'][] = $p;
            elseif (str_contains($name, 'PDAM') || str_contains($name, 'PAM') || str_contains($name, 'AETR')) {
                if (str_contains($name, 'JAKARTA') || str_contains($name, 'JAKTIM') || str_contains($name, 'BOGOR') || str_contains($name, 'DEPOK') || str_contains($name, 'TANGERANG') || str_contains($name, 'BEKASI')) $pdamRegions['DKI JAKARTA & JABODETABEK'][] = $p;
                elseif (str_contains($name, 'BANDUNG') || str_contains($name, 'CIREBON') || str_contains($name, 'GARUT') || str_contains($name, 'TASIK') || str_contains($name, 'KARAWANG') || str_contains($name, 'SUKABUMI') || str_contains($name, 'CIANJUR') || str_contains($name, 'SUBANG') || str_contains($name, 'PURWAKARTA') || str_contains($name, 'INDRAMAYU')) $pdamRegions['JAWA BARAT'][] = $p;
                elseif (str_contains($name, 'SEMARANG') || str_contains($name, 'SURAKARTA') || str_contains($name, 'SOLO') || str_contains($name, 'JOGJA') || str_contains($name, 'YOGYAKARTA') || str_contains($name, 'TEGAL') || str_contains($name, 'PEKALONGAN') || str_contains($name, 'MAGELANG') || str_contains($name, 'SALATIGA') || str_contains($name, 'PURWOREJO') || str_contains($name, 'CILACAP') || str_contains($name, 'BANYUMAS')) $pdamRegions['JAWA TENGAH & DIY'][] = $p;
                elseif (str_contains($name, 'SURABAYA') || str_contains($name, 'MALANG') || str_contains($name, 'SIDOARJO') || str_contains($name, 'GRESIK') || str_contains($name, 'JEMBER') || str_contains($name, 'KEDIRI') || str_contains($name, 'BANYUWANGI') || str_contains($name, 'MADIUN') || str_contains($name, 'PROBOLINGGO') || str_contains($name, 'PASURUAN')) $pdamRegions['JAWA TIMUR'][] = $p;
                elseif (str_contains($name, 'MEDAN') || str_contains($name, 'PALEMBANG') || str_contains($name, 'PADANG') || str_contains($name, 'PEKANBARU') || str_contains($name, 'JAMBI') || str_contains($name, 'LAMPUNG') || str_contains($name, 'BENGKULU') || str_contains($name, 'ACEH') || str_contains($name, 'BATAM') || str_contains($name, 'TANJUNGPINANG')) $pdamRegions['SUMATERA'][] = $p;
                elseif (str_contains($name, 'BALI') || str_contains($name, 'DENPASAR') || str_contains($name, 'MATARAM') || str_contains($name, 'KUPANG') || str_contains($name, 'LOMBOK')) $pdamRegions['BALI, NTB & NTT'][] = $p;
                elseif (str_contains($name, 'BANJARMASIN') || str_contains($name, 'BALIKPAPAN') || str_contains($name, 'SAMARINDA') || str_contains($name, 'PONTIANAK') || str_contains($name, 'MAKASSAR') || str_contains($name, 'MANADO') || str_contains($name, 'PALU') || str_contains($name, 'KENDARI')) $pdamRegions['KALIMANTAN & SULAWESI'][] = $p;
                else $pdamRegions['WILAYAH LAINNYA'][] = $p;
            } else $grouped['Lainnya'][] = $p;
        }

        $pdamRegions = array_filter($pdamRegions, function($arr) { return count($arr) > 0; });
        $grouped['PDAM'] = $pdamRegions;
        $grouped = array_filter($grouped, function($arr) { return count($arr) > 0; });

        return Inertia::render('Order/Pascabayar', [
            'groupedProducts' => $grouped,
            'userBalance' => DB::table('users')->where('id', auth()->id())->value('saldo') ?? 0
        ]);
    }

    public function inquiry(Request $request) {
        $kodeLayanan = strip_tags($request->input('kode_layanan'));
        $tujuan = preg_replace('/[^0-9]/', '', $request->input('tujuan'));
        $server = strip_tags($request->input('server'));

        if (!$kodeLayanan || empty($tujuan) || !$server) return response()->json(['success' => false, 'message' => 'Data tagihan tidak lengkap.'], 400);

        $product = $server === 'OKECONNECT' ? DB::table('layanan_okeconnect')->where('kode_layanan', $kodeLayanan)->first() : DB::table('layanan')->where('kode_layanan', $kodeLayanan)->first();
        if (!$product) return response()->json(['success' => false, 'message' => 'Produk tagihan tidak ditemukan.'], 404);

        if ($server === 'OKECONNECT') {
            // OKECONNECT INQUIRY = Transaksi Nyata, deduct balance jika Cek Tagihan ada harganya (misal Rp500)
            $realPrice = $product->harga_jual ?? 0;
            $userId = auth()->id();
            $refId = 'INQ' . time() . rand(10,99);

            DB::beginTransaction();
            try {
                $user = DB::table('users')->where('id', $userId)->lockForUpdate()->first();
                if ((float)$user->saldo < $realPrice) {
                    DB::rollBack();
                    return response()->json(['success' => false, 'message' => 'Saldo tidak cukup untuk biaya pengecekan.'], 400);
                }
                if ($realPrice > 0) DB::table('users')->where('id', $userId)->decrement('saldo', $realPrice);
                
                DB::table('transaksi')->insertGetId([
                    'ref_id' => $refId, 'username' => $user->name, 'kode_layanan' => $product->kode_layanan, 
                    'tujuan' => $tujuan, 'harga' => $realPrice, 'status' => 'Pending', 'created_at' => now(), 'updated_at' => now()
                ]);
                DB::commit();
            } catch (Exception $e) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Sistem sibuk.'], 500);
            }

            try {
                $response = Http::timeout(60)->get("https://h2h.okeconnect.com/trx", [
                    'memberID' => env('OKECONNECT_MEMBER_ID'), 'pin' => env('OKECONNECT_PIN'), 
                    'password' => env('OKECONNECT_PASSWORD'), 'product' => $product->kode_layanan, 
                    'dest' => $tujuan, 'refID' => $refId
                ]);
                
                $bodyLower = strtolower($response->body());
                if (str_contains($bodyLower, 'gagal') || str_contains($bodyLower, 'salah') || str_contains($bodyLower, 'ditolak') || str_contains($bodyLower, 'tidak cukup')) {
                    DB::transaction(function () use ($userId, $refId, $realPrice, $response) {
                        if ($realPrice > 0) DB::table('users')->where('id', $userId)->increment('saldo', $realPrice);
                        DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Gagal', 'sn' => substr($response->body(), 0, 100), 'updated_at' => now()]);
                    });
                    return response()->json(['success' => false, 'message' => trim(preg_replace('/(?:\.?\s*)Saldo\s+.*$/i', '', $response->body()))], 400);
                }

                return response()->json(['success' => true, 'is_polling' => true, 'ref_id' => $refId, 'message' => 'Menunggu Webhook...']);
            } catch (Exception $e) {
                return response()->json(['success' => true, 'is_polling' => true, 'ref_id' => $refId]);
            }
        } else {
            // DIGIFLAZZ INQUIRY (Langsung / Synchronous)
            $refId = 'INQ' . time() . rand(10,99);
            $inquiry = $this->digiflazz->inquiry($refId, $tujuan, $product->kode_layanan);
            if (isset($inquiry['success']) && $inquiry['success']) {
                return response()->json(['success' => true, 'is_polling' => false, 'data' => $inquiry['data']]);
            } else {
                return response()->json(['success' => false, 'message' => $inquiry['message'] ?? 'Gagal cek tagihan.'], 400);
            }
        }
    }

    public function poll(Request $request) {
        $refId = strip_tags($request->input('ref_id'));
        $trx = DB::table('transaksi')->where('ref_id', $refId)->first();
        
        if (!$trx) return response()->json(['status' => 'pending']);
        
        if ($trx->status === 'Sukses') {
            $sn = $trx->sn ?? '';
            
            // 🧠 AI Regex Cerdas: Mengurai pesan Webhook (Cari Nama & Total Tagihan Asli)
            $customerName = 'Pelanggan / ' . substr($sn, 0, 15);
            $sellingPrice = 0;

            if (preg_match('/(?:nama|a\/n)\s*[:=]?\s*([a-zA-Z0-9\s\.\*\'\"]+?)(?:,|\/|-|tagihan|rp|bln|total|no|$)/i', $sn, $matchName)) {
                $customerName = trim($matchName[1]);
            }

            if (preg_match('/(?:tagihan|total|rp\.?)\s*[:=]?\s*([0-9\.,]+)/i', $sn, $matchPrice)) {
                $sellingPrice = (float) preg_replace('/[^0-9]/', '', $matchPrice[1]);
            }
            
            if ($sellingPrice <= 0) $sellingPrice = $trx->harga;

            return response()->json([
                'status' => 'sukses',
                'data' => [
                    'customer_name' => $customerName,
                    'selling_price' => $sellingPrice,
                    'desc' => $sn
                ]
            ]);
        } elseif ($trx->status === 'Gagal') {
            return response()->json(['status' => 'gagal', 'message' => $trx->sn]);
        }
        
        return response()->json(['status' => 'pending']);
    }

    public function pay(Request $request) {
        $kodeLayanan = strip_tags($request->input('kode_layanan'));
        $tujuan = preg_replace('/[^0-9]/', '', $request->input('tujuan'));
        $server = strip_tags($request->input('server'));
        $amount = (float) $request->input('amount', 0);

        if (!$kodeLayanan || empty($tujuan) || !$server || $amount <= 0) return response()->json(['success' => false, 'message' => 'Data pembayaran tidak valid.'], 400);

        $product = $server === 'OKECONNECT' ? DB::table('layanan_okeconnect')->where('kode_layanan', $kodeLayanan)->first() : DB::table('layanan')->where('kode_layanan', $kodeLayanan)->first();
        if (!$product) return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);

        $userId = auth()->id();
        $refId = 'PAY' . time() . rand(10,99);

        DB::beginTransaction();
        try {
            $user = DB::table('users')->where('id', $userId)->lockForUpdate()->first();
            if ((float)$user->saldo < $amount) { DB::rollBack(); return response()->json(['success' => false, 'message' => 'Saldo tidak mencukupi untuk membayar tagihan.'], 400); }
            DB::table('users')->where('id', $userId)->decrement('saldo', $amount);
            DB::table('transaksi')->insertGetId(['ref_id' => $refId, 'username' => $user->name, 'kode_layanan' => $product->kode_layanan, 'tujuan' => $tujuan, 'harga' => $amount, 'status' => 'Pending', 'created_at' => now(), 'updated_at' => now()]);
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack(); return response()->json(['success' => false, 'message' => 'Sistem sibuk. Coba lagi.'], 500);
        }

        try {
            $isSuccess = false; $pesan = '';
            if ($server === 'OKECONNECT') {
                $response = Http::timeout(60)->get("https://h2h.okeconnect.com/trx", ['memberID' => env('OKECONNECT_MEMBER_ID'), 'pin' => env('OKECONNECT_PIN'), 'password' => env('OKECONNECT_PASSWORD'), 'product' => $product->kode_layanan, 'dest' => $tujuan, 'refID' => $refId]);
                $isSuccess = $response->successful(); $pesan = $response->body();
            } else {
                $payRes = $this->digiflazz->placeOrder($refId, $tujuan, $product->kode_layanan);
                $isSuccess = $payRes['success'] ?? false; $pesan = $payRes['message'] ?? 'Proses pascabayar.';
            }

            if (!$isSuccess) {
                DB::transaction(function () use ($userId, $refId, $amount, $pesan) {
                    DB::table('users')->where('id', $userId)->increment('saldo', $amount);
                    DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Gagal', 'sn' => substr($pesan, 0, 100), 'updated_at' => now()]);
                });
                return response()->json(['success' => false, 'message' => 'Pembayaran gagal: ' . substr($pesan, 0, 100)], 400);
            }

            DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Sukses', 'sn' => 'LUNAS', 'updated_at' => now()]);
            return response()->json(['success' => true, 'message' => 'Pembayaran Tagihan Berhasil!']);
        } catch (Exception $e) {
            return response()->json(['success' => true, 'message' => 'Pembayaran dikirim ke latar belakang.']);
        }
    }
}
