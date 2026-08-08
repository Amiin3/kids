<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Inertia\Inertia;

class AdminTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('transaksi');

        if ($request->search) {
            $query->where('ref_id', 'like', "%{$request->search}%")
                  ->orWhere('username', 'like', "%{$request->search}%")
                  ->orWhere('tujuan', 'like', "%{$request->search}%");
        }

        $transactions = $query->orderBy('id', 'desc')->paginate(20)->withQueryString();

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search'])
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Sukses,Pending,Gagal',
            'sn' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // 🛡️ GEMBOK TRANSAKSI AKTIF: Mencegah Double Request dari spammer
            $trx = DB::table('transaksi')->where('id', $id)->lockForUpdate()->first();

            if (!$trx) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan!'], 404);
            }

            // 🔥 LOGIKA DEWA: ADMIN PUNYA KUASA TERTINGGI (GOD MODE) 🔥
            $status_lama_gagal = in_array($trx->status, ['Gagal', 'Dibatalkan', 'Skipped']);
            $status_baru_gagal = ($request->status === 'Gagal');

            if (!$status_lama_gagal && $status_baru_gagal) {
                // KASUS 1: Dari Sukses/Pending diubah jadi Gagal -> REFUND SALDO
                DB::table('users')->where('name', $trx->username)->increment('saldo', $trx->harga);
                
            } elseif ($status_lama_gagal && !$status_baru_gagal) {
                // KASUS 2: Dari Gagal diubah jadi Sukses/Pending -> TARIK PAKSA UANGNYA!
                // 👑 KUASA ADMIN: Jika saldo tidak cukup, biarkan menjadi MINUS (Hutang) untuk akurasi pembukuan.
                DB::table('users')->where('name', $trx->username)->decrement('saldo', $trx->harga);
            }

            // Update data transaksi utama
            DB::table('transaksi')->where('id', $id)->update([
                'status' => $request->status,
                'sn' => $request->sn ?? $trx->sn,
                'updated_at' => now(),
            ]);

            // 🔗 KABEL SINKRONISASI KE MESIN WAR PO 🔗
            DB::table('antrian_po')->where('ref_id', $trx->ref_id)->update([
                'status' => $request->status,
                'updated_at' => now()
            ]);

            DB::commit();

            // ==========================================================
            // 🚀 SUNTIKAN NOTIFIKASI SULTAN MELUNCUR 🚀
            // ==========================================================
            if (in_array($request->status, ['Sukses', 'Gagal'])) {
                $userEmail = DB::table('users')->where('name', $trx->username)->value('email');
                if ($userEmail && method_exists($this, 'kirimNotifSultan')) {
                    $judul = ($request->status == 'Sukses') ? "Transaksi Berhasil! ✅ " : "Transaksi Gagal ❌ ";
                    $pesan = ($request->status == 'Sukses') 
                        ? "Pesanan " . $trx->kode_layanan . " ke " . $trx->tujuan . " sukses masuk. Cek SN sekarang!" 
                        : "Sori Bosku, pesanan " . $trx->kode_layanan . " gagal. Saldo otomatis dikembalikan!";
                    
                    $this->kirimNotifSultan($userEmail, $judul, $pesan);
                }
            }
            // ==========================================================

            return response()->json(['success' => true, 'message' => 'Eksekusi Mutlak Berhasil! Status & Saldo telah disesuaikan.']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()], 500);
        }
    }
}
