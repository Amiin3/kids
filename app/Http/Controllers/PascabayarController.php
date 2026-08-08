<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Services\DigiflazzService;
use Inertia\Inertia;
use Exception;

class PascabayarController extends Controller
{
    protected $digiflazz;
    
    public function __construct(DigiflazzService $digiflazz) {
        $this->digiflazz = $digiflazz;
    }

    public function index() {
        // FILTER MUTLAK: Jangan sampai ada produk pascabayar yang lolos
        $kunciPencarian = function($q) {
            $q->where('tipe', 'LIKE', '%pasca%')
              ->orWhere('tipe', 'LIKE', '%postpaid%')
              ->orWhere('nama_layanan', 'LIKE', '%pasca%')
              ->orWhere('nama_layanan', 'LIKE', '%pascabayar%')
              ->orWhere('nama_layanan', 'LIKE', '%tagihan%')
              ->orWhere('nama_layanan', 'LIKE', '%bpjs%')
              ->orWhere('nama_layanan', 'LIKE', '%pdam%')
              ->orWhere('nama_layanan', 'LIKE', '%kredit%')
              ->orWhere('nama_layanan', 'LIKE', '%finance%')
              ->orWhere('nama_layanan', 'LIKE', '%telkom%')
              ->orWhere('nama_layanan', 'LIKE', '%indihome%')
              ->orWhere('nama_layanan', 'LIKE', '%speedy%')
              ->orWhere('nama_layanan', 'LIKE', '%pln%');
        };

        $digi = DB::table('layanan')->where('status', 'active')->where($kunciPencarian)
            ->get()->map(function($item) { $item->server = 'DIGIFLAZZ'; return $item; });
        
        $oke = DB::table('layanan_okeconnect')->where('status', 'active')->where($kunciPencarian)
            ->get()->map(function($item) { $item->server = 'OKECONNECT'; return $item; });
        
        $products = collect($digi)->merge($oke)->sortBy('nama_layanan')->values();
        
        // 🧠 SMART GROUPING (URUTAN PRIORITAS TERTINGGI DI INDONESIA)
        $grouped = [
            'PLN Pasca' => [],
            'Telkom & Indihome' => [],
            'BPJS' => [],
            'PDAM' => [],
            'Finance & Cicilan' => [],
            'HP Pasca' => [],
            'TV & Internet' => [],
            'Gas Negara' => [],
            'Asuransi' => [],
            'IPL & Pajak' => [],
            'Lainnya' => []
        ];

        foreach ($products as $p) {
            $name = strtoupper($p->nama_layanan);
            $kode = strtoupper($p->kode_layanan);
            
            // Pengalokasian Kamar yang Sangat Presisi
            if (str_contains($name, 'PLN') || str_contains($name, 'LISTRIK') || $kode === 'CPLN' || $kode === 'BPLN') {
                $grouped['PLN Pasca'][] = $p;
            } elseif ((str_contains($name, 'TELKOM') && !str_contains($name, 'TELKOMSEL')) || str_contains($name, 'INDIHOME') || str_contains($name, 'SPEEDY')) {
                $grouped['Telkom & Indihome'][] = $p;
            } elseif (str_contains($name, 'BPJS')) {
                $grouped['BPJS'][] = $p;
            } elseif (str_contains($kode, 'CPAM') || str_contains($kode, 'BPAM') || str_contains($name, 'PDAM') || str_contains($name, 'PAM ')) {
                $grouped['PDAM'][] = $p;
            } elseif (str_contains($kode, 'CFNC') || str_contains($kode, 'BFNC') || str_contains($kode, 'CKSP') || str_contains($kode, 'BKSP') || str_contains($name, 'FINANCE') || str_contains($name, 'KREDIT') || str_contains($name, 'CICILAN') || str_contains($name, 'HOME CREDIT') || str_contains($name, 'ADIRA') || str_contains($name, 'FIF') || str_contains($name, 'BAF') || str_contains($name, 'WOM')) {
                $grouped['Finance & Cicilan'][] = $p;
            } elseif (str_contains($name, 'HALO') || str_contains($name, 'MATRIX') || str_contains($name, 'PRIORITAS') || str_contains($name, 'TELKOMSEL') || str_contains($name, 'XPLOR')) {
                $grouped['HP Pasca'][] = $p;
            } elseif (str_contains($kode, 'CTV') || str_contains($kode, 'BTV') || str_contains($name, 'WIFI') || str_contains($name, 'INTERNET') || str_contains($name, 'TV ') || str_contains($name, 'VISION') || str_contains($name, 'MNC') || str_contains($name, 'MYREP')) {
                $grouped['TV & Internet'][] = $p;
            } elseif (str_contains($kode, 'CEKPGN') || str_contains($kode, 'BYRPGN') || str_contains($name, 'GAS') || str_contains($name, 'PERTAGAS')) {
                $grouped['Gas Negara'][] = $p;
            } elseif (str_contains($kode, 'CINSR') || str_contains($kode, 'BINSR') || str_contains($name, 'ASURANSI') || str_contains($name, 'LIFE') || str_contains($name, 'BUMIPUTERA')) {
                $grouped['Asuransi'][] = $p;
            } elseif (str_contains($kode, 'INQIPL') || str_contains($kode, 'PAYIPL') || str_contains($name, 'IPL ') || str_contains($name, 'PAJAK') || str_contains($name, 'TILANG') || str_contains($name, 'PBB ') || str_contains($name, 'RETRIBUSI')) {
                $grouped['IPL & Pajak'][] = $p;
            } else {
                $grouped['Lainnya'][] = $p;
            }
        }

        // Hapus kategori yang kosong, TAPI pertahankan urutan aslinya
        $grouped = array_filter($grouped, function($arr) { return count($arr) > 0; });

        return Inertia::render('Order/Pascabayar', [
            'groupedProducts' => $grouped,
            'userBalance' => DB::table('users')->where('id', auth()->id())->value('saldo') ?? 0
        ]);
    }

