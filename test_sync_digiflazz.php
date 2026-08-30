<?php
echo "Memulai koneksi ke API Digiflazz...\n";

// Buat request palsu (mock) seolah-olah tombol di-klik dari frontend
$request = new \Illuminate\Http\Request();
$request->merge([
    'markup_persen' => 2, // Set keuntungan 2%
    'markup_flat' => 500  // Set keuntungan Rp 500
]);

// Panggil Controller secara paksa
$controller = app(\App\Http\Controllers\AdminDigiflazzController::class);
$response = $controller->sync($request);

echo "\n========== HASIL SINKRONISASI ==========\n";
echo $response->getContent() . "\n";
echo "========================================\n";
