<?php
namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Models\PpobProduct;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AkrabV8Controller extends Controller {
    
    private function getMappedProducts() {
        $apiKey = env('ADAMMEDIA_API_KEY', env('JURAGAN_API_KEY', ''));

        $regulerLive = Cache::remember('juragan_reguler_v8', 5, function() use ($apiKey) {
            try { return Http::withHeaders(['x-api-key' => $apiKey])->timeout(5)->get('https://juraganxl.my.id/api/regulers')->json() ?? []; } 
            catch (\Exception $e) { return []; }
        });

        $amLive = Cache::remember('juragan_am_v8', 5, function() use ($apiKey) {
            try { return Http::withHeaders(['x-api-key' => $apiKey])->timeout(5)->get('https://juraganxl.my.id/api/stocks-am')->json() ?? []; } 
            catch (\Exception $e) { return []; }
        });

        $liveStockMap = [];
        $allLive = array_merge((array)$regulerLive, (array)$amLive);
        foreach ($allLive as $item) {
            if (isset($item['config'])) {
                $code = strtoupper($item['config']);
                $liveStockMap[$code] = (isset($item['open']) && $item['open'] == true) ? ($item['count'] ?? 0) : 0;
            }
        }

        $userLevel = Auth::check() ? DB::table('users')->where('id', Auth::id())->value('level') ?? 'member' : 'member';

        $mapStock = function($items) use ($liveStockMap, $userLevel) {
            return $items->map(function($p) use ($liveStockMap, $userLevel) {
                $lookupCode = strtoupper($p->product_code);
                if (str_starts_with($lookupCode, 'XAP')) $lookupCode = str_replace('XAP', 'XDA', $lookupCode);
                
                $p->live_stock = $liveStockMap[$lookupCode] ?? ($p->stock_count ?? 0);
                $p->price_sell = $this->hitungHargaReseller($p->price_sell, $p->price_buy ?? 0, 'adam', $userLevel);
                return $p;
            });
        };

        return [
            'reguler' => $mapStock(PpobProduct::where('provider_name', 'ADAMMEDIA')->where('category', 'REGULER')->where('is_active', 1)->get()),
            'promo'   => $mapStock(PpobProduct::where('provider_name', 'ADAMMEDIA')->where('category', 'PROMO')->where('is_active', 1)->get()),
            'am'      => $mapStock(PpobProduct::where('provider_name', 'ADAMMEDIA')->where('category', 'AM')->where('is_active', 1)->get()),
        ];
    }

    public function index() {
        return Inertia::render('Order/AkrabV8', $this->getMappedProducts());
    }

    public function liveStock() {
        return response()->json($this->getMappedProducts());
    }

    // 🛠️ TOOL 1: CEK PROMO FLEXMAX (Boleh untuk Member)
    public function checkPromo(Request $request) {
        $apiKey = env('ADAMMEDIA_API_KEY', env('JURAGAN_API_KEY', ''));
        try {
            $res = Http::withHeaders(['x-api-key' => $apiKey])->timeout(10)->post('https://juraganxl.my.id/api/check-promo', ['msisdn' => $request->msisdn]);
            return response()->json($res->json());
        } catch (\Exception $e) { return response()->json(['error' => 'Gagal terhubung ke server pusat.'], 500); }
    }

    // 🔒 TOOL 2: CEK RIWAYAT TRANSAKSI PUSAT (MUTLAK HANYA UNTUK ADMIN MILASTORE)
    public function checkTransaction(Request $request) {
        $userLevel = strtolower(Auth::user()->level ?? '');
        if (!in_array($userLevel, ['admin', 'superadmin', 'owner'])) {
            return response()->json(['error' => 'Akses Ditolak! Fitur ini khusus Admin MILASTORE.'], 403);
        }

        $apiKey = env('ADAMMEDIA_API_KEY', env('JURAGAN_API_KEY', ''));
        $query = [];
        if ($request->filled('msisdn')) $query['msisdn'] = $request->msisdn;
        if ($request->filled('reffid')) $query['reffid'] = $request->reffid;

        try {
            $res = Http::withHeaders(['x-api-key' => $apiKey])->timeout(10)->get('https://juraganxl.my.id/api/transactions', $query);
            return response()->json($res->json());
        } catch (\Exception $e) { return response()->json(['error' => 'Gagal melacak transaksi pusat.'], 500); }
    }
}
