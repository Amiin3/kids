<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Request;
use App\Http\Controllers\WarEngineController;

class KhfyWarRunner extends Command
{
    protected $signature = 'war:khfy-run';
    protected $description = 'Mesin Smart Sniper Khfy War PO by PM2 (Anti-Brutal & Cooldown)';

    public function handle()
    {
        $this->info("🚀 [WAR ENGINE] Smart Sniper Active. Memulai pengawasan radar...");

        // Memanggil Controller yg khusus dibuat untuk PM2
        $controller = new WarEngineController();

        while (true) {
            try {
                $request = new Request();
                $response = $controller->warExecute($request);
                
                $result = json_decode($response->getContent(), true);
                if (!is_array($result)) {
                    $result = ['status' => 'error', 'log' => 'Invalid JSON Response'];
                }

                $status = $result['status'] ?? 'info';
                $log = $result['log'] ?? 'Mencari target...';

                $this->info("[" . date('H:i:s') . "] [$status] $log");

                if (
                    $status === 'idle' || 
                    $status === 'info' || 
                    str_contains(strtolower($log), 'kosong') || 
                    str_contains(strtolower($log), 'bersih')
                ) {
                    sleep(3);
                } elseif ($status === 'warning' || $status === 'wait' || str_contains(strtolower($log), 'sibuk')) {
                    sleep(2);
                } else {
                    sleep(1);
                }

            } catch (\Exception $e) {
                $this->error("[" . date('H:i:s') . "] ERROR EXCEPTION: " . $e->getMessage());
                sleep(5);
            }

            gc_collect_cycles();
        }
    }
}
