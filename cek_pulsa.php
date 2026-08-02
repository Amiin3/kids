<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$pulsa = DB::table('layanan_okeconnect')
    ->where('tipe', 'PULSA')
    ->orderBy('provider')
    ->orderBy('harga_modal')
    ->get();

echo "\n";
echo "====================================================================================================\n";
echo sprintf("| %-8s | %-12s | %-45s | %-10s | %-10s |\n", "KODE", "PROVIDER", "NAMA PRODUK", "MODAL (Rp)", "JUAL (Rp)");
echo "====================================================================================================\n";

$count = 0;
foreach($pulsa as $p) {
    $count++;
    // Memotong teks jika kepanjangan agar tabel tetap rapi
    $nama = strlen($p->nama_layanan) > 45 ? substr($p->nama_layanan, 0, 42) . "..." : $p->nama_layanan;
    
    echo sprintf("| %-8s | %-12s | %-45s | %-10s | %-10s |\n", 
        substr($p->kode_layanan, 0, 8), 
        substr($p->provider, 0, 12), 
        $nama, 
        number_format($p->harga_modal, 0, '', '.'), 
        number_format($p->harga_jual, 0, '', '.')
    );
}
echo "====================================================================================================\n";
echo "🏆 TOTAL PRODUK PULSA OKECONNECT SAAT INI: $count PRODUK\n";
echo "====================================================================================================\n";
