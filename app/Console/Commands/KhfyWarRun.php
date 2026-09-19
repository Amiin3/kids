<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\Admin\KhfyWarController;

class KhfyWarRun extends Command
{
    protected $signature = 'war:khfy-run';
    protected $description = 'Jalankan Khfy War Engine via CLI (Bypass Nginx)';

    public function handle()
    {
        $controller = app(KhfyWarController::class);
        $this->info("Menjalankan War Engine CLI...");

        while (true) {
            try {
                // Eksekusi fungsi controller
                $response = $controller->executeWar();
                $data = json_decode($response->getContent(), true);
                
                // Tampilkan output
                if (isset($data['log'])) {
                    $this->line("[" . date('H:i:s') . "] " . $data['log']);
                }
            } catch (\Throwable $e) {
                $this->error("Error: " . $e->getMessage());
            }

            // Jeda 1 detik agar CPU tidak meledak (sesuaikan jika butuh lebih cepat)
            usleep(1000000); 
        }
    }
}
