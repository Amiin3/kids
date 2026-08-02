<?php
$file = 'app/Services/TelegramService.php';
$code = file_get_contents($file);

// Hapus suntikan lama
$code = preg_replace('/\/\/ --- PUSH WA LANGSUNG DARI LARAVEL \(VIP BYPASS 2026\) ---\n.*?\/\/ --- END PUSH WA ---/s', '', $code);

// Suntikan baru: Mencari user dengan logika fleksibel (Name OR Whatsapp)
$new_inject = '
        // --- PUSH WA LANGSUNG DARI LARAVEL (SMART LOOKUP 2026) ---
        try {
            if (is_string($message)) {
                $wa_target = null;
                // Ambil nomor tujuan dari teks
                if (preg_match("/Tujuan:\s*\*?([0-9]+)\*?/", $message, $m)) {
                    $tujuan = trim($m[1]);
                    
                    // 1. Cari transaksi berdasarkan tujuan
                    $trx = \Illuminate\Support\Facades\DB::table("transaksi")->where("tujuan", $tujuan)->orderBy("id", "desc")->first();
                    
                    // 2. Cari user berdasarkan data yg ada (karena "username" tidak ada)
                    // Kita coba pakai "whatsapp" (nomor tujuan) ATAU "name" (nama user)
                    $user = null;
                    if ($trx) {
                        $user = \Illuminate\Support\Facades\DB::table("users")
                                ->where("whatsapp", $tujuan)
                                ->orWhere("phone", $tujuan)
                                ->orWhere("name", $trx->username ?? "")
                                ->first();
                    }
                    
                    if ($user) $wa_target = $user->whatsapp ?? $user->phone;
                }
                
                // Kirim ke Node.js jika target ketemu
                if ($wa_target) {
                    \Illuminate\Support\Facades\Http::timeout(5)->post("http://localhost:3000/send-notif", [
                        "target" => $wa_target,
                        "message" => $message,
                        "key" => "SULTAN_MILA_2026"
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("[SNIPER SMART] " . $e->getMessage());
        }
        // --- END PUSH WA ---
';

// Tempelkan setelah $message);
$code = str_replace('$message);', '$message);' . $new_inject, $code);

file_put_contents($file, $code);
echo "✅  SNIPER SMART LOOK-UP SUDAH TERPASANG!\n";
