<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Services\TelegramService;

class CyberPatrol extends Command
{
    protected $signature = 'cyber:patrol';
    protected $description = 'Patroli otomatis mencari dan memusnahkan malware di server';

    public function handle()
    {
        $directories = [public_path('uploads'), public_path('images'), storage_path('app/public')];
        $infectedFiles = [];
        $scannedCount = 0;

        $badSignatures = [
            '/eval\s*\(/i', '/base64_decode\s*\(/i', '/shell_exec\s*\(/i',
            '/system\s*\(/i', '/passthru\s*\(/i', '/(?:wso2|b374k|indoxploit)/i'
        ];

        foreach ($directories as $dir) {
            if (!File::exists($dir)) continue;
            
            $files = File::allFiles($dir);
            foreach ($files as $file) {
                $scannedCount++;
                if ($file->getSize() > 5000000) continue; 
                
                $content = file_get_contents($file->getRealPath());
                $isThreat = false;

                // Deteksi gambar PHP palsu & Signature backdoor
                if (in_array(strtolower($file->getExtension()), ['jpg', 'png', 'gif']) && str_contains(strtolower($content), '<?php')) {
                    $isThreat = true;
                } else if (in_array(strtolower($file->getExtension()), ['php', 'phtml', 'html'])) {
                    foreach ($badSignatures as $pattern) {
                        if (preg_match($pattern, $content)) { $isThreat = true; break; }
                    }
                }

                // EKSEKUSI: Jika terdeteksi virus, langsung hapus!
                if ($isThreat) {
                    $infectedFiles[] = $file->getRealPath();
                    File::delete($file->getRealPath()); // HAPUS OTOMATIS
                }
            }
        }

        if (count($infectedFiles) > 0) {
            $msg = "🦠 *CYBER PATROL - AUTO DELETE* 🦠\n\n";
            $msg .= "⚠️ Ditemukan " . count($infectedFiles) . " file Malware/Backdoor yang ditanam hacker!\n\n";
            $msg .= "🛡️ *Status:* FILE TELAH DIMUSNAHKAN OTOMATIS!\n\n";
            foreach ($infectedFiles as $inf) {
                $msg .= "- `" . basename($inf) . "`\n";
            }
            try { TelegramService::sendMessage($msg); } catch (\Exception $e) {}
        }
        
        $this->info("Patroli selesai. $scannedCount file dipindai.");
    }
}
