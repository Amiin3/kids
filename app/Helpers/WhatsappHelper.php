<?php
namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappHelper
{
    public static function send($target, $message)
    {
        try {
            // Tembak langsung ke Bot Node.js lokal (Port 3333) sesuai jalur asli sistem
            $response = Http::timeout(5)->post('http://127.0.0.1:3333/send-notif', [
                'target'  => $target,
                'message' => $message,
                'key'     => 'SULTAN_MILA_2026'
            ]);

            $res = $response->json();
            Log::info("WHATSAPP INFO (Target: $target): ", $res ?? []);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("WHATSAPP CRITICAL ERROR: " . $e->getMessage());
            return false;
        }
    }
}
