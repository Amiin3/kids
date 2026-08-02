<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdammediaService;
use App\Models\PpobProduct;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AdammediaController extends Controller {
    
    public function index(AdammediaService $srv) {
        return Inertia::render('Admin/Adammedia', [
            'info'     => $srv->getInfoAdmin(),
            'products' => PpobProduct::where('provider_name', 'ADAMMEDIA')
                            ->whereIn('category', ['REGULER', 'PROMO', 'AM'])
                            ->orderBy('category')
                            ->get()
        ]);
    }

    public function ticket(Request $request, AdammediaService $srv) {
        $res = $srv->requestTicket($request->amount);
        return response()->json(['message' => $res]);
    }

    public function sync(AdammediaService $srv) {
        $regulers = collect($srv->getLiveStockAdmin('regulers'));
        $am = collect($srv->getLiveStockAdmin('stocks-am'));
        $live = $regulers->concat($am);
        
        if($live->isEmpty()) return back()->with('error', 'Gagal ambil data stok pusat!');
        
        foreach ($live as $p) {
            $safeName = $p['name'] ?? $p['config'] ?? 'PRODUK';
            $config = strtoupper($p['config']);
            $kategori = str_starts_with($config, 'AM') ? 'AM' : 'REGULER';
            
            PpobProduct::updateOrCreate(
                ['product_code' => $config, 'provider_name' => 'ADAMMEDIA'],
                [
                    'product_name' => $safeName,
                    'category'     => $kategori,
                    'price_cost'   => $p['price'] ?? 0,
                    'is_active'    => ($p['status'] ?? '') === 'pagi' ? 1 : 0,
                ]
            );
        }
        return back()->with('success', 'Sinkronisasi XDA & AM Berhasil!');
    }

    public function update(Request $request, $id) {
        $product = PpobProduct::findOrFail($id);
        $product->update([
            'price_sell'  => $request->has('price_sell') ? $request->price_sell : $product->price_sell,
            'is_active'   => $request->has('is_active') ? $request->is_active : $product->is_active,
            'description' => $request->has('description') ? $request->description : $product->description
        ]);
        return back();
    }

    // 🤖 FITUR SULTAN V2: API MURNI, BATCH TRANSACTION (KECEPATAN MILIDETIK)
    public function autoPriceUpdate(Request $request) {
        try {
            $rawText = $request->raw_text;
            $markupType = $request->markup_type; // 'rp' atau 'percent'
            $markupValue = (float) $request->markup_value;

            // Pecah teks berdasarkan baris (Lebih aman dari regex looping)
            $lines = explode("\n", $rawText);
            $updates = [];

            foreach ($lines as $line) {
                // Regex Presisi: Ambil Kode (AM38/XDA13) lalu abaikan karakter selain angka sampai ketemu Harga
                if (preg_match('/([a-zA-Z]+\d+)[^0-9]*([\d\.]+)/', $line, $matches)) {
                    $code = strtoupper(trim($matches[1]));
                    $priceCostStr = str_replace('.', '', trim($matches[2]));
                    $priceCost = (float) $priceCostStr;

                    if ($priceCost <= 0) continue;

                    // 🧮 Hitung Harga Jual Otomatis Berdasarkan Markup
                    $priceSell = $priceCost;
                    if ($markupType === 'percent') {
                        $priceSell = $priceCost + ($priceCost * ($markupValue / 100));
                    } else {
                        $priceSell = $priceCost + $markupValue;
                    }

                    $updates[$code] = [
                        'price_cost' => $priceCost,
                        'price_sell' => round($priceSell)
                    ];
                }
            }

            if (empty($updates)) {
                return response()->json(['success' => false, 'message' => 'Gagal! Tidak ada format Kode = Harga yang valid ditemukan.']);
            }

            $updatedCount = 0;

            // 🚀 BATCH EXECUTION: Eksekusi semua sekaligus (Sangat Cepat)
            DB::beginTransaction();
            foreach ($updates as $code => $data) {
                $affected = PpobProduct::where('provider_name', 'ADAMMEDIA')
                                      ->where('product_code', $code)
                                      ->update($data);
                if ($affected) {
                    $updatedCount++;
                }
            }
            DB::commit();

            return response()->json([
                'success' => true, 
                'message' => "🤖 Boom! Robot sukses mengupdate $updatedCount harga produk dalam sekejap!"
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Terjadi error sistem: ' . $e->getMessage()]);
        }
    }
}
