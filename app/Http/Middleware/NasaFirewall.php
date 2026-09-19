<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use App\Services\TelegramService;

class NasaFirewall
{
    public function handle(Request $request, Closure $next)
    {
        $ip = $request->header('CF-Connecting-IP', $request->header('X-Forwarded-For', $request->ip()));
        if (str_contains($ip, ',')) $ip = trim(explode(',', $ip)[0]);

        $rawUserAgent = $request->header('User-Agent', '');
        $warEngineKey = $request->header('X-War-Engine-Key', '');
        $whitelistIPs = ['159.223.185.13', '127.0.0.1', '103.93.134.214', '103.150.197.225'];
        
        if (in_array($ip, $whitelistIPs) || $warEngineKey === 'SULTAN_MILA_2026') return $next($request);

        $whitelistRoutes = ['api/telegram/*', 'api/telegram/webhook', 'webhook/*', 'api/payment/*', 'api/callback/*', 'api/war-machine/*', 'socket.io/*', 'socket.io'];
        if (str_contains($request->path(), "webhook") || str_contains($request->path(), "khfy") || str_contains($request->path(), "digiflazz") || str_contains($request->path(), "kaje") || str_contains($request->path(), "adammedia") || str_contains($request->path(), "bot-wa")) return $next($request);
        foreach ($whitelistRoutes as $route) {
            if ($request->is($route)) return $next($request);
        }

        $isBanned = DB::table('banned_ips')->where('ip', $ip)->first();
        if ($isBanned) abort(403, "🛡️ MILASTORE NASA FIREWALL: IP ANDA TELAH DIBLOKIR KARENA AKTIVITAS ILEGAL.");

        // 🌟 REVISI: DILONGGARKAN MENJADI 2500 REQ/MENIT (KARENA SUDAH ADA CLOUDFLARE)
        $rateKey = 'rate_limit_' . str_replace(':', '_', $ip);
        if (!Cache::has($rateKey)) {
            Cache::put($rateKey, 1, now()->addMinute());
        } else {
            Cache::increment($rateKey);
        }
        if (Cache::get($rateKey) > 2500) {
            $this->punishAndAlert($request, $ip, "DDoS / Bruteforce Attack (>2500 req/min)");
            abort(429, "🛡️ MILASTORE NASA FIREWALL: TERLALU BANYAK PERMINTAAN.");
        }

        $allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
        if (!in_array($request->method(), $allowedMethods)) $this->punishAndAlert($request, $ip, "Anomalous HTTP Method: " . $request->method());
        if (strlen($request->fullUrl()) > 2000) $this->punishAndAlert($request, $ip, "Buffer Overflow Attempt");

        foreach ($request->allFiles() as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $badExtensions = ['php', 'php3', 'php4', 'php5', 'phtml', 'sh', 'bash', 'exe', 'bat', 'cmd', 'py', 'pl', 'jsp', 'asp', 'cgi'];
            if (in_array($extension, $badExtensions)) $this->punishAndAlert($request, $ip, "Malicious File Upload Attempt: ." . $extension);
        }

        $userAgent = strtolower($rawUserAgent);
        $uaBadPatterns = ['<script', 'union select', 'jndi:ldap', 'base64_decode'];
        foreach ($uaBadPatterns as $uaPat) { if (str_contains($userAgent, $uaPat)) $this->punishAndAlert($request, $ip, "Header Injection Payload"); }
        
        $badBots = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'dirbuster', 'gobuster', 'wpscan', 'acunetix', 'burpsuite'];
        foreach ($badBots as $bot) { if (str_contains($userAgent, $bot)) $this->punishAndAlert($request, $ip, "Automated Hacking Tool: " . strtoupper($bot)); }

        $path = strtolower($request->getPathInfo());
        $trapPaths = ['/.env', '/.git', '/wp-admin', '/wp-login.php', '/config.php', '/phpinfo.php', '/xmlrpc.php', '/vendor/', '/backup/'];
        foreach ($trapPaths as $trap) { if (str_contains($path, $trap)) $this->punishAndAlert($request, $ip, "Honeypot Triggered (" . $trap . ")"); }

