<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        // 👑 DETEKSI OTOMATIS: JALUR VIP ADMIN & PANEL ADMIN
        try {
            // 1. Selalu bebaskan semua rute yang berawalan 'admin' atau 'dashboard' jika sudah login
            if ($request->is('admin*') || $request->is('dashboard*') || $request->is('login') || $request->is('logout') || $request->is('auth/*')) {
                if (auth()->check()) {
                    return $next($request);
                }
            }

            // 2. Karpet merah mutlak untuk User ID 1 atau Email Utama
            if (auth()->check()) {
                $userId = auth()->id();
                $email = strtolower(auth()->user()->email ?? '');
                
                if ($userId === 1 || $email === 'amifistore@gmail.com') {
                    return $next($request);
                }
            }
        } catch (\Exception $e) {}

        $file = storage_path('framework/maintenance_config.json');
        
        if (!file_exists($file)) {
            return $next($request);
        }

        $config = json_decode(file_get_contents($file), true);
        $isManual = filter_var($config['manual'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $mode = $config['mode'] ?? 'total';

        if (!$isManual) {
            return $next($request);
        }

        // Izinkan akses ke halaman maintenance
        if ($request->is('maintenance*')) {
            return $next($request);
        }

        // Cek IP Whitelist
        $whitelist = array_filter(array_map('trim', explode(',', $config['whitelist'] ?? '')));
        $clientIp = $request->ip();

        if (!empty($whitelist) && in_array($clientIp, $whitelist)) {
            return $next($request);
        }

        // Jika mode total, arahkan ke halaman maintenance
        if ($mode === 'total') {
            return redirect()->route('maintenance.index');
        }

        return $next($request);
    }
}
