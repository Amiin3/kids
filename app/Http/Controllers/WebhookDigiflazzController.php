<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\TelegramService;

class WebhookDigiflazzController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $headerSignature = $request->header('X-Hub-Signature') ?? 'KOSONG';
        
        $secret = env('DIGIFLAZZ_WEBHOOK_SECRET', 'KOSONG');
        $expectedSignature = 'sha1=' . hash_hmac('sha1', $payload, $secret);

        if ($secret !== 'KOSONG' && $headerSignature !== $expectedSignature) {
            Log::warning("🚨 [WEBHOOK DIGI] Signature Invalid!");
            return response()->json(['error' => 'Invalid Signature'], 403);
        }

        $data = json_decode($payload, true);
        if (!isset($data['data']['ref_id'])) return response()->json(['error' => 'Bad Request'], 400);

        $ref_id = $data['data']['ref_id'];
        $status = $data['data']['status']; 
        $sn = $data['data']['sn'] ?? '';

        DB::beginTransaction();
        try {
            $trx = DB::table('transaksi')->where('ref_id', $ref_id)->lockForUpdate()->first();
            if (!$trx) {
                DB::rollBack();
                return response()->json(['message' => 'Not Found']);
            }

            // 1. SELALU UPDATE SN & STATUS (PASTIKAN SN MASUK)
            if ($status === 'Gagal') {
                if ($trx->status !== 'Gagal') {
                    DB::table('users')->where('name', $trx->username)->increment('saldo', $trx->harga);
                }
                DB::table('transaksi')->where('ref_id', $ref_id)->update(['status' => 'Gagal', 'sn' => $sn, 'wa_notif' => 0, 'updated_at' => now()]);
            } elseif ($status === 'Sukses') {
                DB::table('transaksi')->where('ref_id', $ref_id)->update(['status' => 'Sukses', 'sn' => $sn, 'wa_notif' => 0, 'updated_at' => now()]);
            } else {
                DB::table('transaksi')->where('ref_id', $ref_id)->update(['sn' => $sn, 'updated_at' => now()]);
                DB::commit();
                return response()->json(['success' => true]);
            }
            DB::commit();

            // 🚀 2. DOBRAK GERBANG: Langsung Tarik Pelatuk Notif jika Status Final (Sukses/Gagal)
            if (in_array($status, ['Sukses', 'Gagal'])) {
                Log::info("🚀 [WEBHOOK DIGI] Menarik Pelatuk Notif Otomatis untuk Trx: $ref_id");

                // Jalur A: Webhook Reseller
                try {
                    \App\Http\Controllers\Api\H2HController::sendWebhook($ref_id);
                } catch (\Throwable $e) { Log::error("Err Webhook: ".$e->getMessage()); }

                // Jalur B: Telegram
                try {
                    if ($status === 'Sukses') TelegramService::sendMessage("✅ *TRX SUKSES*\nTrx: $ref_id\nUser: {$trx->username}\nSN: $sn");
                    if ($status === 'Gagal') TelegramService::sendMessage("🔄 *REFUND*\nTrx: $ref_id\nUser: {$trx->username}");
                } catch (\Throwable $e) { Log::error("Err Tele: ".$e->getMessage()); }

                // Jalur C: Notif Sultan (WA/Email)
                try {
                    $userEmail = DB::table('users')->where('name', $trx->username)->value('email');
                    if ($userEmail) {
                        $judul = ($status === 'Sukses') ? "Order Berhasil! ✅" : "Order Gagal ❌";
                        $pesan = ($status === 'Sukses') 
                            ? "Mantap! Pesanan {$trx->kode_layanan} ke {$trx->tujuan} SUKSES. SN: $sn"
                            : "Pesanan {$trx->kode_layanan} GAGAL. Saldo balik!";
                        $this->kirimNotifSultan($userEmail, $judul, $pesan, $trx);
                    }
                } catch (\Throwable $e) { Log::error("Err Notif Sultan: ".$e->getMessage()); }
            }

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Global Err: ".$e->getMessage());
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    protected function kirimNotifSultan($email, $judul, $pesan, $trx = null) {
        Log::info("[NOTIF SULTAN] Ke: $email | Judul: $judul");
        try {
            if ($trx) {
                $uname = $trx->username ?? null;
                $status = strtoupper($trx->status ?? 'UNKNOWN');
                $user = \Illuminate\Support\Facades\DB::table('users')->where('name', $uname)->orWhere('username', $uname)->first();
                
                if ($user && !empty($user->whatsapp ?? $user->phone)) {
                    $wa = preg_replace('/[^0-9]/', '', $user->whatsapp ?? $user->phone);
                    if (substr($wa, 0, 1) == '0') $wa = '62' . substr($wa, 1);
                    
                    $msg = "🔄 *UPDATE TRANSAKSI* 🔄\n\n📦 Produk: *" . ($trx->kode_layanan ?? '-') . "*\n🎯 Tujuan: " . ($trx->tujuan ?? '-') . "\n🧾 SN: " . ($trx->sn ?? '-') . "\n📊 Status: *" . $status . "*";
                    
                    \Illuminate\Support\Facades\Http::timeout(3)->post('http://127.0.0.1:3333/send-notif', ['target' => $wa, 'message' => $msg, 'key' => 'SULTAN_MILA_2026']);
                }
            }
        } catch (\Exception $e) {}
        return true;
    }
}