    // 🧠 AI REGEX PARSER (Pemecah Resi Standar Okeconnect)
    private function parseInquiry($sn) {
        $cleanDesc = trim(preg_replace('/(?:\.?\s*)Saldo\s+.*$/i', '', $sn));
        $parsed = ['nama' => 'Pelanggan', 'tagihan' => 0, 'admin' => 0, 'total' => 0, 'periode' => '-', 'jmlbln' => '-', 'desc' => $cleanDesc];

        if (preg_match('/(?:NAMA|A\/N)\s*[:=]?\s*([a-zA-Z0-9\s\.\*\'\"]+?)(?:\/|-|,|TAG|ADMIN|RP|BLN|TOTAL|NO|$)/i', $sn, $m)) $parsed['nama'] = trim($m[1]);
        if (preg_match('/(?:TAGIHAN|TAG)\s*[:=]?\s*(?:RP)?\s*([0-9\.,]+)/i', $sn, $m)) $parsed['tagihan'] = (float) preg_replace('/[^0-9]/', '', $m[1]);
        if (preg_match('/(?:ADMIN)\s*[:=]?\s*(?:RP)?\s*([0-9\.,]+)/i', $sn, $m)) $parsed['admin'] = (float) preg_replace('/[^0-9]/', '', $m[1]);
        if (preg_match('/(?:TOTAL|TTAG)\s*[:=]?\s*(?:RP)?\s*([0-9\.,]+)/i', $sn, $m)) $parsed['total'] = (float) preg_replace('/[^0-9]/', '', $m[1]);
        if (preg_match('/(?:PERIODE|BLN)\s*[:=]?\s*([a-zA-Z0-9\s,-]+?)(?:\/|-|,|TAG|ADMIN|RP|JMLBLN|TOTAL|NO|$)/i', $sn, $m)) $parsed['periode'] = trim($m[1]);
        if (preg_match('/(?:JMLBLN|JML BLN)\s*[:=]?\s*([0-9]+)/i', $sn, $m)) $parsed['jmlbln'] = trim($m[1]);
        
        if ($parsed['total'] <= 0 && $parsed['tagihan'] > 0) $parsed['total'] = $parsed['tagihan'] + $parsed['admin'];
        return $parsed;
    }

