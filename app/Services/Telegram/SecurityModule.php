<?php
namespace App\Services\Telegram;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class SecurityModule
{
    public static function getStats()
    {
        try {
            return [
                'total_attacks' => DB::table('security_logs')->count(),
                'banned_count'  => DB::table('banned_ips')->count(),
                // LIMIT DIHAPUS: Menarik semua data ratusan IP tanpa batas
                'banned_list'   => DB::table('banned_ips')->orderBy('updated_at', 'desc')->get()
            ];
        } catch (\Exception $e) {
            Log::error("Security Module Error: " . $e->getMessage());
            return ['total_attacks' => 0, 'banned_count' => 0, 'banned_list' => []];
        }
    }

    public static function unblockIp($ip)
    {
        return DB::table('banned_ips')->where('ip', $ip)->delete();
    }

    public static function clearAllBanned()
    {
        return DB::table('banned_ips')->truncate();
    }

    public static function clearLogs()
    {
        return DB::table('security_logs')->truncate();
    }

    public static function performUltraScan($isAutoFix = false)
    {
        $issues = 0; $fixedCount = 0; $details = [];

        // 1. Cek APP_DEBUG
        if (config('app.debug')) {
            if ($isAutoFix) {
                $envPath = base_path('.env');
                if (File::exists($envPath)) {
                    $envContent = File::get($envPath);
                    $envContent = preg_replace('/APP_DEBUG\s*=\s*true/i', 'APP_DEBUG=false', $envContent);
                    @File::put($envPath, $envContent);
                    $details[] = ['type' => 'fixed', 'text' => 'APP_DEBUG dinonaktifkan otomatis'];
                    $fixedCount++;
                }
            } else {
                $details[] = ['type' => 'danger', 'text' => 'Bocor: APP_DEBUG aktif di production'];
                $issues++;
            }
        }

        // 2. Cek File Eksposur
        foreach (['.env', '.git', 'backup.sql', 'config.php', 'database.sqlite'] as $f) {
            $path = public_path($f);
            if (File::exists($path)) {
                if ($isAutoFix) {
                    @File::move($path, $path . '.quarantine');
                    $details[] = ['type' => 'fixed', 'text' => "File {$f} dikarantina"];
                    $fixedCount++;
                } else {
                    $details[] = ['type' => 'danger', 'text' => "Bocor di Public: {$f}"];
                    $issues++;
                }
            }
        }

        // 3. Cek CHMOD
        $dirs = [storage_path() => 'Storage', base_path('bootstrap/cache') => 'Bootstrap Cache'];
        foreach ($dirs as $path => $name) {
            if (File::exists($path)) {
                $p = substr(sprintf('%o', fileperms($path)), -4);
                if ($p == '0777') {
                    if ($isAutoFix) {
                        @chmod($path, 0755);
                        $details[] = ['type' => 'fixed', 'text' => "CHMOD {$name} dinormalkan (755)"];
                        $fixedCount++;
                    } else {
                        $details[] = ['type' => 'danger', 'text' => "Izin direktori {$name} Jebol (777)"];
                        $issues++;
                    }
                }
            }
        }

        // 4. Cek Malware di Uploads
        $uploadDirs = [public_path('uploads'), public_path('images'), storage_path('app/public')];
        $illegalExts = ['php', 'php3', 'php4', 'php5', 'phtml', 'sh', 'bash', 'cgi', 'inc'];
        foreach ($uploadDirs as $dir) {
            if (!File::exists($dir)) continue;
            foreach (File::allFiles($dir) as $file) {
                if (in_array(strtolower($file->getExtension()), $illegalExts)) {
                    if ($isAutoFix) {
                        @unlink($file->getRealPath());
                        $details[] = ['type' => 'fixed', 'text' => 'Malware dihapus: ' . $file->getFilename()];
                        $fixedCount++;
                    } else {
                        $details[] = ['type' => 'danger', 'text' => 'Malware di folder upload: ' . $file->getFilename()];
                        $issues++;
                    }
                }
            }
        }

        // 5. Cek Core Injeksi (index.php)
        $indexPath = public_path('index.php');
        if (File::exists($indexPath)) {
            $content = File::get($indexPath);
            if (preg_match('/eval\s*\(/i', $content) || preg_match('/base64_decode/i', $content)) {
                if ($isAutoFix) {
                    $cleanIndex = "<?php\n\nuse Illuminate\Contracts\Http\Kernel;\nuse Illuminate\Http\Request;\n\ndefine('LARAVEL_START', microtime(true));\n\nif (file_exists(\$maintenance = __DIR__.'/../storage/framework/maintenance.php')) {\n    require \$maintenance;\n}\n\nrequire __DIR__.'/../vendor/autoload.php';\n\n\$app = require_once __DIR__.'/../bootstrap/app.php';\n\n\$kernel = \$app->make(Kernel::class);\n\n\$response = \$kernel->handle(\n    \$request = Request::capture()\n)->send();\n\n\$kernel->terminate(\$request, \$response);\n";
                    @File::put($indexPath, $cleanIndex);
                    $details[] = ['type' => 'fixed', 'text' => 'Injeksi index.php dinetralkan'];
                    $fixedCount++;
                } else {
                    $details[] = ['type' => 'danger', 'text' => 'Backdoor terdeteksi pada index.php'];
                    $issues++;
                }
            }
        }

        // 6. Database Audit
        try {
            if (Schema::hasTable('users')) {
                $admins = DB::table('users')->where('role', 'admin')->get();
                $rogueCount = 0;
                foreach ($admins as $ad) {
                    $nameLower = strtolower($ad->name ?? '');
                    if (str_contains($nameLower, 'hacker') || str_contains($nameLower, 'test') || str_contains($nameLower, 'inject')) {
                        $rogueCount++;
                    }
                }
                if ($rogueCount > 0) {
                    $details[] = ['type' => 'danger', 'text' => "Ditemukan {$rogueCount} akun Admin aneh!"];
                    $issues++;
                }
            }
        } catch (\Throwable $e) {}

        return [
            'status'      => $issues === 0 ? 'safe' : 'threat_detected',
            'issues'      => $issues,
            'fixed_count' => $fixedCount,
            'details'     => $details
        ];
    }
}
