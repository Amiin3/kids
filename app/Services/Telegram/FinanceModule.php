<?php
namespace App\Services\Telegram;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FinanceModule
{
    public static function getSummary()
    {
        try {
            $saldoMember = DB::table('users')->sum('saldo');
            $depoPending = DB::table('deposits')->where('status', 'Pending')->count();
            
            // Coba ambil dari kolom 'tanggal', jika gagal nanti tertangkap catch
            $trxToday = DB::table('transaksi')->whereDate('tanggal', date('Y-m-d'))->count();
            $omsetToday = DB::table('transaksi')->whereDate('tanggal', date('Y-m-d'))->where('status', 'Sukses')->sum('harga_beli');

            return [
                'saldo_member' => (float)$saldoMember,
                'saldo_formatted' => 'Rp ' . number_format((float)$saldoMember, 0, ',', '.'),
                'depo_pending' => $depoPending,
                'trx_today'    => $trxToday,
                'omset_today'  => 'Rp ' . number_format((float)$omsetToday, 0, ',', '.')
            ];
        } catch (\Exception $e) {
            Log::error("Finance Module Error: " . $e->getMessage());
            return [
                'saldo_member' => 0,
                'saldo_formatted' => 'Rp 0 (Cek Log DB)',
                'depo_pending' => 0,
                'trx_today'    => 0,
                'omset_today'  => 'Rp 0'
            ];
        }
    }
}
