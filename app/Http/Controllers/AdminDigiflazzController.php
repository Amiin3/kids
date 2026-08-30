<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;

class AdminDigiflazzController extends Controller
{
    public function index() {
        $products = DB::table('products')->orderBy('category', 'asc')->orderBy('product_name', 'asc')->get();
        $categories = DB::table('products')->select('category')->distinct()->whereNotNull('category')->pluck('category');
        $brands = DB::table('products')->select('brand')->distinct()->whereNotNull('brand')->pluck('brand');

        $stats = [
            'total' => DB::table('products')->count(),
            'active' => DB::table('products')->where('status', 'active')->orWhere('status', 'Aktif')->count(),
            'inactive' => DB::table('products')->where('status', 'inactive')->orWhere('status', 'Nonaktif')->count(),
            'categories' => count($categories)
        ];

        return Inertia::render('Admin/DigiflazzManager', [
            'products' => $products,
            'stats' => $stats,
            'categories' => $categories,
            'brands' => $brands
        ]);
    }

    public function sync(Request $request) {
        set_time_limit(1500);
        ini_set('memory_limit', '512M');
        
        $u = env('DIGI_USERNAME') ?: config('services.digiflazz.username');
        $k = env('DIGI_APIKEY') ?: config('services.digiflazz.apikey');
        
        if (!$u || !$k) {
            return response()->json(['success' => false, 'message' => 'Kredensial DIGI_USERNAME / DIGI_APIKEY tidak ditemukan di .env!'], 400);
        }

        $sign = md5($u . $k . 'pricelist');
        
        try {
            $res = Http::timeout(180)->post('https://api.digiflazz.com/v1/price-list', [
                'cmd' => 'prepaid',
                'username' => $u,
                'sign' => $sign
            ]);
            
            $result = $res->json();
            
            if (!is_array($result) || !isset($result['data']) || empty($result['data'])) {
                $msg = $result['data']['message'] ?? 'Gagal menghubungi server Digiflazz atau data kosong.';
                Log::error('Digiflazz Sync Error: ' . json_encode($result));
                return response()->json(['success' => false, 'message' => $msg], 400);
            }

            $markupP = (float) ($request->input('markup_persen') ?: 0);
            $markupF = (float) ($request->input('markup_flat') ?: 0);
            
            $kelompok = DB::table('kelompok')->where('nama_kelompok', 'Digiflazz')->first();
            $kId = $kelompok ? $kelompok->id : DB::table('kelompok')->insertGetId(['nama_kelompok' => 'Digiflazz', 'provider' => 'digiflazz', 'created_at' => now(), 'updated_at' => now()]);
            
            DB::beginTransaction();

            // 1. 🧹 SAPU JAGAT AMAN: Hapus total data lama tanpa error transaksi
            DB::table('products')->delete();
            DB::table('layanan')->where('kelompok_id', $kId)->delete();

            $dataToInsertLayanan = [];
            $dataToInsertProducts = [];
            $count = 0;

            // 2. Masukkan data baru (Fresh) dari Digiflazz
            foreach ($result['data'] as $item) {
                $sku = $item['buyer_sku_code'] ?? $item['sku'] ?? null;
                if (!$sku) continue;
                
                $modal = (float) $item['price'];
                $jual = ceil($modal + ($modal * ($markupP / 100)) + $markupF);
                $status = ($item['buyer_product_status'] && $item['seller_product_status']) ? 'active' : 'inactive';
                
                $brand = strtoupper(trim($item['brand'] ?? 'LAINNYA'));
                $category = $item['category'] ?? 'LAINNYA';
                $tipe = (stripos($category, 'data') !== false || stripos($category, 'internet') !== false) ? 'DATA' : strtoupper($category);
                
                $dataToInsertLayanan[] = [
                    'kode_layanan' => $sku,
                    'nama_layanan' => $item['product_name'],
                    'provider'     => $brand,
                    'harga_beli'   => $modal,
                    'harga_jual'   => $jual,
                    'tipe'         => $tipe,
                    'status'       => $status,
                    'kelompok_id'  => $kId,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ];
                
                $dataToInsertProducts[] = [
                    'sku' => $sku,
                    'product_name' => $item['product_name'],
                    'category' => $category,
                    'brand' => $brand,
                    'price' => $jual,
                    'status' => $status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $count++;
            }
            
            // Insert massal bertahap agar RAM server aman
            foreach (array_chunk($dataToInsertLayanan, 500) as $chunk) {
                DB::table('layanan')->insert($chunk);
            }

            foreach (array_chunk($dataToInsertProducts, 500) as $chunk) {
                DB::table('products')->insert($chunk);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true, 
                'message' => 'Sapu Jagat Selesai! ' . number_format($count) . ' data baru berhasil ditambahkan.'
            ]);
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Fatal Sync Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal Sinkron: ' . $e->getMessage()], 500);
        }
    }

    public function toggleStatus($sku) {
        $prod = DB::table('products')->where('sku', $sku)->first();
        if ($prod) {
            $newStatus = ($prod->status === 'active' || $prod->status === 'Aktif') ? 'inactive' : 'active';
            DB::table('products')->where('sku', $sku)->update(['status' => $newStatus, 'updated_at' => now()]);
            DB::table('layanan')->where('kode_layanan', $sku)->update(['status' => $newStatus, 'updated_at' => now()]);
            return back()->with('success', 'Status produk berhasil diubah!');
        }
        return back()->with('error', 'Produk tidak ditemukan!');
    }

    public function updatePrice(Request $request, $sku) {
        $request->validate(['harga_jual' => 'required|numeric|min:0']);
        
        $prod = DB::table('products')->where('sku', $sku)->first();
        if ($prod) {
            $newPrice = (float) $request->harga_jual;
            DB::table('products')->where('sku', $sku)->update(['price' => $newPrice, 'updated_at' => now()]);
            DB::table('layanan')->where('kode_layanan', $sku)->update(['harga_jual' => $newPrice, 'updated_at' => now()]);
            
            return back()->with('success', 'Harga satuan berhasil diupdate!');
        }
        return back()->with('error', 'Produk tidak ditemukan!');
    }
}
