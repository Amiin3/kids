<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class PromoController extends Controller
{
    public function index()
    {
        $promos = DB::table('promos')->orderBy('id', 'desc')->get();
        return Inertia::render('Admin/PromoManager', [
            'promos' => $promos
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        try {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = 'promo_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $destinationPath = public_path('uploads/promos');
                
                if (!File::isDirectory($destinationPath)) {
                    File::makeDirectory($destinationPath, 0777, true, true);
                }
                
                $file->move($destinationPath, $filename);
                $imagePath = '/uploads/promos/' . $filename;
            }

            DB::table('promos')->insert([
                'title'       => $request->title,
                'description' => $request->description ?? '',
                'badge'       => $request->badge ?? '',
                'theme'       => $request->theme ?? 'indigo',
                'icon'        => $request->icon ?? 'fa-bolt',
                'url'         => $request->url ?? '#',
                'image'       => $imagePath,
                'is_active'   => $request->is_active ?? 1,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            return back()->with('success', 'Banner berhasil ditambahkan!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Sistem Error: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        try {
            $promo = DB::table('promos')->where('id', $id)->first();
            if (!$promo) return back()->withErrors(['error' => 'Data promo tidak ditemukan.']);

            $imagePath = $promo->image;

            // Hapus gambar lama jika diminta
            if ($request->remove_image == '1') {
                if ($imagePath && File::exists(public_path($imagePath))) {
                    File::delete(public_path($imagePath));
                }
                $imagePath = null;
            }

            // Ganti gambar baru
            if ($request->hasFile('image')) {
                if ($promo->image && File::exists(public_path($promo->image))) {
                    File::delete(public_path($promo->image));
                }

                $file = $request->file('image');
                $filename = 'promo_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $destinationPath = public_path('uploads/promos');
                $file->move($destinationPath, $filename);
                $imagePath = '/uploads/promos/' . $filename;
            }

            DB::table('promos')->where('id', $id)->update([
                'title'       => $request->title,
                'description' => $request->description ?? '',
                'badge'       => $request->badge ?? '',
                'theme'       => $request->theme ?? 'indigo',
                'icon'        => $request->icon ?? 'fa-bolt',
                'url'         => $request->url ?? '#',
                'image'       => $imagePath,
                'is_active'   => $request->is_active ?? 1,
                'updated_at'  => now(),
            ]);

            return back()->with('success', 'Banner berhasil diperbarui!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Sistem Error: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            $promo = DB::table('promos')->where('id', $id)->first();
            if ($promo) {
                // Hapus fisik gambar dari server
                if (!empty($promo->image) && File::exists(public_path($promo->image))) {
                    File::delete(public_path($promo->image));
                }
                DB::table('promos')->where('id', $id)->delete();
            }
            return back()->with('success', 'Banner berhasil dihapus!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menghapus: ' . $e->getMessage()]);
        }
    }

    // API Khusus untuk Slider Dashboard (Konversi URL Full)
    public function apiActive()
    {
        $promos = DB::table('promos')->where('is_active', 1)->orderBy('id', 'desc')->get()->map(function($p) {
            // Berikan URL penuh agar gambar pasti muncul di frontend
            $p->image = $p->image ? asset($p->image) : null;
            return $p;
        });
        return response()->json($promos);
    }
}
