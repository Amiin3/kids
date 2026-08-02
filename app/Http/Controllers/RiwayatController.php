<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RiwayatController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        $search = $request->input('search');
        $statusFilter = $request->input('status'); // Nangkep filter status

        // 🟢 JALUR SESEPUH: TRANSAKSI PROVIDER LAMA
        $q1 = DB::table('transaksi')
            ->select(
                'id', 'username', 'tujuan', 'ref_id', 'sn', 'kode_layanan',
                DB::raw("'-' as keterangan"),
                'status', 'created_at', 'updated_at', 'harga'
            )
            ->where(function($q) use ($user) {
                $q->where('username', $user->name);
                if (!empty($user->username)) {
                    $q->orWhere('username', $user->name);
                }
            });

        // 🔵 JALUR BARU: TRANSAKSI ADAMMEDIA
        $q2 = DB::table('ppob_transactions')
            ->select(
                'id', 'username', 'target as tujuan', 'ref_id', 'sn', 'product_code as kode_layanan',
                'message as keterangan', 'status', 'created_at', 'updated_at', 'price as harga'
            )
            ->where(function($q) use ($user) {
                $q->where('username', $user->name);
                if (!empty($user->username)) {
                    $q->orWhere('username', $user->username);
                }
            });

        // 🔍 FITUR SEARCH: MENCARI DI KEDUA JALUR
        if ($search) {
            $q1->where(function($q) use ($search) {
                $q->where('tujuan', 'like', "%{$search}%")
                  ->orWhere('ref_id', 'like', "%{$search}%")
                  ->orWhere('kode_layanan', 'like', "%{$search}%");
            });
            $q2->where(function($q) use ($search) {
                $q->where('target', 'like', "%{$search}%")
                  ->orWhere('ref_id', 'like', "%{$search}%")
                  ->orWhere('product_code', 'like', "%{$search}%");
            });
        }

        // 🎛️ FITUR FILTER STATUS
        if ($statusFilter && $statusFilter !== 'Semua') {
            if ($statusFilter === 'Berhasil') {
                $q1->whereIn('status', ['Sukses', 'Success', 'Berhasil']);
                $q2->whereIn('status', ['Sukses', 'Success', 'Berhasil']);
            } elseif ($statusFilter === 'Gagal') {
                $q1->whereIn('status', ['Gagal', 'Failed', 'Error', 'Batal']);
                $q2->whereIn('status', ['Gagal', 'Failed', 'Error', 'Batal']);
            } elseif ($statusFilter === 'Pending') {
                $q1->whereNotIn('status', ['Sukses', 'Success', 'Berhasil', 'Gagal', 'Failed', 'Error', 'Batal']);
                $q2->whereNotIn('status', ['Sukses', 'Success', 'Berhasil', 'Gagal', 'Failed', 'Error', 'Batal']);
            }
        }

        // 🔗 PENGGABUNGAN TANPA MERUSAK DATA
        $union = $q1->unionAll($q2);

        // 📄 PAGINASI SEMPURNA
        $transactions = DB::table(DB::raw("({$union->toSql()}) as combined"))
            ->mergeBindings($union)
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        // 🚀 KIRIM KE FRONTEND INERTIA
        return Inertia::render('Transaction/History', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'status'])
        ]);
    }
}
