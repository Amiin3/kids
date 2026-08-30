<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ResellerDiscountController extends Controller
{
    private array $providers = ['khfy', 'adam', 'kaje'];

    public function index()
    {
        $discounts = DB::table('reseller_discounts')
            ->pluck('potongan', 'provider')
            ->toArray();

        return Inertia::render('Admin/ResellerDiscount', [
            'khfy' => (int) ($discounts['khfy'] ?? 0),
            'adam' => (int) ($discounts['adam'] ?? 0),
            'kaje' => (int) ($discounts['kaje'] ?? 0),
        ]);
    }

    public function update(Request $request)
    {
        // 1. Validasi ketat (Wajib angka positif)
        $rules = [];
        foreach ($this->providers as $prov) {
            $rules[$prov] = 'nullable|numeric|min:0|max:10000000';
        }
        $validated = $request->validate($rules);

        // 2. Eksekusi simpan & reset cache
        foreach ($this->providers as $prov) {
            $potongan = (int) ($validated[$prov] ?? 0);

            DB::table('reseller_discounts')->updateOrInsert(
                ['provider' => $prov],
                [
                    'potongan'   => $potongan,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            // Bersihkan cache spesifik provider & cache global
            Cache::forget('diskon_reseller_' . $prov);
        }

        Cache::forget('all_reseller_discounts');

        return back()->with('success', '✅ Boom! Diskon Reseller Berhasil Diterapkan!');
    }
}
