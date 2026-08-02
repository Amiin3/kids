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
        // 0. JALUR VVIP / WHITELIST ROUTE
        $whitelistRoutes = [
            'api/telegram/*', 
            'api/telegram/webhook',
            'webhook/*',
            'api/payment/*',
            'api/callback/*'
        ];

        foreach ($whitelistRoutes as $route) {
            if ($request->is($route)) {
                return $next($request);
            }
        }

        // 1. MENDAPATKAN REAL IP
        $ip = $request->header('CF-Connecting-IP', $request->header('X-Forwarded-For', $request->ip()));
        if (str_contains($ip, ',')) {
            $ip = trim(explode(',', $ip)[0]);
        }

        // 2. CEK BLACKLIST PERMANEN
        $isBanned = DB::table('banned_ips')->where('ip', $ip)->first();
        if ($isBanned) {
            abort(403, "🛡️ MILASTORE NASA FIREWALL: IP ANDA TELAH DIBLOKIR.");
        }

        // 3. RATE LIMITING (Max 150 req/min)
        $rateKey = 'rate_limit_' . str_replace(':', '_', $ip);
        $requests = Cache::get($rateKey, 0);
        if ($requests > 150) {
            $this->punishAndAlert($request, $ip, "DDoS / Bruteforce Attack ($requests req/min)");
            abort(429, "🛡️ MILASTORE NASA FIREWALL: TERLALU BANYAK PERMINTAAN.");
        }
        Cache::put($rateKey, $requests + 1, now()->addMinutes(1));

        // 4. STRICT HTTP METHOD & BUFFER OVERFLOW PROTECTION
        $allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
        if (!in_array($request->method(), $allowedMethods)) {
            $this->punishAndAlert($request, $ip, "Anomalous HTTP Method: " . $request->method());
        }

        if (strlen($request->fullUrl()) > 2000) {
            $this->punishAndAlert($request, $ip, "Buffer Overflow Attempt (URL Exceeds 2000 Chars)");
        }

        // 5. ANTI BACKDOOR / MALICIOUS FILE UPLOAD SCANNER
        foreach ($request->allFiles() as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $badExtensions = ['php', 'php3', 'php4', 'php5', 'phtml', 'sh', 'bash', 'exe', 'bat', 'cmd', 'py', 'pl', 'jsp', 'asp', 'cgi'];
            if (in_array($extension, $badExtensions)) {
                $this->punishAndAlert($request, $ip, "Malicious File Upload Attempt (Backdoor/Shell): ." . $extension);
            }
        }

        // 6. ANALISIS USER-AGENT
        $rawUserAgent = $request->header('User-Agent', '');
        $userAgent = strtolower($rawUserAgent);
        
        $uaBadPatterns = ['<script', 'union select', 'jndi:ldap', 'base64_decode'];
        foreach ($uaBadPatterns as $uaPat) {
            if (str_contains($userAgent, $uaPat)) {
                $this->punishAndAlert($request, $ip, "Header Injection: Payload Berbahaya di User-Agent");
            }
        }

        $badBots = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'dirbuster', 'gobuster', 'wpscan', 'acunetix', 'burpsuite'];
        foreach ($badBots as $bot) {
            if (str_contains($userAgent, $bot)) {
                $this->punishAndAlert($request, $ip, "Automated Hacking Tool Detected: " . strtoupper($bot));
            }
        }

        // 7. HONEYPOT / PATH TRAP
        $path = strtolower($request->getPathInfo());
        $trapPaths = ['/.env', '/.git', '/wp-admin', '/wp-login.php', '/config.php', '/phpinfo.php', '/xmlrpc.php', '/vendor/', '/backup/'];
        foreach ($trapPaths as $trap) {
            if (str_contains($path, $trap)) {
                $this->punishAndAlert($request, $ip, "Honeypot Triggered: Mencari celah file sensitif (" . $trap . ")");
            }
        }

        // 8. WAF PATTERNS (Anti Injeksi)
        $badPatterns = [
            '/union\s+select/i' => 'SQL Injection (Union Based)',
            '/select\s+.*\s+from/i' => 'SQL Injection (Select Data)',
            '/insert\s+into/i' => 'SQL Injection (Insert Statement)',
            '/drop\s+table/i' => 'SQL Injection (Drop Table)',
            '/<script.*?>/i' => 'Cross-Site Scripting (XSS)',
            '/javascript:/i' => 'XSS (JavaScript URI Scheme)',
            '/\.\.\/\.\.\//' => 'Directory Traversal (LFI/RFI)',
            '/etc\/passwd/i' => 'Local File Inclusion (/etc/passwd)',
            '/eval\(/i' => 'Remote Code Execution (Eval RCE)',
            '/base64_decode\(/i' => 'Malicious Payload (Base64 Decode)',
            '/system\(/i' => 'System Command Execution',
            '/exec\(/i' => 'System Command Execution',
            '/(?:%00|\\x00)/' => 'Null Byte Injection',
            '/(?:\/bash|\/sh|\/zsh|\/bin)/' => 'Shell Script Execution Attempt',
            '/information_schema/i' => 'Database Schema Reconnaissance'
        ];

        $input = urldecode($request->fullUrl() . json_encode($request->all()));

        foreach ($badPatterns as $pattern => $attackName) {
            if (preg_match($pattern, $input)) {
                $this->punishAndAlert($request, $ip, $attackName . " (Pattern Match)");
            }
        }

        return $next($request);
    }

    private function punishAndAlert(Request $request, $ip, $reason)
    {
        $url = substr($request->fullUrl(), 0, 500);
        $payload = substr(json_encode($request->all()), 0, 300);
        $method = $request->method();
        $rawUserAgent = $request->header('User-Agent', 'Tidak Ada User-Agent');
        $waktu = now()->timezone('Asia/Jakarta')->format('d-M-Y H:i:s \W\I\B');

        $deviceInfo = $this->parseUserAgent($rawUserAgent);

        $locInfo = [
            'country' => 'Tidak Diketahui',
            'region' => 'Tidak Diketahui',
            'city' => 'Tidak Diketahui',
            'zip' => '-',
            'timezone' => 'Tidak Diketahui',
            'isp' => 'Tidak Diketahui',
            'asn' => 'Tidak Diketahui',
            'coords' => 'Tidak Diketahui',
            'connection_type' => '❌ Bersih (Residential/Mobile)'
        ];
        
        try {
            $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}?fields=status,country,regionName,city,zip,lat,lon,timezone,isp,as,proxy,hosting");
            if ($response->successful() && $response['status'] === 'success') {
                $locInfo['country'] = $response['country'] ?? 'Tidak Diketahui';
                $locInfo['region'] = $response['regionName'] ?? 'Tidak Diketahui';
                $locInfo['city'] = $response['city'] ?? 'Tidak Diketahui';
                $locInfo['zip'] = $response['zip'] ?? '-';
                $locInfo['timezone'] = $response['timezone'] ?? 'Tidak Diketahui';
                $locInfo['isp'] = $response['isp'] ?? 'Tidak Diketahui';
                $locInfo['asn'] = $response['as'] ?? 'Tidak Diketahui';
                $locInfo['coords'] = ($response['lat'] && $response['lon']) ? $response['lat'] . ',' . $response['lon'] : 'Tidak Diketahui';
                
                if (isset($response['proxy']) && $response['proxy'] === true) {
                    $locInfo['connection_type'] = '⚠️ Terdeteksi Proxy / VPN';
                } elseif (isset($response['hosting']) && $response['hosting'] === true) {
                    $locInfo['connection_type'] = '⚠️ Server Data Center / Cloud Hosting';
                }
            }
        } catch (\Exception $e) {}

        $mapsLink = ($locInfo['coords'] !== 'Tidak Diketahui') 
            ? "https://www.google.com/maps/search/?api=1&query=" . urlencode($locInfo['coords']) 
            : "Tidak Tersedia";

        DB::table('banned_ips')->updateOrInsert(
            ['ip' => $ip],
            ['reason' => $reason, 'expired_at' => now()->addDays(365), 'updated_at' => now()]
        );

        DB::table('security_logs')->insert([
            'ip' => $ip,
            'url' => $url,
            'pattern' => "Threat: $reason | OS: {$deviceInfo['os']} | Loc: {$locInfo['city']}, {$locInfo['country']}",
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        $msg = "🚨 *[MILASTORE CYBER DEFENSE] - CRITICAL THREAT* 🚨\n\n";

        $msg .= "👤 *[ IDENTITAS & LOKASI PENYERANG ]*\n";
        $msg .= "• *IP Address:* `" . $ip . "`\n";
        $msg .= "• *Estimasi Alamat:* `" . $locInfo['city'] . ", " . $locInfo['region'] . ", " . $locInfo['country'] . " - " . $locInfo['zip'] . "`\n";
        $msg .= "• *Titik Koordinat:* `" . $locInfo['coords'] . "`\n";
        $msg .= "• *Buka di Peta:* [Klik Google Maps](" . $mapsLink . ")\n";
        $msg .= "• *Organisasi (ASN):* `" . $locInfo['asn'] . "`\n";
        $msg .= "• *ISP / Provider:* `" . $locInfo['isp'] . "`\n";
        $msg .= "• *Status Jaringan:* " . $locInfo['connection_type'] . "\n\n";

        $msg .= "💻 *[ INFORMASI PERANGKAT & DEVICE ]*\n";
        $msg .= "• *Kategori Perangkat:* `" . $deviceInfo['type'] . "`\n";
        $msg .= "• *Sistem Operasi:* `" . $deviceInfo['os'] . "`\n";
        $msg .= "• *Browser / Engine:* `" . $deviceInfo['browser'] . "`\n";
        $msg .= "• *Raw User-Agent:*\n`" . $rawUserAgent . "`\n\n";

        $msg .= "⚔️ *[ DETAIL SERANGAN & FORENSIK ]*\n";
        $msg .= "• *Waktu Kejadian:* `" . $waktu . "`\n";
        $msg .= "• *Jenis Ancaman:* `" . $reason . "`\n";
        $msg .= "• *Metode HTTP:* `" . $method . "`\n";
        $msg .= "• *URL Target:*\n`" . $url . "`\n";
        
        if ($payload !== '[]' && !empty($payload)) {
            $msg .= "• *Payload Data:*\n`" . $payload . "`\n\n";
        } else {
            $msg .= "\n";
        }

        $msg .= "🛡️ *TINDAKAN:* IP otomatis masuk Blacklist (Banned 365 Hari).\n";
        
        try {
            // Mengirim notifikasi menggunakan TelegramService bawaan Anda
            TelegramService::sendMessage($msg);
        } catch (\Exception $e) {}

        abort(403, "🛡️ MILASTORE NASA FIREWALL: SERANGAN TERDETEKSI & DIBLOKIR.");
    }

    private function parseUserAgent($ua)
    {
        $result = [
            'type' => 'Desktop / PC',
            'os' => 'Tidak Diketahui',
            'browser' => 'Tidak Diketahui / Custom Script'
        ];

        $uaLower = strtolower($ua);

        if (str_contains($uaLower, 'mobile') || str_contains($uaLower, 'android') || str_contains($uaLower, 'iphone')) {
            $result['type'] = 'Mobile Smartphone';
        } elseif (str_contains($uaLower, 'ipad') || str_contains($uaLower, 'tablet')) {
            $result['type'] = 'Tablet Device';
        } elseif (str_contains($uaLower, 'bot') || str_contains($uaLower, 'crawler') || str_contains($uaLower, 'scanner') || str_contains($uaLower, 'http') || empty($uaLower)) {
            $result['type'] = 'Bot / API Service / Script';
        }

        if (str_contains($uaLower, 'windows nt 10')) $result['os'] = 'Windows 10 / 11';
        elseif (str_contains($uaLower, 'windows nt 6.3')) $result['os'] = 'Windows 8.1';
        elseif (str_contains($uaLower, 'windows nt 6.1')) $result['os'] = 'Windows 7';
        elseif (str_contains($uaLower, 'android')) {
            preg_match('/android\s([0-9\.]+)/i', $ua, $matches);
            $result['os'] = 'Android ' . ($matches[1] ?? '');
        }
        elseif (str_contains($uaLower, 'iphone') || str_contains($uaLower, 'ipad')) {
            preg_match('/os\s([0-9_]+)/i', $ua, $matches);
            $result['os'] = 'iOS ' . (str_replace('_', '.', $matches[1] ?? ''));
        }
        elseif (str_contains($uaLower, 'mac os x')) $result['os'] = 'Mac OS X';
        elseif (str_contains($uaLower, 'linux')) $result['os'] = 'Linux Server / Desktop';

        if (str_contains($uaLower, 'edg/')) $result['browser'] = 'Microsoft Edge';
        elseif (str_contains($uaLower, 'chrome/')) $result['browser'] = 'Google Chrome';
        elseif (str_contains($uaLower, 'firefox/')) $result['browser'] = 'Mozilla Firefox';
        elseif (str_contains($uaLower, 'safari/') && !str_contains($uaLower, 'chrome')) $result['browser'] = 'Apple Safari';
        elseif (str_contains($uaLower, 'opera') || str_contains($uaLower, 'opr/')) $result['browser'] = 'Opera Browser';

        return $result;
    }
}
