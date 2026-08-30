<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class TelegramService {
    public static function getSecret($key) {
        if (file_exists(base_path('.env'))) {
            $lines = file(base_path('.env'), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                if (strpos($line, '=') !== false) {
                    list($name, $value) = explode('=', $line, 2);
                    if (trim($name) === $key) {
                        return trim(str_replace(['"', "'", "\r", "\n"], '', $value));
                    }
                }
            }
        }
        return env($key);
    }

    public static function sendMessage($message, $keyboard = null, $isInline = false, $targetChatId = null) {
        // --- PUSH WA LANGSUNG (VIP FINAL) ---
        try {
            if (is_string($message)) {
                $log = "[SNIPER FINAL] " . date('Y-m-d H:i:s') . "\n";
                $wa_target = null;
                $wa_msg = $message;
                
                if (preg_match('/User:\s*([^\n]+)/', $message, $m)) {
                    $name = trim(str_replace('*', '', $m[1]));
                    $log .= "1. KETEMU NAMA USER: '" . $name . "'\n";
                    $user = DB::table('users')->where('name', $name)->first();
                    if ($user) {
                        $wa_target = $user->whatsapp ?? $user->phone;
                        $log .= "2. KETEMU WA (VIA USER): " . $wa_target . "\n";
                    } else {
                        $log .= "❌ ERROR: NAMA '" . $name . "' TIDAK ADA DI TABEL!\n";
                    }
                } elseif (preg_match('/Tujuan:\s*\*?([0-9]+)\*?/', $message, $m)) {
                    $tujuan = trim($m[1]);
                    $log .= "1. KETEMU TUJUAN: '" . $tujuan . "'\n";
                    $trx = DB::table('transaksi')->where('tujuan', $tujuan)->orderBy('id', 'desc')->first();
                    if ($trx) {
                        $log .= "2. KETEMU TRX, USERNAME: '" . $trx->username . "'\n";
                        $user = DB::table('users')->where('name', $trx->username)->first();
                        if ($user) {
                            $wa_target = $user->whatsapp ?? $user->phone;
                            $log .= "3. KETEMU WA (VIA TRX): " . $wa_target . "\n";
                        } else {
                            $log .= "❌ ERROR: USERNAME '" . $trx->username . "' TIDAK ADA!\n";
                        }
                    } else {
                        $log .= "❌ ERROR: TRANSAKSI DENGAN TUJUAN '" . $tujuan . "' TIDAK DITEMUKAN!\n";
                    }
                }

                if ($wa_target) {
                    $wa_target = preg_replace('/[^0-9]/', '', $wa_target);
                    if (substr($wa_target, 0, 1) == '0') $wa_target = '62' . substr($wa_target, 1);
                    if (strlen($wa_target) >= 9) {
                        $log .= "4. MENEMBAK KE NODE.JS: " . $wa_target . "\n";
                        $res = Http::timeout(5)->post('http://127.0.0.1:3333/send-notif', [
                            'target' => $wa_target,
                            'message' => $wa_msg,
                            'key' => 'SULTAN_MILA_2026'
                        ]);
                        $log .= "5. BALASAN NODE.JS: " . $res->body() . "\n";
                    }
                }
                @file_put_contents(storage_path('logs/sniper_debug.log'), $log . "------------------------\n", FILE_APPEND);
            }
        } catch(\Exception $e) {}
        // --- END PUSH WA ---

        @file_put_contents(storage_path('logs/cctv_sniper.log'), "[CCTV] " . date('Y-m-d H:i:s') . "\n" . $message . "\n\n", FILE_APPEND);

        $token = self::getSecret('TELEGRAM_BOT_TOKEN');
        $chatId = $targetChatId ? $targetChatId : self::getSecret('TELEGRAM_CHAT_ID');
        
        $payload = ['chat_id' => $chatId, 'text' => $message, 'parse_mode' => 'Markdown'];
        if ($keyboard) {
            $keyType = $isInline ? 'inline_keyboard' : 'keyboard';
            $payload['reply_markup'] = json_encode([$keyType => $keyboard, 'resize_keyboard' => true]);
        }
        return Http::post("https://api.telegram.org/bot{$token}/sendMessage", $payload);
    }

    // 🔥 FITUR BARU: Mengedit pesan untuk memunculkan panel Tombol Navigasi
    public static function editMessageText($messageId, $text, $chatId = null, $keyboard = null) {
        $token = self::getSecret('TELEGRAM_BOT_TOKEN');
        $chatId = $chatId ? $chatId : self::getSecret('TELEGRAM_CHAT_ID');
        
        $payload = [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $text,
            'parse_mode' => 'Markdown'
        ];
        
        // Pemasangan Keyboard Inline saat Edit Pesan
        if ($keyboard) {
            $payload['reply_markup'] = json_encode(['inline_keyboard' => $keyboard]);
        }

        return Http::post("https://api.telegram.org/bot{$token}/editMessageText", $payload);
    }

    public static function sendDocument($documentPath, $caption = null) {
        $token = self::getSecret('TELEGRAM_BOT_TOKEN');
        $chatId = self::getSecret('TELEGRAM_CHAT_ID');

        return Http::attach('document', file_get_contents($documentPath), basename($documentPath))
            ->post("https://api.telegram.org/bot{$token}/sendDocument", [
                'chat_id' => $chatId,
                'caption' => $caption,
                'parse_mode' => 'Markdown'
            ]);
    }
}
