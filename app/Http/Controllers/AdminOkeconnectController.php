<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Exception;

class AdminOkeconnectController extends Controller
{
    public function index() {
        $products = DB::table('layanan_okeconnect')->orderBy('provider')->orderBy('harga_modal')->get();
        return Inertia::render('Admin/OkeconnectManager', ['products' => $products]);
    }

    public function sync() {
        try {
            $response = Http::timeout(60)->get('https://okeconnect.com/harga/json?id=905ccd028329b0a');
            $data = $response->json();
            
            if (!$data) throw new Exception("Gagal membaca JSON dari Okeconnect!");

            $countInsert = 0; $countUpdate = 0;
            
            foreach ($data as $item) {
                $kode = $item['kode'];
                $nama = $item['keterangan']; 
                $kategori = strtoupper($item['kategori']);
                $harga_modal = $item['harga'];
                $status = $item['status'] == '1' ? 'active' : 'inactive';

                $provider = 'LAINNYA';
                if (strpos($kategori, 'TELKOMSEL') !== false || strpos($kategori, 'TSEL') !== false) $provider = 'TELKOMSEL';
                elseif (strpos($kategori, 'INDOSAT') !== false || strpos($kategori, 'ISAT') !== false) $provider = 'INDOSAT';
                elseif (strpos($kategori, 'XL') !== false) $provider = 'XL';
                elseif (strpos($kategori, 'AXIS') !== false) $provider = 'AXIS';
                elseif (strpos($kategori, 'SMART') !== false) $provider = 'SMARTFREN';
                elseif (strpos($kategori, 'TRI') !== false || strpos($kategori, 'THREE') !== false) $provider = 'TRI';
                elseif (strpos($kategori, 'PLN') !== false || strpos($kategori, 'TOKEN') !== false) $provider = 'PLN';

                $tipe = 'DATA';
                if (strpos($kategori, 'PULSA') !== false) $tipe = 'PULSA';
                elseif (strpos($kategori, 'E-MONEY') !== false || strpos($kategori, 'SALDO') !== false) $tipe = 'EWALLET';
                elseif (strpos($kategori, 'GAME') !== false) $tipe = 'GAMES';

                $exists = DB::table('layanan_okeconnect')->where('kode_layanan', $kode)->first();
                
                if ($exists) {
                    DB::table('layanan_okeconnect')->where('kode_layanan', $kode)->update([
                        'nama_layanan' => $nama, 'provider' => $provider, 'tipe' => $tipe,
                        'harga_modal' => $harga_modal, 'updated_at' => now()
                    ]);
                    $countUpdate++;
                } else {
                    DB::table('layanan_okeconnect')->insert([
                        'kode_layanan' => $kode, 'nama_layanan' => $nama, 'provider' => $provider, 'tipe' => $tipe,
                        'harga_modal' => $harga_modal, 'harga_jual' => $harga_modal + 1500,
                        'status' => $status, 'created_at' => now(), 'updated_at' => now()
                    ]);
                    $countInsert++;
                }
            }
            return back()->with('success', "Sinkronisasi Selesai! Baru: $countInsert, Update: $countUpdate");
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function bulkMarkup(Request $request) {
        $type = $request->type;
        $amount = (float) $request->amount;
        $provider = $request->provider;

        $query = DB::table('layanan_okeconnect');
        if ($provider !== 'ALL') {
            $query->where('provider', $provider);
        }
        
        $products = $query->get();
        foreach($products as $p) {
            if ($type === 'persen') {
                $newPrice = $p->harga_modal + ($p->harga_modal * ($amount / 100));
            } else {
                $newPrice = $p->harga_modal + $amount;
            }
            DB::table('layanan_okeconnect')->where('id', $p->id)->update(['harga_jual' => ceil($newPrice)]);
        }
        return back()->with('success', 'Markup Massal Berhasil Diterapkan!');
    }

    public function toggleStatus($id) {
        $prod = DB::table('layanan_okeconnect')->where('id', $id)->first();
        if ($prod) {
            $newStatus = $prod->status === 'active' ? 'inactive' : 'active';
            DB::table('layanan_okeconnect')->where('id', $id)->update(['status' => $newStatus]);
            return back()->with('success', 'Status produk berhasil diubah!');
        }
        return back()->with('error', 'Produk tidak ditemukan!');
    }

    public function store(Request $request) {
        DB::table('layanan_okeconnect')->insert([
            'kode_layanan' => $request->kode_layanan, 'nama_layanan' => $request->nama_layanan,
            'provider' => strtoupper($request->provider), 'tipe' => $request->tipe ?? 'PULSA',
            'harga_modal' => $request->harga_modal, 'harga_jual' => $request->harga_jual,
            'status' => $request->status ?? 'active', 'created_at' => now(), 'updated_at' => now()
        ]);
        return back()->with('success', 'Produk Ditambahkan!');
    }

    public function update(Request $request, $id) {
        DB::table('layanan_okeconnect')->where('id', $id)->update([
            'kode_layanan' => $request->kode_layanan, 'nama_layanan' => $request->nama_layanan,
            'provider' => strtoupper($request->provider), 'tipe' => $request->tipe ?? 'PULSA',
            'harga_modal' => $request->harga_modal, 'harga_jual' => $request->harga_jual,
            'status' => $request->status, 'updated_at' => now()
        ]);
        return back()->with('success', 'Produk Diupdate!');
    }

    public function destroy($id) {
        DB::table('layanan_okeconnect')->where('id', $id)->delete();
        return back()->with('success', 'Produk Dihapus!');
    }
}
