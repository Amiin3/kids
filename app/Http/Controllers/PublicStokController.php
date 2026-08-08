<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class PublicStokController extends Controller
{
    public function index(Request $request)
    {
        // 🌟 NAMA BRAND SULTAN DITETAPKAN DI SINI
        $brandName = "MILASTORE"; 

        // 🛡️ MASTER CACHE 10 DETIK:
        // 1 Juta request sekalipun, sistem cuma proses 1x tiap 10 detik. Sisanya ambil dari RAM!
        $products = Cache::remember('master_stock_public_v2', 10, function () {
            
            // 1. STOK XDA (ADAMMEDIA)
            $url_xda = env('ADAMMEDIA_API_URL', url('/api/regulers'));
            $liveStockXda = [];
            try {
                $resXda = Http::timeout(5)->get($url_xda)->json();
                if (is_array($resXda)) {
                    foreach ($resXda as $item) {
                        if (isset($item['config'])) {
                            $liveStockXda[$item['config']] = ($item['open'] == true) ? ($item['count'] ?? 0) : 0;
                        }
                    }
                }
            } catch (\Exception $e) {}

            // 2. STOK XLA (KHFY)
            $liveStockXla = [];
            try {
                $resXla = Http::timeout(5)->get('https://panel.khfy-store.com/api_v3/cek_stock_akrab')->json();
                if (isset($resXla['ok']) && $resXla['ok'] == true) {
                    foreach ($resXla['data'] as $item) {
                        $liveStockXla[$item['type']] = $item['sisa_slot'];
                    }
                }
            } catch (\Exception $e) {}

            // 3. AMBIL DATABASE XDA
            $xda_db = DB::table('ppob_products')
                ->where('is_active', 1)
                ->where(function($query) {
                    $query->where('product_code', 'like', '%XDA%')->orWhere('product_code', 'like', '%XAP%');
                })
                ->select('product_code as kode_layanan', 'product_name as nama_layanan', 'price_sell as harga_jual')
                ->orderBy('price_sell', 'asc')
                ->get();

            if ($xda_db->isEmpty()) {
                $xda_db = DB::table('layanan_kaje')
                    ->where('status', 'active')
                    ->where(function($query) {
                        $query->where('kode_layanan', 'like', '%XDA%')->orWhere('kode_layanan', 'like', '%XAP%');
                    })
                    ->select('kode_layanan', 'nama_layanan', 'harga_jual')
                    ->orderBy('harga_jual', 'asc')
                    ->get();
            }

            $xda = $xda_db->map(function ($item) use ($liveStockXda) {
                $item->kategori = '🔥 AKRAB XDA (Super Ngebut)';
                $item->stok = $liveStockXda[$item->kode_layanan] ?? 0;
                return $item;
            });

            // 4. AMBIL DATABASE XLA
            $list_po_codes = ['XLA89', 'XLA14', 'XLA39', 'XLA32', 'XLA51', 'XLA65'];
            $xla = DB::table('layanan_khfy')
                ->whereIn('kode_layanan', $list_po_codes)
                ->where('status', 'active')
                ->select('kode_layanan', 'nama_layanan', 'harga_jual')
                ->orderBy('harga_jual', 'asc')
                ->get()
                ->map(function ($item) use ($liveStockXla) {
                    $item->kategori = '💠 AKRAB XLA (Paling Laris)';
                    $item->stok = $liveStockXla[$item->kode_layanan] ?? 0;
                    return $item;
                });

            return $xda->merge($xla)->groupBy('kategori');
        });

        // 🚀 SMART POLLING: Jika request dari JavaScript, kirim format JSON ringan!
        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'status' => 'success', 
                'brand' => $brandName, // <-- Brand terkirim ke JSON
                'data' => $products
            ]);
        }

        // Jika request pertama kali dari browser, tampilkan HTML
        return view('public_stok', compact('products', 'brandName'));
    }
}
