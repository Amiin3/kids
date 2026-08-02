<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class TelegramBotController extends Controller
{
    public function webhook(Request $request)
    {
        $update = $request->all();
        $token = env('TELEGRAM_BOT_TOKEN');

        if (!$token) {
            return response()->json(['status' => 'error', 'message' => 'Token not set']);
        }

        // 🌟 1. TANGANI KLIK TOMBOL INLINE (CALLBACK QUERY)
        if (isset($update['callback_query'])) {
            $callback = $update['callback_query'];
            $chatId = $callback['message']['chat']['id'] ?? null;
            $messageId = $callback['message']['message_id'] ?? null;
            $data = $callback['data'] ?? '';
            $queryId = $callback['id'] ?? null;

            // Hentikan animasi loading di tombol Telegram
            if ($queryId) {
                Http::post("https://api.telegram.org/bot{$token}/answerCallbackQuery", [
                    'callback_query_id' => $queryId
                ]);
            }

            if ($chatId) {
                if ($data === 'menu_main' || $data === 'menu_refresh') {
                    $this->sendMenu($chatId, $token, $messageId, true);
                
                } elseif ($data === 'menu_firewall') {
                    $this->sendFirewallStatus($chatId, $token, $messageId, true);
                
                } elseif (str_starts_with($data, 'unblock_ip_')) {
                    // AKSI: UNBLOCK 1 IP (LEBIH CERDAS TANPA ID)
                    $ip = str_replace('unblock_ip_', '', $data);
                    
                    // Hapus dari semua lapisan cache & database
                    Cache::forget('rate_limit_' . str_replace(':', '_', $ip));
                    DB::table('banned_ips')->where('ip', $ip)->delete();
                    
                    $this->sendTextMessage($chatId, $token, "✅ *SUKSES!* IP `{$ip}` berhasil di-unblock dan dipulihkan!");
                    $this->sendFirewallStatus($chatId, $token, $messageId, true);
                
                } elseif ($data === 'unblock_all') {
                    // AKSI: UNBLOCK SEMUA IP
                    $allBanned = DB::table('banned_ips')->get();
                    foreach ($allBanned as $b) {
                        Cache::forget('rate_limit_' . str_replace(':', '_', $b->ip));
                    }
                    DB::table('banned_ips')->truncate(); 
                    $this->sendTextMessage($chatId, $token, "💥 *MASS UNBLOCK SUKSES!*\nSeluruh IP ({$allBanned->count()} IP) telah dibebaskan dari daftar hitam.");
                    $this->sendFirewallStatus($chatId, $token, $messageId, true);
                }
            }
            return response()->json(['status' => 'ok']);
        }

        // 🌟 2. TANGANI PESAN TEKS (COMMAND)
        if (!isset($update['message'])) {
            return response()->json(['status' => 'ok']);
        }

        $message = $update['message'];
        $chatId = $message['chat']['id'] ?? null;
        $text = trim($message['text'] ?? '');

        if (!$chatId) return response()->json(['status' => 'ok']);

        if ($text === '/start' || $text === '/menu') {
            $this->sendMenu($chatId, $token);
            return response()->json(['status' => 'ok']);
        }

        if (str_starts_with($text, '/firewall') || str_starts_with($text, '/security')) {
            $this->sendFirewallStatus($chatId, $token);
            return response()->json(['status' => 'ok']);
        }

        return response()->json(['status' => 'ok']);
    }

    private function sendMenu($chatId, $token, $messageId = null, $isEdit = false)
    {
        $text = "🤖 *MILASTORE COMMAND CENTER* 🤖\n\n";
        $text .= "Selamat datang Sultan! Sistem Navigasi aktif.\nSilakan pilih menu kontrol di bawah ini:\n";

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '🛡️ Status Firewall & Banned IPs', 'callback_data' => 'menu_firewall']
                ],
                [
                    ['text' => '🔄 Refresh Menu', 'callback_data' => 'menu_refresh']
                ]
            ]
        ];

        $this->sendOrEditMessage($chatId, $token, $text, $keyboard, $messageId, $isEdit);
    }

    private function sendFirewallStatus($chatId, $token, $messageId = null, $isEdit = false)
    {
        $bannedCount = DB::table('banned_ips')->count();
        $latestBanned = DB::table('banned_ips')->orderBy('created_at', 'desc')->limit(5)->get();

        $text = "🛡️ *PANGKALAN KONTROL KEAMANAN MILASTORE* 🛡️\n\n";
        $text .= "🔴 Total IP Terblokir: *{$bannedCount} IP*\n\n";

        $keyboard = ['inline_keyboard' => []];

        if ($latestBanned->count() > 0) {
            $text .= "📋 *5 IP Terakhir yang Diblokir:*\n";
            foreach ($latestBanned as $b) {
                // Tarik data forensik dari log keamanan agar menu lebih cerdas
                $log = DB::table('security_logs')->where('ip', $b->ip)->orderBy('created_at', 'desc')->first();
                $extraInfo = $log ? "\n  📍 _" . $log->pattern . "_" : "";
                
                $text .= "• `{$b->ip}`\n  Alasan: {$b->reason}{$extraInfo}\n\n";
                
                // Tombol Unblock Satuan
                $keyboard['inline_keyboard'][] = [
                    ['text' => "🔓 Unblock IP: {$b->ip}", 'callback_data' => "unblock_ip_{$b->ip}"]
                ];
            }
            
            // Tombol Sapu Jagat
            if ($bannedCount > 0) {
                $keyboard['inline_keyboard'][] = [
                    ['text' => "💥 UNBLOCK SEMUA IP ({$bannedCount}) 💥", 'callback_data' => "unblock_all"]
                ];
            }
        } else {
            $text .= "✅ _Tidak ada IP aktif yang diblokir. Sistem aman dari penyusup!_\n\n";
        }

        // Tombol Navigasi Bawah
        $keyboard['inline_keyboard'][] = [
            ['text' => '🔄 Refresh', 'callback_data' => 'menu_firewall'],
            ['text' => '« Menu Utama', 'callback_data' => 'menu_main']
        ];

        $this->sendOrEditMessage($chatId, $token, $text, $keyboard, $messageId, $isEdit);
    }

    private function sendTextMessage($chatId, $token, $text)
    {
        Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown'
        ]);
    }

    private function sendOrEditMessage($chatId, $token, $text, $keyboard, $messageId = null, $isEdit = false)
    {
        $endpoint = ($isEdit && $messageId) ? "editMessageText" : "sendMessage";
        $params = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode($keyboard)
        ];
        
        if ($isEdit && $messageId) {
            $params['message_id'] = $messageId;
        }

        Http::post("https://api.telegram.org/bot{$token}/{$endpoint}", $params);
    }
}
