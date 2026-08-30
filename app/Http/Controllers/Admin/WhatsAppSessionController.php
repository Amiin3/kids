<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class WhatsAppSessionController extends Controller
{
    private string $botUrl = 'http://127.0.0.1:3333';
    private string $apiKey = 'MILA_SEC_v9B4xK8mP2qL7jW5nC3zR1hT6fD0yX5g';

    public function index()
    {
        return Inertia::render('Admin/WhatsApp/Index');
    }

    public function getStatus()
    {
        try {
            $response = Http::withHeaders(['X-API-KEY' => $this->apiKey])
                ->timeout(3)
                ->get("{$this->botUrl}/session/status");

            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'OFFLINE',
                'number' => null,
                'queue_count' => 0,
                'uptime' => 0,
                'memory' => '0 MB',
                'qr' => null
            ]);
        }
    }

    public function getLogs()
    {
        try {
            $response = Http::withHeaders(['X-API-KEY' => $this->apiKey])
                ->timeout(3)
                ->get("{$this->botUrl}/session/logs");

            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json(['status' => false, 'logs' => []]);
        }
    }

    public function requestPairing(Request $request)
    {
        $request->validate(['phone' => 'required']);

        try {
            $response = Http::withHeaders(['X-API-KEY' => $this->apiKey])
                ->timeout(12)
                ->post("{$this->botUrl}/session/pairing-code", [
                    'phone' => $request->phone
                ]);

            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function sendTestMessage(Request $request)
    {
        $request->validate([
            'phone' => 'required',
            'message' => 'required'
        ]);

        try {
            $response = Http::withHeaders(['X-API-KEY' => $this->apiKey])
                ->timeout(10)
                ->post("{$this->botUrl}/session/test-message", [
                    'phone' => $request->phone,
                    'message' => $request->message
                ]);

            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function logout()
    {
        try {
            $response = Http::withHeaders(['X-API-KEY' => $this->apiKey])
                ->timeout(10)
                ->post("{$this->botUrl}/session/logout");

            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
