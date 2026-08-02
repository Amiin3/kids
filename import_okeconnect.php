<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

echo "⏳ Sedang menyedot data dari Pusat Okeconnect...\n";

try {
    $response = Http::timeout(60)->get('https://okeconnect.com/harga/json?id=905ccd028329b0a');
    $data = $response->json();
    
    if (!$data) {
        die("❌ Gagal membaca JSON dari Okeconnect!\n");
    }

    $countInsert = 0;
    $countUpdate = 0;
    $marginKeuntungan = 1500; // 💰 Keuntungan default (Markup) per produk

    foreach ($data as $item) {
        $kode = $item['kode'];
        $nama = $item['keterangan']; 
        $kategori = strtoupper($item['kategori']);
        $harga_modal = $item['harga'];
        $harga_jual = $harga_modal + $marginKeuntungan;
        $status = $item['status'] == '1' ? 'active' : 'inactive';

        // 🧠 RADAR PENDETEKSI PROVIDER OTOMATIS
        $provider = 'LAINNYA';
        if (strpos($kategori, 'TELKOMSEL') !== false || strpos($kategori, 'TSEL') !== false) $provider = 'TELKOMSEL';
        elseif (strpos($kategori, 'INDOSAT') !== false || strpos($kategori, 'ISAT') !== false) $provider = 'INDOSAT';
        elseif (strpos($kategori, 'XL') !== false) $provider = 'XL';
        elseif (strpos($kategori, 'AXIS') !== false) $provider = 'AXIS';
        elseif (strpos($kategori, 'SMART') !== false) $provider = 'SMARTFREN';
        elseif (strpos($kategori, 'TRI') !== false || strpos($kategori, 'THREE') !== false) $provider = 'TRI';
        elseif (strpos($kategori, 'PLN') !== false || strpos($kategori, 'TOKEN') !== false) $provider = 'PLN';

        // 🧠 RADAR PENDETEKSI TIPE PRODUK OTOMATIS
        $tipe = 'DATA'; // Default jadi Kuota/Data
        if (strpos($kategori, 'PULSA') !== false) $tipe = 'PULSA';
        elseif (strpos($kategori, 'E-MONEY') !== false || strpos($kategori, 'SALDO') !== false) $tipe = 'EWALLET';
        elseif (strpos($kategori, 'GAME') !== false) $tipe = 'GAMES';

        $exists = DB::table('layanan_okeconnect')->where('kode_layanan', $kode)->first();
        
        if ($exists) {
            // Jika sudah ada, UPDATE Harga Modal & Status saja (Harga Jual JANGAN ditimpa biar settingan admin aman)
            DB::table('layanan_okeconnect')->where('kode_layanan', $kode)->update([
                'nama_layanan' => $nama,
                'provider' => $provider,
                'tipe' => $tipe,
                'harga_modal' => $harga_modal,
                'status' => $status,
                'updated_at' => now()
            ]);
            $countUpdate++;
        } else {
            // Jika belum ada, INSERT produk baru!
            DB::table('layanan_okeconnect')->insert([
                'kode_layanan' => $kode,
                'nama_layanan' => $nama,
                'provider' => $provider,
                'tipe' => $tipe,
                'harga_modal' => $harga_modal,
                'harga_jual' => $harga_jual,
                'status' => $status,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $countInsert++;
        }
    }

    echo "=================================================\n";
    echo "✅ OPERASI SEDOT DATA BERHASIL SULTAN!\n";
    echo "📈 Produk Baru Ditambahkan : $countInsert\n";
    echo "🔄 Produk Lama Diupdate    : $countUpdate\n";
    echo "=================================================\n";

} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
