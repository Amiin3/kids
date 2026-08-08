<?php
$oke = DB::table('layanan_okeconnect')
    ->where(function($q){
        $q->where('tipe', 'LIKE', '%pasca%')
          ->orWhere('tipe', 'LIKE', '%postpaid%')
          ->orWhere('nama_layanan', 'LIKE', '%BPJS%')
          ->orWhere('nama_layanan', 'LIKE', '%PDAM%')
          ->orWhere('nama_layanan', 'LIKE', '%Tagihan%')
          ->orWhere('nama_layanan', 'LIKE', '%Indihome%');
    })->select('kode_layanan', 'nama_layanan', 'tipe')->get();

echo "\n========== DAFTAR PASCABAYAR OKECONNECT ==========\n";
foreach($oke as $p) { echo "-> [" . $p->tipe . "] " . $p->kode_layanan . " : " . $p->nama_layanan . "\n"; }

$digi = DB::table('layanan')
    ->where(function($q){
        $q->where('tipe', 'LIKE', '%pasca%')
          ->orWhere('tipe', 'LIKE', '%postpaid%')
          ->orWhere('nama_layanan', 'LIKE', '%BPJS%')
          ->orWhere('nama_layanan', 'LIKE', '%PDAM%')
          ->orWhere('nama_layanan', 'LIKE', '%Tagihan%')
          ->orWhere('nama_layanan', 'LIKE', '%Indihome%');
    })->select('kode_layanan', 'nama_layanan', 'tipe')->get();

echo "\n========== DAFTAR PASCABAYAR DIGIFLAZZ ==========\n";
foreach($digi as $p) { echo "-> [" . $p->tipe . "] " . $p->kode_layanan . " : " . $p->nama_layanan . "\n"; }
echo "\n";
