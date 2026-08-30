<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Services\TelegramService;
use App\Services\Telegram\SecurityModule;
use App\Services\Telegram\FinanceModule;
use App\Services\Telegram\SystemModule;
use App\Services\Telegram\OsintModule;

class TelegramBotController extends Controller
{
    public function webhook(Request $request)
    {
        try {
            $update = $request->all();

            if (isset($update['callback_query'])) {
                $callback = $update['callback_query'];
                $chatId = $callback['message']['chat']['id'];
                $messageId = $callback['message']['message_id'];
                $data = $callback['data'];

                $this->answerCallback($callback['id']);
                if (!$this->isAdmin($chatId)) return response()->json(['status' => 'ok']);

                $this->handleCallback($chatId, $messageId, $data);
                return response()->json(['status' => 'ok']);
            }

            if (isset($update['message']['text'])) {
                $chatId = $update['message']['chat']['id'];
                $text = trim($update['message']['text']);

                if (!$this->isAdmin($chatId)) return response()->json(['status' => 'ok']);
                $this->handleCommand($chatId, $text);
            }

            return response()->json(['status' => 'ok']);
        } catch (\Throwable $e) {
            Log::error("🔥 Telegram Bot Error: " . $e->getMessage());
            return response()->json(['status' => 'ok']);
        }
    }

    private function answerCallback($callbackId)
    {
        try {
            $token = TelegramService::getSecret('TELEGRAM_BOT_TOKEN');
            Http::timeout(3)->post("https://api.telegram.org/bot{$token}/answerCallbackQuery", ['callback_query_id' => $callbackId]);
        } catch (\Throwable $e) {}
    }

    private function isAdmin($chatId)
    {
        $adminChatId = TelegramService::getSecret('TELEGRAM_CHAT_ID');
        return (string)$chatId === (string)$adminChatId;
    }

    private function handleCommand($chatId, $text)
    {
        $textLower = strtolower($text);
        if ($textLower === '/start' || $textLower === '/menu') {
            $this->sendMainMenu($chatId);
        } elseif (str_starts_with($textLower, '/osint')) {
            $target = trim(str_ireplace('/osint', '', $text));
            if (empty($target)) {
                TelegramService::sendMessage("⚠️ *Format Salah*\nGunakan: `/osint [IP atau No HP]`", null, false, $chatId);
            } else {
                $res = OsintModule::lookup($target);
                if ($res['status'] === 'success') {
                    if ($res['type'] === 'ip') {
                        $d = $res['data'];
                        TelegramService::sendMessage("🔍 *OSINT IP Address:*\n• IP: `{$d['query']}`\n• Negara: `{$d['country']}`\n• Kota: `{$d['city']}`\n• ISP: `{$d['isp']}`", null, false, $chatId);
                    } else {
                        $d = $res['data'];
                        TelegramService::sendMessage("🔍 *OSINT Nomor HP:*\n• Nomor: `{$d['number']}`\n• Provider: `{$d['provider']}`\n• Lokasi: `{$d['country']}`\n[🔎 Buka GetContact]({$d['getcontact']})", null, false, $chatId);
                    }
                } else {
                    TelegramService::sendMessage("❌ *OSINT Gagal:* " . $res['message'], null, false, $chatId);
                }
            }
        } else {
            TelegramService::sendMessage("🤖 *Perintah tidak dikenali*\nKetik `/menu` untuk membuka Command Center.", null, false, $chatId);
        }
    }

