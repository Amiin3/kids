<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OkeCallbackController extends Controller
{
    /**
     * 🛡️ SENSOR RAHASIA DAPUR (Hapus Saldo & Jam dari Pesan)
     */
    private function cleanSaldoInfo($text)
    {
        if (empty($text)) return '';

        // Potong dan buang semua teks mulai dari kata "Saldo" sampai habis
        $cleaned = preg_replace('/\bSaldo\b[\s\S]*/i', '', $text);

        // Buang penanda jam/tanggal seperti @21:13 atau @31/08 21:07 di ujung
        $cleaned = preg_replace('/@\d{1,2}[\/\d\:\s]*$/', '', $cleaned);

        // Bersihkan tanda titik dan spasi di akhir kalimat
        return trim($cleaned, " .\t\n\r\0\x0B");
    }

    public function handle(Request $request)
    {
        $refId = $request->input('refid') ?? $request->input('refID') ?? $_GET['refid'] ?? $_GET['refID'] ?? null;
        $message = $request->input('message') ?? $_GET['message'] ?? '';

        $tId = '';
        if (preg_match('/(T#\d+)/i', $message, $match)) {
            $tId = $match[1];
        }

        // Log internal server (hanya tersimpan di file log, tidak tampil ke member)
        $logData = "[" . date('Y-m-d H:i:s') . "] REF: " . ($refId ?? 'KOSONG') . " | TID: $tId | MSG: $message\n";
        @file_put_contents(storage_path('logs/oke_webhook.txt'), $logData, FILE_APPEND);

        if (!$refId || !$message) {
            return response()->json(['success' => false, 'message' => 'Parameter tidak lengkap'], 400);
        }

        try {
            $trx = DB::table('transaksi')->where('ref_id', $refId)->first();

            if (!$trx && $tId) {
                $trx = DB::table('transaksi')->where('ref_id_provider', $tId)->orWhere('sn', $tId)->first();
            }

            // Fallback pencarian nomor tujuan jika ref_id berbeda
            if (!$trx && preg_match('/\.(\d+)\s+/i', $message, $mTujuan)) {
                $tujuan = $mTujuan[1];
                $trx = DB::table('transaksi')
                    ->where('tujuan', $tujuan)
                    ->whereIn('status', ['Pending', 'Proses', 'Proses_API', 'Menunggu'])
                    ->orderBy('id', 'desc')
                    ->first();
            }

            if (!$trx) {
                @file_put_contents(storage_path('logs/oke_webhook.txt'), "--> TRX TIDAK DITEMUKAN: REF $refId\n", FILE_APPEND);
                return response()->json(['success' => false, 'message' => 'Trx tidak ditemukan']);
            }

            if (in_array(strtolower($trx->status), ['sukses', 'success', 'gagal', 'failed'])) {
                return response()->json(['success' => true, 'message' => 'Trx sudah diproses sebelumnya']);
            }

            $pesanUpper = strtoupper($message);
            $statusPusat = 'Proses';
            $sn = '';

            // 🎯 FILTER STATUS & SN BERSIH TANPA BOCOR SALDO
            if (str_contains($pesanUpper, 'SUKSES') || str_contains($pesanUpper, 'BERHASIL')) {
                $statusPusat = 'Sukses';
                if (preg_match('/SN[:\/]\s*(.+)/i', $message, $mSn)) {
                    $sn = $this->cleanSaldoInfo($mSn[1]);
                } else {
                    $sn = 'SUKSES';
                }
            } elseif (str_contains($pesanUpper, 'GAGAL') || str_contains($pesanUpper, 'DITOLAK') || str_contains($pesanUpper, 'BATAL')) {
                $statusPusat = 'Gagal';
                if (preg_match('/KET[:\s]+(.+)/i', $message, $mKet)) {
                    $sn = $this->cleanSaldoInfo($mKet[1]);
                } else {
                    $snClean = preg_replace('/^T#\d+\s+R#[A-Za-z0-9-_]+\s+/i', '', $message);
                    $sn = $this->cleanSaldoInfo($snClean);
                }

                if (empty($sn)) {
                    $sn = 'Gangguan pada sistem biller/provider pusat.';
                }
            }

            @file_put_contents(storage_path('logs/oke_webhook.txt'), "--> EKSEKUSI TRX {$trx->id}: $statusPusat | SN: $sn\n", FILE_APPEND);

            if ($statusPusat === 'Sukses') {
                DB::table('transaksi')->where('id', $trx->id)->update([
                    'status'           => 'Sukses',
                    'sn'               => $sn,
                    'ref_id_provider'  => $tId ?: $trx->ref_id_provider,
                    'wa_notif'         => 0,
                    'updated_at'       => now()
                ]);
                DB::table('antrian_po')->where('ref_id', $trx->ref_id)->update(['status' => 'Sukses', 'updated_at' => now()]);
            } elseif ($statusPusat === 'Gagal') {
                DB::transaction(function () use ($trx, $sn, $tId) {
                    $lockedTrx = DB::table('transaksi')->where('id', $trx->id)->whereIn('status', ['Pending', 'Proses'])->lockForUpdate()->first();
                    if ($lockedTrx) {
                        DB::table('users')->where('name', $lockedTrx->username)->increment('saldo', $lockedTrx->harga);
                        DB::table('transaksi')->where('id', $trx->id)->update([
                            'status'           => 'Gagal',
                            'sn'               => $sn,
                            'ref_id_provider'  => $tId ?: $lockedTrx->ref_id_provider,
                            'wa_notif'         => 0,
                            'updated_at'       => now()
                        ]);
                        DB::table('antrian_po')->where('ref_id', $trx->ref_id)->update(['status' => 'Gagal', 'updated_at' => now()]);
                    }
                });
            }

            return response()->json(['success' => true, 'refid' => $refId, 'status' => $statusPusat]);
        } catch (\Throwable $e) {
            Log::error("OKE_CALLBACK_ERROR: " . $e->getMessage());
            @file_put_contents(storage_path('logs/oke_webhook.txt'), "--> ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
