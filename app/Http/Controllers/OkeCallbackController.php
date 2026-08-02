<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OkeCallbackController extends Controller
{
    public function handle(Request $request)
    {
        $refId = $request->input('refid') ?? $request->input('refID') ?? $_GET['refid'] ?? $_GET['refID'] ?? null;
        $message = $request->input('message') ?? $_GET['message'] ?? '';
        
        $tId = '';
        if (preg_match('/(T#\d+)/i', $message, $match)) {
            $tId = $match[1];
        }
        
        $logData = "[" . date('Y-m-d H:i:s') . "] REF: " . ($refId ?? 'KOSONG') . " | TID: $tId | MSG: $message\n";
        @file_put_contents(storage_path('logs/oke_webhook.txt'), $logData, FILE_APPEND);
        
        if (!$refId || !$message) return response()->json(['success' => false, 'message' => 'Parameter tidak lengkap'], 400);
        
        $query = DB::table('transaksi')->where('ref_id', $refId)->orWhere('trx_id', $refId);
        if ($tId) $query->orWhere('sn', $tId)->orWhere('ref_id', $tId);
        $trx = $query->first();
        
        if (!$trx) return response()->json(['success' => false, 'message' => 'Trx tidak ditemukan']);
        if (in_array(strtolower($trx->status), ['sukses', 'success', 'gagal', 'failed'])) return response()->json(['success' => true, 'message' => 'Trx sudah diproses sebelumnya']);
        
        $pesanUpper = strtoupper($message);
        $statusPusat = 'Proses';
        $sn = '';
        
        // 🎯 FOKUS KUNCI: Ambil semua kalimat sebagai SN
        if (str_contains($pesanUpper, 'SUKSES') || str_contains($pesanUpper, 'BERHASIL')) {
            $statusPusat = 'Sukses';
            if (preg_match('/SN[:\/]\s*(.*)/i', $message, $m)) {
                $sn = trim($m[1]);
                if (strlen($sn) > 150) $sn = substr($sn, 0, 150) . '..';
            } else {
                $sn = 'SUKSES';
            }
        } elseif (str_contains($pesanUpper, 'GAGAL') || str_contains($pesanUpper, 'DITOLAK')) {
            $statusPusat = 'Gagal';
            $sn = substr($message, 0, 150);
        }
        
        @file_put_contents(storage_path('logs/oke_webhook.txt'), "--> EKSEKUSI TRX {$trx->id}: $statusPusat | SN: $sn\n", FILE_APPEND);
        
        if ($statusPusat === 'Sukses') {
            DB::table('transaksi')->where('id', $trx->id)->update([
                'status' => 'Sukses', 'sn' => $sn, 'updated_at' => now()
            ]);
        } elseif ($statusPusat === 'Gagal') {
            DB::transaction(function () use ($trx, $sn) {
                $lockedTrx = DB::table('transaksi')->where('id', $trx->id)->whereIn('status', ['Pending', 'Proses'])->lockForUpdate()->first();
                if ($lockedTrx) {
                    // 🎯 FOKUS KUNCI: Refund ke kolom 'name' sesuai struktur ORI
                    DB::table('users')->where('name', $lockedTrx->username)->increment('saldo', $lockedTrx->harga);
                    DB::table('transaksi')->where('id', $trx->id)->update([
                        'status' => 'Gagal', 'sn' => $sn, 'updated_at' => now()
                    ]);
                }
            });
        }
        return response()->json(['refid' => $refId, 'message' => $message]);
    }
}
