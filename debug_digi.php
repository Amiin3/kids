<?php
$u = env('DIGI_USERNAME') ?: config('services.digiflazz.username');
$k = env('DIGI_APIKEY') ?: config('services.digiflazz.apikey');

echo "=======================================\n";
echo "1. CEK KREDENSIAL:\n";
echo "Username : " . ($u ?: "KOSONG/TIDAK TERBACA") . "\n";
echo "API Key  : " . ($k ? substr($k, 0, 8) . "*****" : "KOSONG/TIDAK TERBACA") . "\n";
echo "=======================================\n";

if($u && $k) {
    $res = \Illuminate\Support\Facades\Http::post('https://api.digiflazz.com/v1/price-list', [
        'cmd' => 'prepaid',
        'username' => $u,
        'sign' => md5($u . $k . 'pricelist')
    ]);
    
    echo "2. JAWABAN ASLI DARI DIGIFLAZZ:\n";
    echo $res->body() . "\n";
}
echo "=======================================\n";
