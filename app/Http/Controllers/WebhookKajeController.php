<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http; // 🚀 SUNTIKAN HTTP UNTUK NODE.JS

class WebhookKajeController extends Controller
{
    public function handle(Request $request)
    {
        $data = $request->all();
        $secret_key = "MILA123";
        $incoming_secret = $request->query('secret');
        if ($incoming_secret !== $secret_key) return response("Unauthorized", 403);
        
        if (!isset($data['ref_id'])) {
            Log::info("📞 PING WEBHOOK KAJE TERDETEKSI");
            return response("Ping Received", 200);
        }
        
        Log::info("📞 DATA WEBHOOK KAJE MASUK: " . json_encode($data));
        $ref_id_lokal = $data['ref_id'];
        $status_provider = strtolower($data['status'] ?? '');
        $sn_provider = $data['serial_number'] ?? $data['message'] ?? 'No SN';
        
        try {
            DB::beginTransaction();
            $trx = DB::table('transaksi')->where('ref_id', $ref_id_lokal)->lockForUpdate()->first();
            if (!$trx) {
                Log::error("❌   REF ID $ref_id_lokal TIDAK ADA DI DB");
                DB::rollBack();
                return response("Not Found", 200);
            }
            if (in_array($trx->status, ['Sukses', 'Gagal'])) {
                DB::rollBack();
                return response("Done", 200);
            }
            
            $status_notif = "";
            $pesan_notif = "";
            
            if (in_array($status_provider, ['sukses', 'success', 'done'])) {
                DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Sukses', 'sn' => $sn_provider, 'updated_at' => now()]);
                DB::table('antrian_po')->where('ref_id', $ref_id_lokal)->update(['status' => 'Sukses', 'updated_at' => now()]);
                Log::info("✅   KAJE SUKSES: $ref_id_lokal - SN: $sn_provider");
                $status_notif = "Sukses";
                $pesan_notif = "Mantap! Pesanan " . $trx->kode_layanan . " ke " . $trx->tujuan . " SUKSES. SN: " . $sn_provider;
            } elseif (in_array($status_provider, ['gagal', 'failed', 'error', 'batal'])) {
                DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Gagal', 'keterangan' => "Gagal: $sn_provider", 'sn' => $sn_provider, 'updated_at' => now()]);
                DB::table('antrian_po')->where('ref_id', $ref_id_lokal)->update(['status' => 'Gagal', 'updated_at' => now()]);
                DB::table('users')->where('name', $trx->username)->increment('saldo', $trx->harga);
                Log::info("💰 REFUND WEBHOOK SUKSES: Rp {$trx->harga} dikembalikan ke {$trx->username}");
                $status_notif = "Gagal";
                $pesan_notif = "Waduh sori Bosku, pesanan " . $trx->kode_layanan . " GAGAL. Saldo aman dikembalikan!";
            }
            
            // ==========================================================
            // 🚀 ALARM PINTU BELAKANG SULTAN (KAJE EMAIL + WA PORT 3333) 🚀
            // ==========================================================
            if ($status_notif !== "") {
                $userData = DB::table('users')->where('name', $trx->username)->first();
                if ($userData) {
                    // 1. Notif Email Lama (Tetap Jalan)
                    if ($userData->email) {
                        $judul = ($status_notif === 'Sukses') ? "Order Berhasil! ✅ " : "Order Gagal ❌ ";
                        if (method_exists($this, 'kirimNotifSultan')) {
                            $this->kirimNotifSultan($userData->email, $judul, $pesan_notif);
                        }
                    }

                    // 2. 🚀 NOTIF WA JALUR VIP PORT 3333 🚀
                    $wa_target = $userData->phone ?: $userData->whatsapp;
                    if (!empty($wa_target)) {
                        if (substr($wa_target, 0, 1) == '0') { $wa_target = '62' . substr($wa_target, 1); }

                        $iconWa = ($status_notif === 'Sukses') ? '✅' : '❌';
                        $waMsg = "📢 *UPDATE STATUS AMIFI AKRAB* $iconWa\n\n";
                        $waMsg .= "Ref ID: *{$trx->ref_id}*\n";
                        $waMsg .= "Produk: *{$trx->kode_layanan}*\n";
                        $waMsg .= "Tujuan: {$trx->tujuan}\n";
                        $waMsg .= "Status: *" . strtoupper($status_notif) . "*\n";
                        if ($status_notif === 'Sukses') {
                            $waMsg .= "SN: `{$sn_provider}`\n";
                        } else {
                            $waMsg .= "Ket: Saldo telah dikembalikan.\n";
                        }
                        $waMsg .= "\nTerima kasih sudah order di *MilaStore*! 👑";

                        try {
                            Http::timeout(5)->post('http://127.0.0.1:3003/send-notif', [
                                'target' => $wa_target,
                                'message' => $waMsg,
                                'key' => 'MILA_SEC_v9B4xK8mP2qL7jW5nC3zR1hT6fD0yX5g'
                            ]);
                            Log::info("✅ [WEBHOOK KAJE] Notif WA terkirim ke $wa_target");
                        } catch (\Exception $e) {
                            Log::error("❌ [WEBHOOK KAJE] Gagal kirim WA: " . $e->getMessage());
                        }
                    }
                }
            }
            // ==========================================================
            
            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("🚨 ERROR WEBHOOK KAJE: " . $e->getMessage());
            return response("Error", 200);
        }
    }
}
