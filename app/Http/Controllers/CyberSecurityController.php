<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CyberSecurityController extends Controller
{
    public function index(Request $request)
    {
        try {
            $totalAttacks = DB::table('security_logs')->count();
            $bannedIps = DB::table('banned_ips')->count();
            $recentLogs = DB::table('security_logs')->orderBy('created_at', 'desc')->limit(25)->get();
            $bannedList = DB::table('banned_ips')->orderBy('created_at', 'desc')->get();
        } catch (\Exception $e) {
            Log::error("Cyber Security Engine Error: " . $e->getMessage());
            $totalAttacks = 0; $bannedIps = 0; $recentLogs = []; $bannedList = [];
        }

        return inertia('CyberSecurity/Dashboard', [
            'stats' => ['total_attacks' => $totalAttacks, 'banned_ips' => $bannedIps],
            'recent_logs' => $recentLogs,
            'banned_list' => $bannedList,
        ]);
    }

    public function unblockIp(Request $request)
    {
        DB::table('banned_ips')->where('id', $request->input('id'))->delete();
        return response()->json(['status' => 'success', 'message' => 'IP berhasil di-unblock!']);
    }

    public function clearLogs()
    {
        DB::table('security_logs')->truncate();
        return response()->json(['status' => 'success', 'message' => 'Log serangan berhasil dikosongkan!']);
    }

    public function scanMalware()
    {
        $directories = [public_path('uploads'), public_path('images'), storage_path('app/public')];
        $infected = [];
        $scannedCount = 0;

        $badSignatures = [
            '/eval\s*\(/i' => 'RCE (Eval Execution)',
            '/base64_decode\s*\(/i' => 'Obfuscated Payload (Base64)',
            '/shell_exec\s*\(/i' => 'Server Shell Execution',
            '/system\s*\(/i' => 'System Command Execution',
            '/passthru\s*\(/i' => 'Passthru Execution',
            '/phpinfo\s*\(/i' => 'Server Reconnaissance',
            '/(?:wso2|b374k|indoxploit)/i' => 'Known Web Shell Signature'
        ];

        foreach ($directories as $dir) {
            if (!File::exists($dir)) continue;
            $files = File::allFiles($dir);
            foreach ($files as $file) {
                $scannedCount++;
                $ext = strtolower($file->getExtension());
                if ($file->getSize() > 5000000) continue; 

                $content = file_get_contents($file->getRealPath());

                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
                    if (str_contains(strtolower($content), '<?php')) {
                        $infected[] = ['file' => $file->getFilename(), 'path' => $file->getRealPath(), 'threat' => 'CRITICAL: Gambar beracun (Mengandung Script PHP)'];
                    }
                    continue;
                }

                if (in_array($ext, ['php', 'phtml', 'sh', 'js', 'txt', 'html'])) {
                    foreach ($badSignatures as $pattern => $threatName) {
                        if (preg_match($pattern, $content)) {
                            $infected[] = ['file' => $file->getFilename(), 'path' => $file->getRealPath(), 'threat' => 'MALWARE: ' . $threatName];
                            break;
                        }
                    }
                }
            }
        }
        return response()->json(['status' => 'success', 'scanned_count' => $scannedCount, 'infected_files' => $infected]);
    }

    public function deleteMalware(Request $request)
    {
        $path = $request->input('path');
        if ($path && File::exists($path)) {
            File::delete($path);
            return response()->json(['status' => 'success']);
        }
        return response()->json(['status' => 'error']);
    }

    public function osintLookup(Request $request)
    {
        $target = trim($request->input('target'));
        if (empty($target)) return response()->json(['status' => 'error', 'message' => 'Target tidak boleh kosong.']);

        // 1. CEK EMAIL
        if (filter_var($target, FILTER_VALIDATE_EMAIL)) {
            try {
                $response = Http::timeout(8)->get("https://emailrep.io/{$target}");
                if ($response->successful()) return response()->json(['status' => 'success', 'type' => 'email', 'data' => $response->json()]);
                return response()->json(['status' => 'error', 'message' => 'Gagal melacak email di database intelijen.']);
            } catch (\Exception $e) { return response()->json(['status' => 'error', 'message' => 'API Timeout.']); }
        }

        // 2. CEK NOMOR HP
        $cleanPhone = preg_replace('/[^0-9]/', '', $target);
        if (strlen($cleanPhone) >= 10 && strlen($cleanPhone) <= 15) {
            $prefix = substr($cleanPhone, 0, 4);
            if (substr($prefix, 0, 2) == '62') $prefix = '0' . substr($cleanPhone, 2, 3);
            
            $provider = "Tidak Diketahui / Virtual Number (Hati-hati Penipuan)";
            if (in_array($prefix, ['0811','0812','0813','0821','0822','0823','0852','0853','0851'])) $provider = "Telkomsel";
            else if (in_array($prefix, ['0814','0815','0816','0855','0856','0857','0858'])) $provider = "Indosat Ooredoo";
            else if (in_array($prefix, ['0817','0818','0819','0859','0877','0878'])) $provider = "XL Axiata";
            else if (in_array($prefix, ['0831','0832','0833','0838'])) $provider = "Axis";
            else if (in_array($prefix, ['0895','0896','0897','0898','0899'])) $provider = "Tri (3)";
            else if (in_array($prefix, ['0881','0882','0883','0884','0885','0886','0887','0888','0889'])) $provider = "Smartfren";

            return response()->json([
                'status' => 'success', 'type' => 'phone', 
                'data' => [
                    'phone' => $target, 'clean_format' => $cleanPhone,
                    'country' => (substr($cleanPhone, 0, 2) == '62' || substr($cleanPhone, 0, 2) == '08') ? 'Indonesia (+62)' : 'Luar Negeri',
                    'provider' => $provider, 'is_virtual' => ($provider === "Tidak Diketahui / Virtual Number (Hati-hati Penipuan)"),
                    'getcontact_link' => "https://web.getcontact.com/search?phone=" . $cleanPhone
                ]
            ]);
        }

        // 3. CEK IP / DOMAIN
        try {
            $response = Http::timeout(5)->get("http://ip-api.com/json/{$target}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting");
            if ($response->successful() && $response['status'] === 'success') {
                return response()->json(['status' => 'success', 'type' => 'ip', 'data' => $response->json()]);
            }
            return response()->json(['status' => 'error', 'message' => 'Format tidak valid atau Target IP tidak ditemukan.']);
        } catch (\Exception $e) { return response()->json(['status' => 'error', 'message' => 'Koneksi ke server OSINT terputus.']); }
    }
}
