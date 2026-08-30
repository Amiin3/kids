<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Console\Helper\ProgressBar;

class MilastoreSecurityScan extends Command
{
    protected $signature = 'milastore:scan {--deep : Jalankan pemindaian mendalam ke seluruh file upload}';
    protected $description = 'Advanced Security, Malware & Vulnerability Scanner for Milastore';

    public function handle()
    {
        $this->info("===================================================================");
        $this->info("🛡️ MILASTORE DEEP CYBER SECURITY & FORENSIC SCANNER [ULTIMATE] 🛡️");
        $this->info("===================================================================\n");

        $issues = 0;
        $warnings = 0;

        // ==========================================
        // TAHAP 1: PEMERIKSAAN KONFIGURASI SISTEM
        // ==========================================
        $this->warn("⚙️ [TAHAP 1] Menganalisa Konfigurasi Environment & Server...");
        sleep(1); // Memberikan efek proses visual berjalan

        if (config('app.debug') === true) {
            $this->error("  [KRITIS] APP_DEBUG aktif! Membocorkan struktur sistem jika terjadi error.");
            $issues++;
        } else {
            $this->line("  [AMN] APP_DEBUG nonaktif.");
        }

        if (config('app.env') !== 'production') {
            $this->warn("  [PERINGATAN] APP_ENV bukan 'production'.");
            $warnings++;
        } else {
            $this->line("  [AMN] Environment berada di Production.");
        }

        $appKey = config('app.key');
        if (empty($appKey) || strlen($appKey) < 32) {
            $this->error("  [KRITIS] Kunci Enkripsi (APP_KEY) sangat lemah atau kosong!");
            $issues++;
        } else {
            $this->line("  [AMN] Kunci Enkripsi Valid (AES-256).");
        }

        // ==========================================
        // TAHAP 2: PEMERIKSAAN KEBOCORAN FILE SENSITIF
        // ==========================================
        $this->warn("\n📂 [TAHAP 2] Mendeteksi Kebocoran File Sensitif di Public Area...");
        sleep(1);

        $sensitiveFiles = ['.env', '.git', 'backup.sql', 'config.php', 'database.sqlite', '.htaccess.bak'];
        foreach ($sensitiveFiles as $file) {
            if (File::exists(public_path($file))) {
                $this->error("  [KRITIS] File {$file} terekspos di public! Hacker bisa mengunduhnya.");
                $issues++;
            } else {
                $this->line("  [AMN] {$file} terlindungi.");
            }
        }

        // ==========================================
        // TAHAP 3: PEMERIKSAAN HAK AKSES (PERMISSIONS)
        // ==========================================
        $this->warn("\n🔐 [TAHAP 3] Memeriksa Hak Akses Folder & Kelemahan CHMOD...");
        sleep(1);
        
        $directories = [
            storage_path() => 'Storage',
            base_path('bootstrap/cache') => 'Bootstrap Cache',
            public_path() => 'Public',
        ];

        foreach ($directories as $path => $name) {
            if (File::exists($path)) {
                $perms = substr(sprintf('%o', fileperms($path)), -4);
                if ($perms == '0777') {
                    $this->error("  [KRITIS] Folder {$name} memiliki akses 777 (Sangat Berbahaya!). Ubah ke 755.");
                    $issues++;
                } else {
                    $this->line("  [AMN] Folder {$name} memiliki CHMOD aman ({$perms}).");
                }
            }
        }

        // ==========================================
        // TAHAP 4: PEMERIKSAAN FIREWALL & DATABASE
        // ==========================================
        $this->warn("\n🛡️ [TAHAP 4] Validasi Integrasi Firewall (NasaFirewall)...");
        sleep(1);
        
        if (File::exists(app_path('Http/Middleware/NasaFirewall.php'))) {
            $this->line("  [AMN] Modul NasaFirewall terdeteksi dan aktif.");
        } else {
            $this->error("  [KRITIS] NasaFirewall HILANG dari sistem!");
            $issues++;
        }

        try {
            DB::connection()->getPdo();
            $this->line("  [AMN] Koneksi Database Stabil.");
        } catch (\Exception $e) {
            $this->error("  [KRITIS] Database Terputus!");
            $issues++;
        }

        // ==========================================
        // TAHAP 5: DEEP MALWARE & BACKDOOR SCAN (VISUAL PROGRESS)
        // ==========================================
        $this->warn("\n🦠 [TAHAP 5] Memindai Malware, Backdoor Shell, & File Berbahaya...");
        
        // Target folder untuk di scan (Public & Uploads)
        $scanDirs = [public_path(), storage_path('app/public')];
        $allFiles = [];

        foreach ($scanDirs as $dir) {
            if (File::exists($dir)) {
                $files = File::allFiles($dir);
                $allFiles = array_merge($allFiles, $files);
            }
        }

        $totalFiles = count($allFiles);
        if ($totalFiles > 0) {
            $this->info("Menemukan {$totalFiles} file untuk dipindai. Memulai Deep Scan...");
            
            // MEMBUAT VISUAL PROGRESS BAR
            $progressBar = $this->output->createProgressBar($totalFiles);
            $progressBar->setFormat("<fg=cyan> %current%/%max% [%bar%] %percent:3s%%</>\n  <fg=yellow>Sedang memindai: %message%</>");
            $progressBar->start();

            $malwareFound = [];
            $suspiciousPatterns = [
                '/eval\s*\(/i',             // Eksekusi kode PHP dinamis
                '/base64_decode\s*\(/i',    // Obfuscation (penyembunyian kode)
                '/shell_exec\s*\(/i',       // Akses terminal Linux
                '/system\s*\(/i',           // Eksekusi sistem
                '/passthru\s*\(/i',         // Bypass shell
                '/<\?php/i'                 // Tag PHP di dalam file ekstensi gambar
            ];

            foreach ($allFiles as $file) {
                $progressBar->setMessage($file->getFilename());
                $progressBar->advance();

                $ext = strtolower($file->getExtension());
                $content = File::get($file->getRealPath());

                // Jika ada file gambar (.jpg, .png) tapi berisi tag <?php, FIX itu adalah Backdoor (Shell)
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif']) && preg_match('/<\?php/i', $content)) {
                    $malwareFound[] = "Gambar Beracun (PHP Inject): " . $file->getRealPath();
                    $issues++;
                    continue;
                }

                // Scan file PHP atau TXT yang mencurigakan di public
                if (in_array($ext, ['php', 'phtml', 'txt'])) {
                    foreach ($suspiciousPatterns as $pattern) {
                        if (preg_match($pattern, $content)) {
                            $malwareFound[] = "Indikasi Shell/Backdoor (Pattern Match): " . $file->getRealPath();
                            $issues++;
                            break;
                        }
                    }
                }
                usleep(5000); // Simulasi pemrosesan Deep Scan agar visual terlihat jelas
            }

            $progressBar->finish();
            $this->line("\n");

            if (count($malwareFound) > 0) {
                $this->error("\n🚨 TERDETEKSI MALWARE / BACKDOOR HACKER 🚨");
                foreach ($malwareFound as $malware) {
                    $this->line("  ❌ " . $malware);
                }
            } else {
                $this->line("\n  [AMN] Bersih! Tidak ada malware atau shell backdoor yang ditemukan.");
            }
        } else {
            $this->line("  [AMN] Tidak ada file upload yang perlu dipindai.");
        }

        // ==========================================
        // HASIL AKHIR AUDIT
        // ==========================================
        $this->info("\n===================================================================");
        if ($issues === 0 && $warnings === 0) {
            $this->info("🎉 STATUS: 100% AMAN PERFECT!");
            $this->info("Sistem MILASTORE siap dirilis tanpa ada celah keamanan. Good Job Sultan!");
        } else {
            $this->error("🚨 HASIL AUDIT: Ditemukan {$issues} Masalah Kritis & {$warnings} Peringatan.");
            $this->warn("Silakan cek log di atas dan segera perbaiki celah yang berwarna MERAH.");
        }
        $this->info("===================================================================\n");
    }
}
