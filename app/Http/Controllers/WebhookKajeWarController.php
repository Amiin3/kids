<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http; 
use App\Services\TelegramService;

class WebhookKajeWarController extends Controller
{
    public function handle(Request $request)
    {
        $data = $request->all();
        Log::info("[WEBHOOK KAJE WAR] DATA: " . json_encode($data));

        $trx_id = $data['trx_id'] ?? null;
        $status_api = strtolower($data['status'] ?? '');
        $sn_pusat = $data['serial_number'] ?? '';
        $pesan_pusat = $data['message'] ?? '';

        if (!$trx_id) return response()->json(['message' => 'No TRX ID'], 200);

        // Cari transaksi berdasarkan SN (karena Kaje pake SN pusat sebagai TRX ID)
        $trx = DB::table('transaksi')->where('sn', $trx_id)->first();
        if (!$trx) return response()->json(['message' => 'TRX Not Found'], 200);

        // Jangan proses 2x kalau sudah final
        if (in_array($trx->status, ['Sukses', 'Gagal'])) {
            return response()->json(['message' => 'Already Processed']);
        }

        DB::beginTransaction();
        try {
            $status_notif = "";
            $final_sn = $sn_pusat ?: $trx_id;

            // ================== LOGIKA SUKSES ==================
            if (in_array($status_api, ['success', 'sukses'])) {
                DB::table('transaksi')->where('id', $trx->id)->update([
                    'status' => 'Sukses', 
                    'sn' => $final_sn, 
                    'updated_at' => now()
                ]);
                DB::table('antrian_kaje')->where('ref_id', $trx->ref_id)->update(['status' => 'Sukses']);
                $status_notif = "Sukses";
            }
            // ================== LOGIKA GAGAL/RETRY ==================
            elseif (in_array($status_api, ['failed', 'error', 'gagal', 'cancel'])) {
                if (preg_match('/(saldo|limit|aktif|mati|non-aktif|kosong|habis)/i', $pesan_pusat)) {
                    DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Gagal', 'sn' => "FATAL: $pesan_pusat"]);
                    DB::table('antrian_kaje')->where('ref_id', $trx->ref_id)->update(['status' => 'Gagal']);
                    
                    $user = DB::table('users')->where('name', $trx->username)->first();
                    if ($user) {
                        DB::table('users')->where('id', $user->id)->increment('saldo', $trx->harga);
                    }
                    $status_notif = "Gagal";
                } else {
                    // Dor Lagi! Balikkan ke Menunggu, gak ada notif WA dulu biar gak spam
                    DB::table('antrian_kaje')->where('ref_id', $trx->ref_id)->update(['status' => 'Menunggu']);
                    DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Pending', 'sn' => "RETRY: $pesan_pusat"]);
                }
            }

            // ==========================================================
            // ✅ KUNCI DATABASE DULUAN (ANTI-PENDING CLUB)
            // ==========================================================
            DB::commit();

            // ==========================================================
            // 🚀 PUSH NOTIFIKASI (JALUR AMAN, ERROR DISINI GAK NGERUSAK DB)
            // ==========================================================
            if ($status_notif !== "") {
                try {
                    // 1. Notif Telegram
                    if ($status_notif === 'Sukses') {
                        TelegramService::sendMessage("✅ *TRANSAKSI SUKSES (KAJE WAR)*\nTrx: {$trx->ref_id}\nUser: {$trx->username}\nSN: $final_sn");
                    } else {
                        TelegramService::sendMessage("🔄 *REFUND KAJE WAR*\nTrx: {$trx->ref_id}\nUser: {$trx->username}\nAlasan: $pesan_pusat\nSaldo kembali: Rp " . number_format($trx->harga));
                    }

                    // 2. Pelatuk Webhook H2H (Reseller) - FIX TYPO & VARIABEL
                    if (class_exists('\App\Http\Controllers\Api\H2HController')) {
                        \App\Http\Controllers\Api\H2HController::sendWebhook($trx->ref_id);
                    }

                    // 3. Push Notif WA ke Jalur VIP Node.js (Port 3333)
                    $userData = DB::table('users')->where('name', $trx->username)->first();
                    if ($userData) {
                        $wa_target = $userData->phone ?: $userData->whatsapp;
                        if (!empty($wa_target)) {
                            if (substr($wa_target, 0, 1) == '0') { 
                                $wa_target = '62' . substr($wa_target, 1); 
                            }
                            
                            $iconWa = ($status_notif === 'Sukses') ? '✅' : '❌';
                            $waMsg = "📢 *UPDATE WAR AMIFI AKRAB* $iconWa\n\n";
                            $waMsg .= "Ref ID: *{$trx->ref_id}*\n";
                            $waMsg .= "Produk: *{$trx->kode_layanan}*\n";
                            $waMsg .= "Tujuan: {$trx->tujuan}\n";
                            $waMsg .= "Status: *" . strtoupper($status_notif) . "*\n";
                            
                            if ($status_notif === 'Sukses') {
                                $waMsg .= "SN: `{$final_sn}`\n";
                            } else {
                                $waMsg .= "Ket: Saldo telah dikembalikan.\n";
                            }
                            $waMsg .= "\nTerima kasih sudah ikut antrean WAR di *MilaStore*! 👑";

                            Http::timeout(5)->post('http://127.0.0.1:3003/send-notif', [
                                'target' => $wa_target,
                                'message' => $waMsg,
                                'key' => 'MILA_SEC_v9B4xK8mP2qL7jW5nC3zR1hT6fD0yX5g'
                            ]);
                        }
                    }
                } catch (\Throwable $notifErr) {
                    Log::error("[KAJE WAR NOTIF ERROR] " . $notifErr->getMessage());
                }
            }

            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("[KAJE WAR CRITICAL] " . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }
}
