<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Services\DigiflazzService;
use Inertia\Inertia;
use Exception;

class OrderTokenController extends Controller
{
    protected $digiflazz;
    
    public function __construct(DigiflazzService $digiflazz) {
        $this->digiflazz = $digiflazz;
    }

    public function index() {
        // Ambil produk PLN dari Digiflazz & Okeconnect
        $digi = DB::table('layanan')
            ->where('status', 'active')
            ->where(function($q) {
                $q->where('tipe', 'LIKE', '%PLN%')
                  ->orWhere('tipe', 'LIKE', '%TOKEN%')
                  ->orWhere('nama_layanan', 'LIKE', '%PLN%');
            })
            ->get()
            ->map(function($item) { 
                $item->server = 'DIGIFLAZZ'; 
                $item->provider = 'PLN';
                return $item; 
            });
        
        $oke = DB::table('layanan_okeconnect')
            ->where('status', 'active')
            ->where(function($q) {
                $q->where('tipe', 'LIKE', '%PLN%')
                  ->orWhere('tipe', 'LIKE', '%TOKEN%')
                  ->orWhere('nama_layanan', 'LIKE', '%PLN%');
            })
            ->get()
            ->map(function($item) { 
                $item->server = 'OKECONNECT'; 
                $item->provider = 'PLN';
                return $item; 
            });
        
        $products = collect($digi)->merge($oke)->sortBy('harga_jual')->values();
        
        // Pisahkan menjadi 2 kategori utama: Prabayar & Pascabayar
        $prabayar = [];
        $pascabayar = [];

        foreach ($products as $p) {
            $nameUpper = strtoupper($p->nama_layanan);
            // Jika ada kata PASCA, TAGIHAN, atau POSTPAID masuk ke pascabayar, sisanya prabayar (token listrik)
            if (str_contains($nameUpper, 'PASCA') || str_contains($nameUpper, 'TAGIHAN') || str_contains($nameUpper, 'POSTPAID')) {
                $pascabayar[] = $p;
            } else {
                $prabayar[] = $p;
            }
        }

        return Inertia::render('Order/Token', [
            'productsPrabayar' => $prabayar,
            'productsPascabayar' => $pascabayar,
            'userBalance' => DB::table('users')->where('id', auth()->id())->value('saldo') ?? 0
        ]);
    }

    public function store(Request $request) {
        $kodeLayanan = strip_tags($request->input('kode_layanan'));
        $tujuan = preg_replace('/[^0-9]/', '', $request->input('tujuan'));
        $server = strip_tags($request->input('server')); 
        $jenis = strip_tags($request->input('jenis')); // prabayar / pascabayar
        
        if (!$kodeLayanan || empty($tujuan) || !$server) {
            return back()->with('error', 'Data pesanan tidak lengkap.');
        }

        if ($server === 'OKECONNECT') {
            $product = DB::table('layanan_okeconnect')->where('kode_layanan', $kodeLayanan)->first();
        } else {
            $product = DB::table('layanan')->where('kode_layanan', $kodeLayanan)->first();
        }
        
        if (!$product) return back()->with('error', 'Produk tidak ditemukan di sistem.');

        $realPrice = $product->harga_jual ?? 0;
        if ($realPrice <= 0 && $jenis !== 'pascabayar') {
            return back()->with('error', 'Layanan sedang gangguan.');
        }

        $userId = auth()->id();
        $refId = 'PLN' . time() . rand(10,99);
        
        DB::beginTransaction();
        try {
            $user = DB::table('users')->where('id', $userId)->lockForUpdate()->first();
            
            // Untuk pascabayar biasanya harga cek tagihan dinamis atau menggunakan estimasi/admin awal
            if ($jenis !== 'pascabayar' && (float)$user->saldo < (float)$realPrice) {
                DB::rollBack();
                return back()->with('error', 'Saldo tidak mencukupi.');
            }
            
            if ($jenis !== 'pascabayar') {
                DB::table('users')->where('id', $userId)->decrement('saldo', $realPrice);
            }
            
            DB::table('transaksi')->insertGetId([
                'ref_id' => $refId,
                'username' => $user->name,
                'kode_layanan' => $product->kode_layanan,
                'tujuan' => $tujuan,
                'harga' => $realPrice,
                'status' => 'Pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Sistem sedang sibuk. Coba lagi.');
        }

        try {
            $isSuccess = false;
            $statusPusat = 'pending';
            $pesan = '';
            $snRes = '-';

            if ($server === 'OKECONNECT') {
                $response = Http::timeout(60)->get("https://h2h.okeconnect.com/trx", [
                    'memberID' => env('OKECONNECT_MEMBER_ID'), 
                    'pin' => env('OKECONNECT_PIN'), 
                    'password' => env('OKECONNECT_PASSWORD'),
                    'product' => $product->kode_layanan, 
                    'dest' => $tujuan, 
                    'refID' => $refId
                ]);
                
                $body = $response->body();
                $bodyLower = strtolower($body);
                
                if ($response->successful()) {
                    if (str_contains($bodyLower, 'gagal') || str_contains($bodyLower, 'ditolak') || str_contains($bodyLower, 'salah')) {
                        $isSuccess = false; 
                        $statusPusat = 'gagal';
                        $pesan = trim(preg_replace('/(?:\.?\s*)Saldo\s+.*$/i', '', $body));
                    } else {
                        $isSuccess = true; 
                        $statusPusat = str_contains($bodyLower, 'sukses') ? 'sukses' : 'proses';
                        if (preg_match('/(T#\d+)/i', $body, $matches)) $snRes = $matches[1];
                    }
                } else {
                    $isSuccess = false;
                    $statusPusat = 'gagal';
                    $pesan = 'Koneksi API bermasalah.';
                }
            } else {
                $order = $this->digiflazz->placeOrder($refId, $tujuan, $product->kode_layanan);
                $statusPusat = strtolower($order['data']['status'] ?? 'pending');
                $pesan = $order['message'] ?? $order['data']['message'] ?? 'Gangguan pusat.';
                $snRes = $order['data']['sn'] ?? '-';
                $isSuccess = $order['success'] && $statusPusat !== 'gagal';
            }

            if (!$isSuccess || $statusPusat === 'gagal') {
                DB::transaction(function () use ($userId, $refId, $realPrice, $pesan, $jenis) {
                    $trx = DB::table('transaksi')->where('ref_id', $refId)->where('status', 'Pending')->lockForUpdate()->first();
                    if ($trx && $jenis !== 'pascabayar') {
                        DB::table('users')->where('id', $userId)->increment('saldo', $realPrice);
                    }
                    if ($trx) {
                        DB::table('transaksi')->where('id', $trx->id)->update([
                            'status' => 'Gagal', 
                            'sn' => substr($pesan, 0, 100),
                            'updated_at' => now()
                        ]);
                    }
                });
                return back()->with('error', "Gagal: " . substr($pesan, 0, 100));
            }

            DB::table('transaksi')->where('ref_id', $refId)->update([
                'status' => ($statusPusat === 'sukses' ? 'Sukses' : 'Proses'),
                'sn' => $snRes, 
                'updated_at' => now()
            ]);
            
            return back()->with('success', 'Transaksi Token PLN Berhasil Diproses!');

        } catch (Exception $e) {
            DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Proses', 'updated_at' => now()]);
            return back()->with('success', 'Pesanan sedang diproses di latar belakang.');
        }
    }
}