        $badPatterns = [
            '/union\s+select/i' => 'SQL Injection (Union Based)', '/select\s+.*\s+from/i' => 'SQL Injection (Select Data)',
            '/insert\s+into/i' => 'SQL Injection (Insert)', '/drop\s+table/i' => 'SQL Injection (Drop Table)',
            '/<script.*?>/i' => 'Cross-Site Scripting (XSS)', '/javascript:/i' => 'XSS (JS URI Scheme)',
            '/\.\.\/\.\.\//' => 'Directory Traversal (LFI/RFI)', '/etc\/passwd/i' => 'Local File Inclusion (/etc/passwd)',
            '/eval\s*\(/i' => 'Remote Code Execution (Eval)', '/base64_decode\s*\(/i' => 'Malicious Payload (Base64)',
            '/system\s*\(/i' => 'System Command Execution', '/exec\s*\(/i' => 'System Command Execution',
            '/(?:%00|\\x00)/' => 'Null Byte Injection', '/(?:\/bash|\/sh|\/zsh|\/bin)/' => 'Shell Script Execution'
        ];
        
        $input = urldecode(substr($request->fullUrl() . json_encode($request->all()), 0, 5000));
        foreach ($badPatterns as $pattern => $attackName) {
            if (preg_match($pattern, $input)) $this->punishAndAlert($request, $ip, $attackName);
        }
        return $next($request);
    }

    private function punishAndAlert(Request $request, $ip, $reason)
    {
        $url = substr($request->fullUrl(), 0, 500);
        $payload = substr(json_encode($request->all()), 0, 300);
        $rawUserAgent = $request->header('User-Agent', 'Tidak Ada User-Agent');
        $deviceInfo = $this->parseUserAgent($rawUserAgent);
        
        $locInfo = ['country' => 'Unknown', 'city' => 'Unknown', 'isp' => 'Unknown', 'connection_type' => '❌ Bersih (Res/Mobile)'];
        try {
            $response = Http::timeout(2)->get("http://ip-api.com/json/{$ip}?fields=status,country,city,isp,proxy,hosting");
            if ($response->successful() && $response['status'] === 'success') {
                $locInfo['country'] = $response['country'] ?? 'Unknown'; $locInfo['city'] = $response['city'] ?? 'Unknown'; $locInfo['isp'] = $response['isp'] ?? 'Unknown';
                if (isset($response['proxy']) && $response['proxy'] === true) $locInfo['connection_type'] = '⚠️ VPN / Proxy Terdeteksi';
                elseif (isset($response['hosting']) && $response['hosting'] === true) $locInfo['connection_type'] = '⚠️ Server Data Center';
            }
        } catch (\Exception $e) {}

        DB::table('banned_ips')->updateOrInsert(['ip' => $ip], ['reason' => $reason, 'expired_at' => now()->addDays(365), 'updated_at' => now()]);
        DB::table('security_logs')->insert(['ip' => $ip, 'url' => $url, 'pattern' => "Threat: $reason | OS: {$deviceInfo['os']} | Loc: {$locInfo['city']}, {$locInfo['country']}", 'created_at' => now(), 'updated_at' => now()]);

        $msg = "🚨 *[CYBER DEFENSE] - THREAT BLOCKED* 🚨\n\n👤 *[ PELAKU ]*\n• *IP:* `$ip`\n• *Lokasi:* `${locInfo['city']}, ${locInfo['country']}`\n• *Tipe Koneksi:* ${locInfo['connection_type']}\n\n⚔️ *[ DETAIL SERANGAN ]*\n• *Ancaman:* `$reason`\n• *Target URL:* `$url`\n\n🛡️ *TINDAKAN:* IP telah di-Banned permanen 365 Hari.";
        try { TelegramService::sendMessage($msg); } catch (\Exception $e) {}
        abort(403, "🛡️ MILASTORE NASA FIREWALL: SERANGAN TERDETEKSI & IP DIBLOKIR.");
    }

    private function parseUserAgent($ua)
    {
        $result = ['os' => 'Unknown']; $uaLower = strtolower($ua);
        if (str_contains($uaLower, 'windows')) $result['os'] = 'Windows';
        elseif (str_contains($uaLower, 'android')) $result['os'] = 'Android';
        elseif (str_contains($uaLower, 'iphone') || str_contains($uaLower, 'mac os')) $result['os'] = 'Apple iOS/Mac';
        elseif (str_contains($uaLower, 'linux')) $result['os'] = 'Linux';
        return $result;
    }
}
