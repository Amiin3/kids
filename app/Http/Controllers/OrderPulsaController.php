<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Services\DigiflazzService;
use Inertia\Inertia;
use Exception;

class OrderPulsaController extends Controller
{
    protected $digiflazz;
    
    public function __construct(DigiflazzService $digiflazz) {
        $this->digiflazz = $digiflazz;
    }

    public function index() {
        $bannedKeywords = '/(data|kuota|internet|voucher|vcr|voc|gesek|fisik|token|pln|pascabayar|tagihan|postpaid|halo|prioritas|explore|matrix|bayar|wifi)/i';

        $digi = DB::table('layanan')
            ->where('status', 'active')
            ->whereIn('tipe', ['PULSA', 'pulsa'])
            ->get()
            ->filter(function($item) use ($bannedKeywords) {
                return !preg_match($bannedKeywords, $item->nama_layanan);
            })
            ->map(function($item) { 
                $item->server = 'DIGIFLAZZ'; 
                $item->provider = strtoupper(trim($item->provider)); 
                return $item; 
            });
        
        $oke = DB::table('layanan_okeconnect')
            ->where('status', 'active')
            ->whereIn('tipe', ['PULSA', 'pulsa'])
            ->get()
            ->filter(function($item) use ($bannedKeywords) {
                return !preg_match($bannedKeywords, $item->nama_layanan);
            })
            ->map(function($item) { 
                $item->server = 'OKECONNECT'; 
                $item->provider = strtoupper(trim($item->provider)); 
                return $item; 
            });
        
        $products = collect($digi)->merge($oke)->sortBy('harga_jual')->values();
        
        $grouped = []; 
        foreach ($products as $p) { 
            // Normalisasi penamaan provider agar klop dengan pemetaan frontend
            $prov = strtoupper(trim($p->provider));
            if (str_contains($prov, 'BY') || str_contains($prov, 'BYU')) $prov = 'BY.U';
            elseif (str_contains($prov, 'TELKOMSEL') || str_contains($prov, 'TSEL')) $prov = 'TELKOMSEL';
            elseif (str_contains($prov, 'INDOSAT') || str_contains($prov, 'ISAT')) $prov = 'INDOSAT';
            elseif (str_contains($prov, 'AXIS')) $prov = 'AXIS';
            elseif (str_contains($prov, 'XL')) $prov = 'XL';
            elseif (str_contains($prov, 'TRI') || str_contains($prov, 'THREE')) $prov = 'TRI';
            elseif (str_contains($prov, 'SMARTFREN')) $prov = 'SMARTFREN';

            $grouped[$prov][] = $p;
        }

        return Inertia::render('Order/Pulsa', [
            'products' => $products, 
            'groupedProducts' => (object)$grouped, 
            'userBalance' => DB::table('users')->where('id', auth()->id())->value('saldo') ?? 0
        ]);
    }

    public function store(Request $request) {
        $kodeLayanan = strip_tags($request->input('kode_layanan'));
        $tujuan = preg_replace('/[^0-9]/', '', $request->input('tujuan'));
        $server = strip_tags($request->input('server')); 
        
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
        if ($realPrice <= 0) return back()->with('error', 'Layanan sedang gangguan.');

        $userId = auth()->id();
        $refId = 'PUL' . time() . rand(10,99);
        
        DB::beginTransaction();
        try {
            $user = DB::table('users')->where('id', $userId)->lockForUpdate()->first();
            
            if ((float)$user->saldo < (float)$realPrice) {
                DB::rollBack();
                return back()->with('error', 'Saldo tidak mencukupi.');
            }
            
            DB::table('users')->where('id', $userId)->decrement('saldo', $realPrice);
            
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
                    if (str_contains($bodyLower, 'gagal') || str_contains($bodyLower, 'ditolak') || str_contains($bodyLower, 'salah') || str_contains($bodyLower, 'tidak cukup')) {
                        $isSuccess = false; 
                        $statusPusat = 'gagal';
                        $pesan = trim(preg_replace('/(?:\.?\s*)Saldo\s+.*$/i', '', $body));
                    } else if (str_contains($bodyLower, 'akan diproses') || str_contains($bodyLower, 'sukses') || str_contains($bodyLower, 'berhasil')) {
                        $isSuccess = true; 
                        $statusPusat = 'proses';
                        if (str_contains($bodyLower, 'sukses') || str_contains($bodyLower, 'berhasil')) $statusPusat = 'sukses';
                        if (preg_match('/(T#\d+)/i', $body, $matches)) $snRes = $matches[1];
                    } else {
                        $isSuccess = true; 
                        $statusPusat = 'proses';
                    }
                } else {
                    $isSuccess = false;
                    $statusPusat = 'gagal';
                    $pesan = 'Koneksi API bermasalah (HTTP ' . $response->status() . ')';
                }

            } else {
                $order = $this->digiflazz->placeOrder($refId, $tujuan, $product->kode_layanan);
                $statusPusat = strtolower($order['data']['status'] ?? 'pending');
                $pesan = $order['message'] ?? $order['data']['message'] ?? 'Gangguan pusat.';
                $snRes = $order['data']['sn'] ?? '-';
                $isSuccess = $order['success'] && $statusPusat !== 'gagal';
            }

            if (!$isSuccess || $statusPusat === 'gagal') {
                DB::transaction(function () use ($userId, $refId, $realPrice, $pesan) {
                    $trx = DB::table('transaksi')->where('ref_id', $refId)->where('status', 'Pending')->lockForUpdate()->first();
                    if ($trx) {
                        DB::table('users')->where('id', $userId)->increment('saldo', $realPrice);
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
            
            return back()->with('success', 'Transaksi Berhasil Diproses!');

        } catch (Exception $e) {
            DB::table('transaksi')->where('ref_id', $refId)->update(['status' => 'Proses', 'updated_at' => now()]);
            return back()->with('success', 'Pesanan sedang diproses di latar belakang.');
        }
    }
}
