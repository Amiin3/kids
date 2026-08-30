<?php
namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmHelper {
    private static function getAccessToken() {
        $jsonPath = storage_path('app/firebase-service-account.json');
        if (!file_exists($jsonPath)) {
            Log::error('❌ [FCM v1 FAIL] File firebase-service-account.json tidak ditemukan!');
            return null;
        }

        $config = json_decode(file_get_contents($jsonPath), true);
        $now = time();
        
        $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'iss'   => $config['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'exp'   => $now + 3600,
            'iat'   => $now
        ]));

        $unsignedJwt = rtrim(strtr($header, '+/', '-_'), '=') . '.' . rtrim(strtr($payload, '+/', '-_'), '=');
        $signature = '';
        openssl_sign($unsignedJwt, $signature, $config['private_key'], OPENSSL_ALGO_SHA256);
        $jwt = $unsignedJwt . '.' . rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt
        ]);

        if ($response->successful()) {
            return $response->json('access_token');
        }

        Log::error('❌ [FCM v1 FAIL] Gagal Auth Google: ' . $response->body());
        return null;
    }

    public static function sendNotification($to, $title, $body, $url = 'https://milastore.cloud/riwayat') {
        if (empty($to)) return false;

        $accessToken = self::getAccessToken();
        if (!$accessToken) return false;

        $projectId = 'amifi-store';
        $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        $response = Http::withToken($accessToken)
            ->post($endpoint, [
                'message' => [
                    'token' => $to,
                    'notification' => [
                        'title' => $title,
                        'body'  => $body,
                    ],
                    'data' => [
                        'target_url' => $url,
                    ],
                    'android' => [
                        'priority' => 'HIGH',
                        'notification' => [
                            'sound' => 'default',
                            'click_action' => 'FLUTTER_NOTIFICATION_CLICK'
                        ]
                    ]
                ]
            ]);

        if ($response->successful()) {
            Log::info("📡 [FCM v1 SEND] Sukses -> Token: " . substr($to, 0, 15) . "... | Judul: " . $title);
            return true;
        } else {
            Log::error("❌ [FCM v1 FAIL] Respons Google: " . $response->body());
            return false;
        }
    }
}
