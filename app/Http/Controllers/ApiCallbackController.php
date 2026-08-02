<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApiCallbackController extends Controller
{
    // ==========================================
    // 1. PINTU CALLBACK DIGIFLAZZ
    // ==========================================
    public function digiflazz(Request $request) {
        $payload = $request->getContent();
        $data = json_decode($payload, true);
        
        Log::info('[CALLBACK DIGIFLAZZ MASUK]', $data ?? []);
        
        $refId = $data['data']['ref_id'] ?? null;
        $statusStr = strtolower($data['data']['status'] ?? '');
        $sn = $data['data']['sn'] ?? '';
        $message = $data['data']['message'] ?? '';
        
        if (!$refId) {
            return response()->json(['success' => false, 'message' => 'Ref ID tidak ditemukan']);
        }
        
        $this->prosesStatusPesanan($refId, $statusStr, $sn, $message, 'DIGIFLAZZ');
        
        return response()->json(['success' => true, 'message' => 'Callback Diterima']);
    }

    // ==========================================
    // 2. PINTU CALLBACK OKECONNECT (SMART SN EXTRACTOR)
    // ==========================================
    public function okeconnect(Request $request) {
        Log::info('[CALLBACK OKECONNECT MASUK]', $request->all());

        $refId = $request->input('refid') ?? $request->input('ref_id');
        $message = $request->input('message');

        if (!$refId || !$message) {
            return response()->json([
                'success' => false, 
                'message' => 'Parameter tidak lengkap (Butuh refid & message)'
            ], 200); 
        }

        $msgUpper = strtoupper($message);
        $statusStr = 'pending';
        $sn = '-';

        // Deteksi status Sukses
        if (str_contains($msgUpper, 'SUKSES') || str_contains($msgUpper, 'BERHASIL')) {
            $statusStr = 'sukses';
            
            // 🧠 LOGIKA SN PINTAR: Tangkap semua teks setelah "SN:" sampai sebelum kata "Saldo" (atau sampai habis)
            if (preg_match('/(?:SN|SN\/Ref)[\s:]+(.*?)(?=(?:\.?\s*Saldo\s)|$)/i', $message, $match)) {
                $sn = trim($match[1]);
            } else {
                // Jika tidak ada kata SN:, buang saja info saldo dan ambil sisa laporannya
                $sn = trim(preg_replace('/(?:\.?\s*)Saldo\s+.*$/i', '', $message));
            }

        // Deteksi status Gagal
        } elseif (str_contains($msgUpper, 'GAGAL') || str_contains($msgUpper, 'GANGGUAN') || str_contains($msgUpper, 'SALAH')) {
            $statusStr = 'gagal';
            
            // 🧠 LOGIKA GAGAL PINTAR: Hapus kata "Saldo..." agar alasan gagal murni yang tersisa
            $sn = trim(preg_replace('/(?:\.?\s*)Saldo\s+.*$/i', '', $message));
        }

        // Amankan panjang karakter (maksimal 200 karakter agar database tidak error jika kolom sn terbatas)
        $sn = substr($sn, 0, 200);

        // Lempar ke mesin pemrosesan utama
        $this->prosesStatusPesanan($refId, $statusStr, $sn, $message, 'OKECONNECT');

        return response()->json([
            'refid' => $refId,
            'message' => $message
        ], 200);
    }

    // ==========================================
    // 3. MESIN INTI PEMROSESAN & AUTO-REFUND
    // ==========================================
    private function prosesStatusPesanan($refId, $statusStr, $sn, $message, $server) {
        try {
            DB::beginTransaction();
            
            $trx = DB::table('transaksi')->where('ref_id', $refId)->lockForUpdate()->first();
            
            if (!$trx || !in_array($trx->status, ['Pending', 'Proses'])) {
                DB::rollBack();
                return;
            }

            $userData = DB::table('users')->where('name', $trx->username)->lockForUpdate()->first();

            if ($statusStr === 'sukses') {
                DB::table('transaksi')->where('id', $trx->id)->update([
                    'status' => 'Sukses',
                    'sn' => $sn,
                    'updated_at' => now()
                ]);
                Log::info("[TRX SUKSES] Trx {$refId} sukses dengan SN: {$sn}");
            } elseif ($statusStr === 'gagal') {
                DB::table('transaksi')->where('id', $trx->id)->update([
                    'status' => 'Gagal',
                    'sn' => $sn ?: substr($message, 0, 100),
                    'updated_at' => now()
                ]);

                // Eksekusi Auto-Refund Saldo
                if ($userData) {
                    DB::table('users')->where('id', $userData->id)->increment('saldo', $trx->harga);
                    Log::info("[REFUND SUKSES] Saldo Rp {$trx->harga} dikembalikan ke {$userData->name} (Trx: {$refId})");
                }
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("[SYSTEM ERROR CALLBACK] " . $e->getMessage());
        }
    }
}
