<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * 🛡️ MESIN DISKON RESELLER (SMART CACHED)
     */
    protected function hitungHargaReseller($hargaTabel, $hargaModal, $provider, $userLevel)
    {
        $hargaTabel = (int) $hargaTabel;
        $hargaModal = (int) $hargaModal;
        $cleanLevel = strtolower(trim((string) $userLevel));
        $cleanProv  = strtolower(trim((string) $provider));

        // Hanya reseller dan admin yang mendapat potongan
        if ($cleanLevel !== 'reseller' && $cleanLevel !== 'admin') {
            return $hargaTabel;
        }

        // Ambil diskon via Cache (otomatis ter-refresh saat admin update)
        $diskon = (int) Cache::remember(
            'diskon_reseller_' . $cleanProv,
            3600,
            fn () => DB::table('reseller_discounts')
                ->where('provider', $cleanProv)
                ->value('potongan') ?? 0
        );

        if ($diskon <= 0) {
            return $hargaTabel;
        }

        $hargaAkhir = $hargaTabel - $diskon;

        // Safety Net: Gak boleh lebih murah dari modal
        $batasBawah = ($hargaModal > 0) ? $hargaModal : 1;

        return max($hargaAkhir, $batasBawah);
    }
}
