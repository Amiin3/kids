<?php
// 🛡️ MILASTORE SECURITY WAF: BLOCK BAD BOTS & SCANNERS
$bad_agents = ["Burp", "DirBuster", "Nmap", "sqlmap", "masscan", "nikto", "zaproxy", "Acunetix", "Netsparker"];
$user_agent = $_SERVER["HTTP_USER_AGENT"] ?? "";
foreach($bad_agents as $bot) {
    if(stripos($user_agent, $bot) !== false) {
        http_response_code(403);
        die("🛡️ MILASTORE SECURITY SYSTEM: AKSES DITOLAK! IP ANDA TEREKAM.");
    }
}

// 🛡️ MILASTORE SECURITY HEADERS: ANTI HACKING & SNIFFING
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("X-Content-Type-Options: nosniff");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
header("Referrer-Policy: strict-origin-when-cross-origin");
header_remove("X-Powered-By");


use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
