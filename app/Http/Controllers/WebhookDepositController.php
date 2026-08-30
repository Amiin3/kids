<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http; 

class WebhookDepositController extends Controller
{
    public function handle(Request $request)
    {
        $secret_key_anda = env("WEBHOOK_DEPOSIT_SECRET");
        $secret = $request->input('secret', $request->query('secret', ''));
        $notif_text = $request->input('text', $request->query('text', ''));

        if (!hash_equals($secret_key_anda, $secret)) {
            Log::warning("🚨 Webhook Deposit: Penyusup ditolak dari IP " . $request->ip());
            return response()->json(['success' => false, 'message' => 'Invalid secret key'], 403);
        }

        if (empty($notif_text)) {
            return response()->json(['success' => false, 'message' => 'Teks notifikasi kosong'], 400);
        }

        $nominal = $this->extractNominal($notif_text);
        Log::info("📨 Webhook Deposit Masuk", ['teks' => $notif_text, 'nominal_terbaca' => $nominal]);

        if ($nominal <= 0) {
            return response()->json(['success' => false, 'message' => 'Nominal tidak valid/terbaca']);
        }

        try {
            $hasil = DB::transaction(function () use ($nominal) {
                $deposit = DB::table('deposits')->where('total_bayar', $nominal)->where('status', 'Pending')->orderBy('id', 'asc')->lockForUpdate()->first();
                if (!$deposit) {
                     $deposit = DB::table('deposits')->where('total_bayar', $nominal)->where('status', 'pending')->orderBy('id', 'asc')->lockForUpdate()->first();
                }

                if (!$deposit) return ['status' => 'IGNORED', 'message' => 'Tidak ada tagihan pending cocok: Rp ' . number_format($nominal)];

                $id_deposit = $deposit->id;
                $user_id = $deposit->user_id;
                $jumlah_saldo = $deposit->amount;

                // Eksekusi 1 & 2: Update Sukses & Tambah Saldo
                DB::table('deposits')->where('id', $id_deposit)->update(['status' => 'Sukses', 'updated_at' => now()]);
                $tambahSaldo = DB::table('users')->where('id', $user_id)->increment('saldo', $jumlah_saldo);

                if ($tambahSaldo) {
                    DB::table('transaksi')->insert([
                        'ref_id' => 'DEP' . $id_deposit . time(),
                        'username' => DB::table('users')->where('id', $user_id)->value('name'),
                        'kode_layanan' => 'DEPOSIT', 'tujuan' => 'SALDO UTAMA',
                        'harga' => $jumlah_saldo, 'status' => 'Sukses',
                        'sn' => 'Deposit Otomatis via Mutasi',
                        'tanggal' => now(), 'created_at' => now(), 'updated_at' => now(),
                    ]);

                    // PUSH NOTIF WA JALUR VIP PORT 3333
                    $userObj = DB::table('users')->where('id', $user_id)->first();
                                        if ($userObj) {
                        // --- AUTO-WA WEBHOOK DEPO ---
                        try {
                            $wa = preg_replace('/[^0-9]/', '', $userObj->whatsapp ?? $userObj->phone ?? '');
                            if ($wa != '') {
                                if (substr($wa, 0, 1) == '0') $wa = '62' . substr($wa, 1);
                                $msg = "💳 *DEPOSIT OTOMATIS SUKSES* 💳\n\n";
                                $msg .= "💰 Jumlah: *Rp " . number_format($jumlah_saldo ?? 0, 0, ',', '.') . "*\n";
                                $msg .= "📊 Status: *SUKSES*";
                                \Illuminate\Support\Facades\Http::timeout(3)->post('http://127.0.0.1:3003/send-notif', ['target' => $wa, 'message' => $msg, 'key' => 'SULTAN_MILA_2026']);
                            }
                        } catch (\Exception $e) {}
                        // --- END AUTO-WA ---
                        $wa_target = $userObj->phone ?: $userObj->whatsapp;
                        if (!empty($wa_target)) {
                            if (substr($wa_target, 0, 1) == '0') $wa_target = '62' . substr($wa_target, 1);
                            $waMsg = "💰 *SALDO MILASTORE MASUK!* 💰\n━━━━━━━━━━━━━━━━━━━━━\n\nMetode: *{$deposit->metode}*\nNominal: *Rp " . number_format($jumlah_saldo, 0, ',', '.') . "*\nStatus: *SUKSES ✅ *\n\n_Diproses otomatis via Bot Mutasi._\nSelamat bertransaksi Bosku! 🚀";
                            try {
                                Http::timeout(5)->post('http://127.0.0.1:3003/send-notif', ['target' => $wa_target, 'message' => $waMsg, 'key' => 'MILA_SEC_v9B4xK8mP2qL7jW5nC3zR1hT6fD0yX5g']);
                            } catch (\Exception $e) {}
                        }
                    }

                    // ❌ PELATUK WEBHOOK SUDAH DICABUT DARI SINI ❌
                    
                    return ['status' => 'SUCCESS', 'message' => "SUKSES: Saldo User ID '$user_id' bertambah Rp " . number_format($jumlah_saldo)];
                } else {
                    throw new \Exception("User ID '$user_id' hilang dari database!");
                }
            });

            if ($hasil['status'] === 'SUCCESS') Log::info("💰 " . $hasil['message']);
            else Log::notice("ℹ️ " . $hasil['message']);

            return response()->json(['success' => true, 'processed' => ($hasil['status'] === 'SUCCESS'), 'message' => $hasil['message']]);

        } catch (\Exception $e) {
            Log::error("🔥 Webhook Deposit Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal memproses'], 500);
        }
    }

    private function extractNominal($text) {
        if (preg_match('/(?:Rp|saldo|terima|masuk|transfer)\s*[:]?\s*Rp?\.?\s*([0-9.,]+)/i', $text, $matches)) {
            $clean = str_replace(['.', ','], ['', '.'], $matches[1]);
            if ((float)$clean > 100) return (float)$clean;
        }
        $text_clean = preg_replace('/\[.*?\]/', '', $text);
        preg_match_all('/([0-9.,]+)/', $text_clean, $all_numbers);
        if (!empty($all_numbers[0])) {
            foreach ($all_numbers[0] as $num_str) {
                $n_clean = str_replace(['.', ','], ['', '.'], $num_str);
                if (substr($n_clean, 0, 2) == '08' && strlen($n_clean) > 9) continue;
                if ((float)$n_clean < 500) continue;
                return (float)$n_clean;
            }
        }
        return 0;
    }
}
