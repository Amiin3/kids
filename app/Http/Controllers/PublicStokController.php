<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class PublicStokController extends Controller
{
    public function index(Request $request)
    {
        $brandName = "MILASTORE";

        $data = Cache::remember('master_stock_inertia_v1', 5, function () {
            
            // 1. LIVE STOK ADAMMEDIA
            $stockAdam = [];
            try {
                $key = env('ADAMMEDIA_API_KEY', '');
                if (empty($key) && file_exists(base_path('.env'))) {
                    preg_match('/ADAMMEDIA_API_KEY=(.*)/', file_get_contents(base_path('.env')), $matches);
                    $key = trim($matches[1] ?? '');
                }
                $resReg = Http::withHeaders(['x-api-key' => $key])->timeout(5)->get("https://juraganxl.my.id/api/regulers")->json();
                if (is_array($resReg)) foreach ($resReg as $item) if (isset($item['config'])) $stockAdam[strtoupper($item['config'])] = ($item['open'] ?? true) ? ($item['count'] ?? 0) : 0;
            } catch (\Exception $e) {}

            // 2. LIVE STOK KHFY
            $stockKhfy = [];
            try {
                $resXla = Http::timeout(5)->get('https://panel.khfy-store.com/api_v3/cek_stock_akrab')->json();
                if (isset($resXla['ok']) && $resXla['ok'] == true) foreach ($resXla['data'] as $item) $stockKhfy[$item['type']] = $item['sisa_slot'] ?? 0;
            } catch (\Exception $e) {}

            // 3. TARIK DATABASE KHFY (XLA DI ATAS)
            $xlaProducts = DB::table('layanan_khfy')
                ->where('kode_layanan', 'like', 'XLA%')->where('harga_jual', '>', 0)->orderBy('harga_jual', 'asc')->get()
                ->map(function ($item) use ($stockKhfy) {
                    $p = new \stdClass();
                    $p->product_code = $item->kode_layanan; $p->product_name = $item->nama_layanan;
                    $p->price_sell = $item->harga_jual; $p->stok = $stockKhfy[$item->kode_layanan] ?? 0;
                    $p->kategori = 'XLA';
                    $p->areas = $this->parseArea($item->deskripsi); $p->note = $this->parseNote($item->deskripsi);
                    return $p;
                });

            // 4. TARIK DATABASE ADAMMEDIA
            $adamProducts = DB::table('ppob_products')
                ->where('provider_name', 'ADAMMEDIA')->where('is_active', 1)->where('price_sell', '>', 0)
                ->where(function($q) { $q->where('product_code', 'like', 'XDA%')->orWhere('product_code', 'like', 'AM%')->orWhere('product_code', 'like', 'XAP%'); })
                ->orderBy('price_sell', 'asc')->get()
                ->map(function ($item) use ($stockAdam) {
                    $p = new \stdClass();
                    $p->product_code = $item->product_code; $p->product_name = $item->product_name;
                    $p->price_sell = $item->price_sell; $p->stok = $stockAdam[strtoupper($item->product_code)] ?? 0;
                    $p->kategori = str_starts_with($item->product_code, 'AM') ? 'AM' : 'XDA';
                    $p->areas = $this->parseArea($item->description); $p->note = $this->parseNote($item->description);
                    return $p;
                });

            $grouped = collect(['XLA' => $xlaProducts])->merge($adamProducts->groupBy('kategori'))->filter(function($items) { return $items->isNotEmpty(); });
            return $grouped;
        });

        $totalStok = 0; foreach ($data as $cat => $items) foreach ($items as $item) $totalStok += $item->stok;

        // RETURN RESMI REACT INERTIA
        return Inertia::render('PublicStok', [
            'products' => $data,
            'brandName' => $brandName,
            'totalStok' => $totalStok
        ]);
    }

    private function parseArea($desc) {
        $areas = [];
        if (empty($desc) || $desc == '-' || $desc == ' ') return $areas;

        $mainText = $desc;
        if (stripos($mainText, 'noted') !== false) {
            $parts = preg_split('/noted\s*[:=]?/i', $mainText);
            $mainText = $parts[0]; 
        }

        $mainText = str_ireplace(['DETAILS KUOTA', 'DETAIL KUOTA'], '', $mainText);
        $mainText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '\n', '\\n'], " ", $mainText));
        $mainText = preg_replace('/(area\s*\d+|global)/i', '|$1', $mainText);
        $chunks = explode('|', $mainText);

        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);
            if (empty($chunk)) continue;
            if (preg_match('/(Area\s*\d+|Global)\s*[:=]?\s*(.*)/i', $chunk, $matches)) {
                $name = trim(str_ireplace('area', 'Area ', $matches[1]));
                $name = preg_replace('/\s+/', ' ', $name);
                $kuota = trim($matches[2], " ~|-");
                if (!empty($kuota)) $areas[] = ['name' => $name, 'kuota' => $kuota];
            }
        }
        return $areas;
    }

    private function parseNote($desc) {
        if (empty($desc)) return '';
        if (stripos($desc, 'noted') !== false) {
            $parts = preg_split('/noted\s*[:=~]?/i', $desc);
            if (isset($parts[1])) {
                $note = trim(strip_tags(str_replace(['<br>', '\n', '\\n'], ' ', $parts[1])));
                $noteParts = explode('|', preg_replace('/(noted\s*[:=~]?)/i', '|', $note));
                return trim($noteParts[0], " ~|-");
            }
        }
        return '';
    }
}
