<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeviceTokenController extends Controller
{
    public function updateToken(Request $request)
    {
        $request->validate([
            "token" => "required|string",
            "user_id" => "nullable"
        ]);

        $token = $request->input("token");
        $userId = $request->input("user_id") ?? auth()->id();

        try {
            if (!empty($userId)) {
                // Update token milik user spesifik
                DB::table("users")->where("id", $userId)->update([
                    "push_token" => $token,
                    "updated_at" => now()
                ]);
                $user = DB::table("users")->where("id", $userId)->first();
                Log::info("📱 [DEVICE CONNECTED] User: " . ($user->name ?? $userId) . " ({$userId}) berhasil sinkron token FCM.");
            } else {
                Log::info("📱 [DEVICE CONNECTED] Guest device terdaftar dengan token: " . substr($token, 0, 15) . "...");
            }

            return response()->json([
                "status" => true,
                "message" => "Token FCM berhasil disinkronisasi."
            ]);
        } catch (\Throwable $e) {
            Log::error("❌ [TOKEN SYNC ERROR]: " . $e->getMessage());
            return response()->json([
                "status" => false,
                "message" => "Gagal sinkronisasi token."
            ], 500);
        }
    }
}
