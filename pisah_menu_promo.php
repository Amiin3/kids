<?php
$file = 'resources/js/Pages/Order/Akrab.jsx';
$code = file_get_contents($file);

// 1. Tambahkan menu PROMO di jejeran Tab Kategori
$code = str_replace(
    "['XLA', 'XDA', 'FMX', 'CFMX', 'PLN', 'BONUS']",
    "['XLA', 'PROMO', 'XDA', 'FMX', 'CFMX', 'PLN', 'BONUS']",
    $code
);

// 2. Pisahkan logika filter XLA agar menolak XLAP, dan buat logika khusus untuk PROMO
$searchFilter = "if (activeTab === 'XLA') return p.kode_layanan.startsWith('XLA');";
$replaceFilter = "if (activeTab === 'XLA') return p.kode_layanan.startsWith('XLA') && !p.kode_layanan.startsWith('XLAP');\n            if (activeTab === 'PROMO') return p.kode_layanan.startsWith('XLAP');";
$code = str_replace($searchFilter, $replaceFilter, $code);

file_put_contents($file, $code);
echo "✅  SAH! Kategori PROMO dan XLA sudah resmi bercerai dan punya kamar masing-masing!\n";
?>
