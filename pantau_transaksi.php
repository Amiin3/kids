<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

echo "=====================================================\n";
echo "🛰️  MESIN 1: TRANSAKSI (AUTO-IMAGE) AKTIF...\n";
echo "=====================================================\n";

$cacheTrx = [];
$initialTrx = DB::table('transaksi')->orderBy('id', 'desc')->limit(50)->get();
foreach($initialTrx as $t) { $cacheTrx[$t->id] = $t->status; }

echo "⚡ Menunggu transaksi MILASTORE masuk...\n\n";

function getSmartWa($user) {
    if (!$user) return null;
    $target = '';
    if (preg_match('/^(08|628|\+628)/', $user->whatsapp ?? '')) $target = $user->whatsapp;
    elseif (preg_match('/^(08|628|\+628)/', $user->phone ?? '')) $target = $user->phone;
    else $target = ($user->whatsapp ?? '') ?: ($user->phone ?? '');
    if (empty($target)) return null;
    $wa = preg_replace('/[^0-9]/', '', $target);
    if (substr($wa, 0, 1) == '0') $wa = '62' . substr($wa, 1);
    return $wa;
}

while(true) {
    try {
        $currentTrx = DB::table('transaksi')->orderBy('id', 'desc')->limit(30)->get();
        foreach($currentTrx as $t) {
            if (!isset($cacheTrx[$t->id]) || $cacheTrx[$t->id] !== $t->status) {
                $cacheTrx[$t->id] = $t->status;
                $statusUpper = strtoupper($t->status);
                
                $user = DB::table('users')->where('name', $t->username)->first();
                $wa = getSmartWa($user);
                
                if ($wa) {
                    $raw_sn = $t->sn ?? $t->keterangan ?? '';
                    $rahasia = ['api', 'digiflazz', 'khfy', 'adammedia', 'kaje'];
                    $bersih = trim(str_ireplace($rahasia, '', $raw_sn));
                    
                    if ($statusUpper == 'PROSES' || $statusUpper == 'PENDING') {
                        $final_sn = '⏳ Sedang diproses sistem...';
                    } elseif ($statusUpper == 'SUKSES' || $statusUpper == 'SUCCESS') {
                        $final_sn = empty($bersih) ? '✅ Transaksi Berhasil' : $bersih;
                    } else {
                        $final_sn = '❌ Dibatalkan';
                    }

                    $produk = $t->produk ?? $t->kode_layanan ?? $t->layanan ?? '-';
                    $icon = ($statusUpper == 'SUKSES' || $statusUpper == 'SUCCESS') ? "✅" : (($statusUpper == 'GAGAL' || $statusUpper == 'ERROR') ? "❌" : "⏳");

                    $msg = "=========================\n";
                    $msg .= "🏪 *MILASTORE OFFICIAL* 🏪\n";
                    $msg .= "=========================\n\n";
                    $msg .= "🧾 *INVOICE TRANSAKSI*\n";
                    $msg .= "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";
                    $msg .= "🆔 *Trx ID:* #" . ($t->id ?? '-') . "\n";
                    $msg .= "🛍️ *Produk:* " . $produk . "\n";
                    $msg .= "🎯 *Tujuan:* " . ($t->tujuan ?? '-') . "\n";
                    if (isset($t->harga) && $t->harga > 0) $msg .= "💰 *Harga:* Rp " . number_format($t->harga, 0, ',', '.') . "\n";
                    $msg .= "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";
                    $msg .= "🔖 *SN:* " . $final_sn . "\n";
                    $msg .= "📊 *Status:* " . $icon . " *" . $statusUpper . "*\n";
                    $msg .= "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";

                    if ($statusUpper == 'SUKSES' || $statusUpper == 'SUCCESS') {
                        $msg .= "🎉 *Terima kasih telah berbelanja di MILASTORE!* 🚀\n";
                        $namaReseller = $user->name ?? 'Mitra Milastore';
                        $namaEncoded = urlencode($namaReseller);
                        $banner_url = "https://placehold.co/800x450/059669/ffffff.png?text=TRANSAKSI+SUKSES%0A===================%0ATerima+Kasih+Kak+".$namaEncoded."%0A(MILASTORE+OFFICIAL)";
                        
                        echo "[" . date('H:i:s') . "] 🖼️ GAMBAR CUSTOM UNTUK: {$namaReseller} | WA: {$wa}\n";
                        
                        Http::timeout(10)->post('http://127.0.0.1:3333/send-image', [
                            'target' => $wa, 
                            'message' => $msg, 
                            'image_url' => $banner_url,
                            'key' => 'SULTAN_MILA_2026'
                        ]);
                    } 
                    else {
                        if ($statusUpper == 'GAGAL' || $statusUpper == 'ERROR') {
                            $msg .= "⚠️ *Mohon maaf, transaksi gagal.* \n💳 *Saldo Anda telah dikembalikan!*\n";
                        }
                        echo "[" . date('H:i:s') . "] 📝 TEKS KE: {$wa} | Status: {$statusUpper}\n";
                        Http::timeout(5)->post('http://127.0.0.1:3333/send-notif', [
                            'target' => $wa, 
                            'message' => $msg, 
                            'key' => 'SULTAN_MILA_2026'
                        ]);
                    }
                }
            }
        }
    } catch (\Exception $e) {
        echo "[ERROR] Trx Engine: " . $e->getMessage() . "\n";
    }
    usleep(500000); 
}
