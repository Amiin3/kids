<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

echo "=====================================================\n";
echo "🛰️  MESIN 2: DEPOSIT AUTOMATION AKTIF (FIXED)...\n";
echo "=====================================================\n";

$cacheDepo = [];
$initialDepo = DB::table('deposits')->orderBy('id', 'desc')->limit(50)->get();
foreach($initialDepo as $d) { $cacheDepo[$d->id] = $d->status; }

echo "⚡ Menunggu deposit MILASTORE masuk...\n\n";

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
        $currentDepo = DB::table('deposits')->orderBy('id', 'desc')->limit(30)->get();
        foreach($currentDepo as $d) {
            if (!isset($cacheDepo[$d->id]) || $cacheDepo[$d->id] !== $d->status) {
                $cacheDepo[$d->id] = $d->status;
                $statusUpper = strtoupper($d->status);
                
                // -- FIX PENCARIAN USER (Otomatis Mendeteksi Struktur Kolom) --
                $user = null;
                if (isset($d->username)) {
                    $user = DB::table('users')->where('name', $d->username)->orWhere('username', $d->username)->first();
                } elseif (isset($d->user_id)) {
                    $user = DB::table('users')->where('id', $d->user_id)->first();
                } elseif (isset($d->id_user)) {
                    $user = DB::table('users')->where('id', $d->id_user)->first();
                }

                // Jika user tidak ditemukan di database, lewati pengiriman pesan
                if (!$user) {
                    echo "[" . date('H:i:s') . "] ⚠️ [WARNING] Data user tidak ditemukan untuk Deposit ID: " . $d->id . "\n";
                    continue;
                }

                $wa = getSmartWa($user);
                
                if ($wa) {
                    $icon = ($statusUpper == 'SUKSES' || $statusUpper == 'SUCCESS') ? "✅" : (($statusUpper == 'GAGAL' || $statusUpper == 'ERROR') ? "❌" : "⏳");
                    $nominal = $d->jumlah ?? $d->nominal ?? $d->amount ?? 0;
                    $metode = $d->metode ?? $d->via ?? '-';

                    $msg = "=========================\n";
                    $msg .= "💳 *DEPOSIT MILASTORE* 💳\n";
                    $msg .= "=========================\n\n";
                    $msg .= "🧾 *NOTIFIKASI DEPOSIT*\n";
                    $msg .= "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";
                    $msg .= "🆔 *Depo ID:* #" . ($d->id ?? '-') . "\n";
                    $msg .= "🏦 *Metode:* " . $metode . "\n";
                    $msg .= "💰 *Jumlah:* Rp " . number_format($nominal, 0, ',', '.') . "\n";
                    $msg .= "📊 *Status:* " . $icon . " *" . $statusUpper . "*\n";
                    $msg .= "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";

                    if ($statusUpper == 'SUKSES' || $statusUpper == 'SUCCESS') {
                        $msg .= "🎉 *Saldo sukses ditambahkan! Terima kasih, selamat bertransaksi kembali.* 🚀\n";
                    } elseif ($statusUpper == 'GAGAL' || $statusUpper == 'ERROR' || $statusUpper == 'BATAL') {
                        $msg .= "❌ *Deposit Anda dibatalkan/gagal. Silakan hubungi CS jika ada kendala.* \n";
                    } else {
                        $msg .= "⏳ *Menunggu pembayaran / konfirmasi sistem.* \n";
                    }

                    echo "[" . date('H:i:s') . "] 💳 DEPOSIT NOTIF KE: {$wa} | Status: {$statusUpper}\n";
                    
                    Http::timeout(5)->post('http://127.0.0.1:3333/send-notif', [
                        'target' => $wa, 
                        'message' => $msg, 
                        'key' => 'SULTAN_MILA_2026'
                    ]);
                }
            }
        }
    } catch (\Exception $e) {
        echo "[ERROR] Depo Engine: " . $e->getMessage() . "\n";
    }
    usleep(500000); 
}