    private function handleCallback($chatId, $messageId, $data)
    {
        if (str_starts_with($data, 'unblock_')) {
            $ip = substr($data, 8);
            SecurityModule::unblockIp($ip);
            $this->showBannedList($chatId, $messageId, "✅ *Berhasil!* IP `{$ip}` telah di-unblock.");
            return;
        }

        switch ($data) {
            case 'menu_main':
                $this->editMainMenu($chatId, $messageId);
                break;
            case 'sec_menu':
                $stats = SecurityModule::getStats();
                $msg = "🛡️ *SECURITY CENTER (PERISAI SAKTI)*\n\n📊 *Statistik Keamanan:*\n• Total Serangan: `{$stats['total_attacks']}`\n• IP Terblokir: `{$stats['banned_count']}`\n\nPilih tindakan di bawah ini:";
                $keyboard = [
                    [['text' => '🔎 SMART DEEP SCAN (Aman)', 'callback_data' => 'sec_run_scan']],
                    [['text' => '🛠️ SMART AUTO-FIX', 'callback_data' => 'sec_auto_fix']],
                    [['text' => '📋 Lihat & Unblock IP', 'callback_data' => 'sec_list_banned']],
                    [['text' => '🔙 Kembali ke Menu Utama', 'callback_data' => 'menu_main']]
                ];
                TelegramService::editMessageText($messageId, $msg, $chatId, $keyboard);
                break;
            case 'sec_run_scan':
                TelegramService::editMessageText($messageId, "⏳ *MEMULAI SMART SCAN...*\n_Memindai sistem dengan AI pintar. Tunggu sebentar..._", $chatId, []);
                $scan = SecurityModule::performUltraScan(false);
                $statusText = ($scan['issues'] == 0) ? "🎉 *STATUS: 100% AMAN PERFECT!*" : "🚨 *STATUS: BAHAYA!*\nDitemukan {$scan['issues']} Masalah Kritis.";
                $report = "🔥 *HASIL SMART DEEP SCAN* 🔥\n\n{$statusText}\n\n";
                foreach ($scan['details'] as $det) { $report .= "• " . $det['text'] . "\n"; }
                TelegramService::editMessageText($messageId, $report, $chatId, [
                    [['text' => '🛠️ LAKUKAN SMART AUTO-FIX', 'callback_data' => 'sec_auto_fix']],
                    [['text' => '🔙 Kembali ke Security', 'callback_data' => 'sec_menu']]
                ]);
                break;
            case 'sec_auto_fix':
                TelegramService::editMessageText($messageId, "🧬 *MEMULAI SMART SELF-HEALING...*\n_Menghapus script dan mengamankan file core..._", $chatId, []);
                $fix = SecurityModule::performUltraScan(true);
                $report = "💉 *LAPORAN SMART AUTO-FIX* 💉\n\n🩺 *PROSES HEALING SELESAI!*\nSukses membasmi *{$fix['fixed_count']}* celah.\n\n";
                foreach ($fix['details'] as $det) { $report .= "• " . $det['text'] . "\n"; }
                TelegramService::editMessageText($messageId, $report, $chatId, [
                    [['text' => '🔎 Scan Ulang', 'callback_data' => 'sec_run_scan']],
                    [['text' => '🔙 Kembali ke Security', 'callback_data' => 'sec_menu']]
                ]);
                break;
            case 'sec_list_banned':
                $this->showBannedList($chatId, $messageId);
                break;
            case 'sec_clear_banned':
                SecurityModule::clearAllBanned();
                $this->showBannedList($chatId, $messageId, "🔓 *Amnesti Global Berhasil!* Semua IP dilepaskan.");
                break;
            case 'fin_menu':
                $fin = FinanceModule::getSummary();
                $msg = "💰 *FINANCE & SYSTEM MONITOR*\n\n• Total Saldo Member: *{$fin['saldo_formatted']}*\n• Deposit Pending: *{$fin['depo_pending']} Tiket*\n• Transaksi Hari Ini: *{$fin['trx_today']} Trx*\n";
                $keyboard = [[['text' => '🔄 Refresh Data', 'callback_data' => 'fin_menu']], [['text' => '🔙 Kembali', 'callback_data' => 'menu_main']]];
                TelegramService::editMessageText($messageId, $msg, $chatId, $keyboard);
                break;
            case 'sys_menu':
                $sys = SystemModule::getDiagnostics();
                $msg = "⚙️ *SERVER TOOLS & DIAGNOSTIC*\n\n💻 *CPU Load:* `{$sys['cpu_load']}`\n🧠 *RAM Usage:* `{$sys['ram_used']} MB / {$sys['ram_total']} MB ({$sys['ram_perc']}%)`\n💽 *Disk Usage:* `{$sys['disk_usage']}`\n";
                $keyboard = [[['text' => '🧹 Clear Cache', 'callback_data' => 'sys_clear_cache']], [['text' => '🔙 Kembali', 'callback_data' => 'menu_main']]];
                TelegramService::editMessageText($messageId, $msg, $chatId, $keyboard);
                break;
            case 'sys_clear_cache':
                SystemModule::clearCache();
                TelegramService::editMessageText($messageId, "🧹 *Cache Laravel Dihapus!*\nSistem telah direfresh ulang.", $chatId, [[['text' => '🔙 Kembali', 'callback_data' => 'menu_main']]]);
                break;
        }
    }

    private function showBannedList($chatId, $messageId, $prefixMsg = '')
    {
        $stats = SecurityModule::getStats();
        $banned = $stats['banned_list']->take(10);
        $msg = $prefixMsg ? $prefixMsg . "\n\n" : "";

        if ($banned->isEmpty()) {
            $msg .= "✅  *Tidak ada IP yang terblokir saat ini.*";
            $keyboard = [[['text' => '🔙 Kembali ke Security', 'callback_data' => 'sec_menu']]];
        } else {
            $msg .= "📋 *DAFTAR IP TERBLOKIR (Top 12 Terbaru)*\nSilakan pilih IP yang ingin di-unblock:\n";
            $keyboard = [];
            foreach ($banned as $b) {
                $reason = substr($b->reason ?? 'Serangan', 0, 30) . '...';
                $msg .= "\n• `{$b->ip}`\n  └ _{$reason}_\n";
                $keyboard[] = [['text' => "🔓 Unblock: {$b->ip}", 'callback_data' => "unblock_{$b->ip}"]];
            }
            $keyboard[] = [['text' => '💥 Lepas Semua (Amnesti Total)', 'callback_data' => 'sec_clear_banned']];
            $keyboard[] = [['text' => '🔙 Kembali ke Security', 'callback_data' => 'sec_menu']];
        }
        TelegramService::editMessageText($messageId, $msg, $chatId, $keyboard);
    }

    private function getMainMenuText()
    {
        return "👑 *MILASTORE COMMAND CENTER* 👑\n_Remote Server Control - Mode Darurat_\n\nSelamat datang, Sultan `@LatsCore`! Silakan pilih menu di bawah ini atau Buka Panel Management modern:";
    }

    private function getMainMenuKeyboard()
    {
        return [
            [
                ['text' => '🚀 BUKA MILASTORE MANAGEMENT', 'web_app' => ['url' => 'https://milastore.cloud/telegram/management']]
            ],
            [
                ['text' => '🛡️ Security Center', 'callback_data' => 'sec_menu'],
                ['text' => '💰 Keuangan & Trx', 'callback_data' => 'fin_menu']
            ],
            [
                ['text' => '⚙️ Server Tools', 'callback_data' => 'sys_menu'],
                ['text' => '🌐 Buka Web Admin', 'url' => 'https://milastore.cloud/admin/cyber-security']
            ]
        ];
    }

    private function sendMainMenu($chatId)
    {
        TelegramService::sendMessage($this->getMainMenuText(), $this->getMainMenuKeyboard(), true, $chatId);
    }

    private function editMainMenu($chatId, $messageId)
    {
        TelegramService::editMessageText($messageId, $this->getMainMenuText(), $chatId, $this->getMainMenuKeyboard());
    }
}