    public function inquiry(Request $request) {
        $kodeLayanan = strip_tags($request->input('kode_layanan'));
        $tujuan = preg_replace('/[^0-9]/', '', $request->input('tujuan'));
        $server = strip_tags($request->input('server'));
        if (!$kodeLayanan || empty($tujuan) || !$server) return response()->json(['success' => false, 'message' => 'Data tidak lengkap.'], 400);

        $product = $server === 'OKECONNECT' ? DB::table('layanan_okeconnect')->where('kode_layanan', $kodeLayanan)->first() : DB::table('layanan')->where('kode_layanan', $kodeLayanan)->first();
        if (!$product) return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);

        if ($server === 'OKECONNECT') {
            $realPrice = $product->harga_jual ?? 0;
            $userId = auth()->id();
            $refId = 'INQ' . time() . rand(10,99);

            DB::beginTransaction();
            try {
                $user = DB::table('users')->where('id', $userId)->lockForUpdate()->first();
                if ((float)$user->saldo < $realPrice) { DB::rollBack(); return response()->json(['success' => false, 'message' => 'Saldo tidak cukup untuk biaya pengecekan.'], 400); }
                if ($realPrice > 0) DB::table('users')->where('id', $userId)->decrement('saldo', $realPrice);
                DB::table('transaksi')->insertGetId(['ref_id' => $refId, 'username' => $user->name, 'kode_layanan' => $product->kode_layanan, 'tujuan' => $tujuan, 'harga' => $realPrice, 'status' => 'Pending', 'created_at' => now(), 'updated_at' => now()]);
                DB::commit();
            } catch (Exception $e) { DB::rollBack(); return response()->json(['success' => false, 'message' => 'Sistem sibuk.'], 500); }

            try {
                $response = Http::timeout(60)->get("https://h2h.okeconnect.com/trx", ['memberID' => env('OKECONNECT_MEMBER_ID'), 'pin' => env('OKECONNECT_PIN'), 'password' => env('OKECONNECT_PASSWORD'), 'product' => $product->kode_layanan, 'dest' => $tujuan, 'refID' => $refId]);
                $bodyLower = strtolower($response->body());
                if (str_contains($bodyLower, 'gagal') || str_contains($bodyLower, 'salah') || str_contains($bodyLower, 'ditolak')) {
                    DB::transaction(function () use ($userId, $refId, $realPrice, $response) {
                        if ($realPrice > 0) DB::table('users')->where('id', $userId)->increment('saldo', $realPrice);
                        DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Gagal', 'sn' => substr($response->body(), 0, 100), 'updated_at' => now()]);
                    });
                    return response()->json(['success' => false, 'message' => trim(preg_replace('/(?:\.?\s*)Saldo\s+.*$/i', '', $response->body()))], 400);
                }
                return response()->json(['success' => true, 'is_polling' => true, 'ref_id' => $refId]);
            } catch (Exception $e) { return response()->json(['success' => true, 'is_polling' => true, 'ref_id' => $refId]); }
        } else {
            $refId = 'INQ' . time() . rand(10,99);
            $inquiry = $this->digiflazz->inquiry($refId, $tujuan, $product->kode_layanan);
            if (isset($inquiry['success']) && $inquiry['success']) {
                $parsed = $this->parseInquiry($inquiry['data']['sn'] ?? $inquiry['data']['message'] ?? '');
                $inquiry['data']['parsed'] = $parsed;
                if($parsed['total'] <= 0) $inquiry['data']['parsed']['total'] = $inquiry['data']['selling_price'] ?? $inquiry['data']['price'] ?? 0;
                if($parsed['nama'] == 'Pelanggan' && isset($inquiry['data']['customer_name'])) $inquiry['data']['parsed']['nama'] = $inquiry['data']['customer_name'];
                
                return response()->json(['success' => true, 'is_polling' => false, 'data' => $inquiry['data']]);
            } else { return response()->json(['success' => false, 'message' => $inquiry['message'] ?? 'Gagal cek tagihan.'], 400); }
        }
    }

    public function poll(Request $request) {
        $refId = strip_tags($request->input('ref_id'));
        $trx = DB::table('transaksi')->where('ref_id', $refId)->first();
        if (!$trx) return response()->json(['status' => 'pending']);
        
        if ($trx->status === 'Sukses') {
            $sn = $trx->sn ?? '';
            $parsed = $this->parseInquiry($sn);
            if ($parsed['total'] <= 0) $parsed['total'] = $trx->harga;
            return response()->json(['status' => 'sukses', 'data' => ['parsed' => $parsed, 'sn' => $sn]]);
        } elseif ($trx->status === 'Gagal') { return response()->json(['status' => 'gagal', 'message' => $trx->sn]); }
        return response()->json(['status' => 'pending']);
    }

    public function pay(Request $request) {
        $kodeLayanan = strip_tags($request->input('kode_layanan'));
        $tujuan = preg_replace('/[^0-9]/', '', $request->input('tujuan'));
        $server = strip_tags($request->input('server'));
        $amount = (float) $request->input('amount', 0);

        if (!$kodeLayanan || empty($tujuan) || !$server || $amount <= 0) return response()->json(['success' => false, 'message' => 'Data pembayaran tidak valid.'], 400);

        $product = $server === 'OKECONNECT' ? DB::table('layanan_okeconnect')->where('kode_layanan', $kodeLayanan)->first() : DB::table('layanan')->where('kode_layanan', $kodeLayanan)->first();
        if (!$product) return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);

        $userId = auth()->id(); $refId = 'PAY' . time() . rand(10,99);
        DB::beginTransaction();
        try {
            $user = DB::table('users')->where('id', $userId)->lockForUpdate()->first();
            if ((float)$user->saldo < $amount) { DB::rollBack(); return response()->json(['success' => false, 'message' => 'Saldo tidak mencukupi.'], 400); }
            DB::table('users')->where('id', $userId)->decrement('saldo', $amount);
            DB::table('transaksi')->insertGetId(['ref_id' => $refId, 'username' => $user->name, 'kode_layanan' => $product->kode_layanan, 'tujuan' => $tujuan, 'harga' => $amount, 'status' => 'Pending', 'created_at' => now(), 'updated_at' => now()]);
            DB::commit();
        } catch (Exception $e) { DB::rollBack(); return response()->json(['success' => false, 'message' => 'Sistem sibuk. Coba lagi.'], 500); }

        try {
            $isSuccess = false; $pesan = '';
            if ($server === 'OKECONNECT') {
                $response = Http::timeout(60)->get("https://h2h.okeconnect.com/trx", ['memberID' => env('OKECONNECT_MEMBER_ID'), 'pin' => env('OKECONNECT_PIN'), 'password' => env('OKECONNECT_PASSWORD'), 'product' => $product->kode_layanan, 'dest' => $tujuan, 'refID' => $refId]);
                $isSuccess = $response->successful(); $pesan = $response->body();
            } else {
                $payRes = $this->digiflazz->placeOrder($refId, $tujuan, $product->kode_layanan);
                $isSuccess = $payRes['success'] ?? false; $pesan = $payRes['message'] ?? 'Proses pascabayar.';
            }

            if (!$isSuccess) {
                DB::transaction(function () use ($userId, $refId, $amount, $pesan) {
                    DB::table('users')->where('id', $userId)->increment('saldo', $amount);
                    DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Gagal', 'sn' => substr($pesan, 0, 100), 'updated_at' => now()]);
                });
                return response()->json(['success' => false, 'message' => 'Gagal: ' . substr($pesan, 0, 100)], 400);
            }
            DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Sukses', 'sn' => 'LUNAS', 'updated_at' => now()]);
            return response()->json(['success' => true, 'message' => 'Pembayaran Tagihan Berhasil!']);
        } catch (Exception $e) { return response()->json(['success' => true, 'message' => 'Pembayaran dikirim ke latar belakang.']); }
    }
}
