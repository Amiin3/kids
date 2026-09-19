<?php

namespace App\Http\Controllers;

use App\Helpers\FcmHelper;
use App\Helpers\OneSignalHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class AdminNotificationController extends Controller
{
    public function index()
    {
        return inertia('Admin/Notification/Index');
    }

    public function send(Request $request)
    {
        // 🛡️ FITUR 1: Validasi Input Anti-Crash
        $request->validate([
            'title'       => 'nullable|string|max:100',
            'body'        => 'required_without:message|string',
            'time'        => 'nullable|string',
            'hari'        => 'nullable|string',
            'target_role' => 'nullable|string',
            'action_url'  => 'nullable|string'
        ]);

        $title        = $request->input('title') ?? 'MILASTORE INFO';
        $body         = $request->input('body') ?? $request->input('message');
        $isAutopilot  = $request->input('is_autopilot', false);
        $time         = $request->input('time', '08:00');
        $hari         = $request->input('hari', 'Minggu');
        $targetRole   = $request->input('target_role', 'all');
        $actionUrl    = $request->input('action_url', '/notifikasi');

        if (!$body) {
            return back()->with('error', 'Pesan kosong, Bosku! Isi dulu!');
        }

        // 🤖 MODE AUTOPILOT (TERJADWAL)
        if ($isAutopilot) {
            $data = [
                'title'       => $title,
                'message'     => $body,
                'time'        => $time,
                'hari'        => $hari,
                'target_role' => $targetRole,
                'action_url'  => $actionUrl,
                'is_active'   => true,
                'type'        => stripos($title, 'promo') !== false ? 'promo' : 'system',
                'updated_at'  => now()->toDateTimeString()
            ];

            file_put_contents(storage_path('app/autopilot_broadcast.json'), json_encode($data, JSON_PRETTY_PRINT));
            return back()->with('success', "🤖 AUTOPILOT AKTIF! MILASTORE akan menembakkan rudal promo tiap hari {$hari} jam {$time} WIB.");
        }

        // 🚀 MODE INSTAN (TEMBAK SEKARANG)
        try {
            // 📡 1. Tembak Tower Node.js (Android Socket Real-time)
            try {
                Http::timeout(3)->post('http://127.0.0.1:3001/trigger-notif', [
                    'judul' => $title,
                    'pesan' => $body,
                    'url'   => $actionUrl
                ]);
            } catch (\Exception $e) {
                Log::error("[MILASTORE TOWER] Node.js Gagal Ditembak: " . $e->getMessage());
            }

            // 👥 2. Ambil User Sesuai Role
            $usersQuery = DB::table('users');
            if ($targetRole !== 'all') {
                // $usersQuery->where('role', $targetRole);
            }
            $users = $usersQuery->get();
            $countUsers = $users->count();

            // 📱 3. Tembak Android FCM v1 (Pola BotWaController)
            foreach ($users as $user) {
                $fcmToken = $user->fcm_token ?? $user->push_token ?? null;
                if (!empty($fcmToken)) {
                    try {
                        FcmHelper::sendNotification($fcmToken, $title, $body, $actionUrl);
                    } catch (\Exception $e) {
                        Log::error("[MILASTORE FCM BROADCAST] Gagal kirim ke user {$user->id}: " . $e->getMessage());
                    }
                }
            }

            // 📨 4. Tembak Email / Notif Sultan Ekstra
            foreach ($users as $user) {
                try {
                    if (!empty($user->email) && method_exists($this, 'kirimNotifSultan')) {
                        $this->kirimNotifSultan($user->email, $title, $body);
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            // 🌐 5. Tembak OneSignal (Web Push)
            try {
                if (class_exists('App\Helpers\OneSignalHelper')) {
                    OneSignalHelper::send($title, $body, ['url' => $actionUrl]);
                }
            } catch (\Exception $e) {
                Log::error("[MILASTORE PUSH] OneSignal Gagal: " . $e->getMessage());
            }

            // 💾 6. Simpan ke Database (Transaction Safeguard & Chunk Insert)
            DB::beginTransaction();
            try {
                $notificationsData = [];
                $now = now();

                foreach ($users as $u) {
                    $notificationsData[] = [
                        'id'              => Str::uuid()->toString(),
                        'type'            => 'App\Notifications\SystemBroadcast',
                        'notifiable_type' => 'App\Models\User',
                        'notifiable_id'   => $u->id,
                        'data'            => json_encode([
                            'title'   => $title,
                            'message' => $body,
                            'icon'    => stripos($title, 'promo') !== false ? 'fa-gift' : 'fa-bullhorn',
                            'type'    => stripos($title, 'promo') !== false ? 'promo' : 'system',
                            'url'     => $actionUrl
                        ]),
                        'created_at'      => $now,
                        'updated_at'      => $now,
                    ];
                }

                foreach (array_chunk($notificationsData, 500) as $chunk) {
                    DB::table('notifications')->insert($chunk);
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("[MILASTORE DB] Gagal simpan histori notif: " . $e->getMessage());
                return back()->with('error', 'Pesan terkirim ke HP, tapi gagal tersimpan di history. Hubungi Developer.');
            }

            return back()->with('success', "🚀 BROADCAST SULTAN SUKSES! Rudal MILASTORE & FCM berhasil mendarat di $countUsers member!");
        } catch (\Exception $e) {
            return back()->with('error', 'Sistem macet parah Bosku: ' . $e->getMessage());
        }
    }
}
