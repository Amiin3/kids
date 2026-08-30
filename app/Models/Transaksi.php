<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model {
    protected $table = 'transaksi'; // 🚀 FIX: Pakai nama tunggal sesuai database Lu
    protected $guarded = []; 
    public $timestamps = true; // Karena Lu punya created_at & updated_at

    // 🚀 SMART HOOK: DETEKSI PERUBAHAN STATUS TRANSAKSI -> PUSH NOTIFIKASI
    protected static function booted()
    {
        if (method_exists(get_parent_class(), 'booted')) { parent::booted(); }
        static::updated(function ($model) {
            if ($model->isDirty('status')) {
                $status = strtolower($model->status);
                if (in_array($status, ['sukses', 'success', 'gagal', 'failed', 'error'])) {
                    $user = \App\Models\User::where('name', $model->username)->first();
                    // Gunakan push_token sesuai kolom rontgen database
                    if ($user && !empty($user->push_token)) {
                        $title = in_array($status, ['sukses', 'success']) ? '✅ Pesanan Berhasil!' : '❌ Pesanan Gagal/Refund';
                        $body = "Produk {$model->kode_layanan} (Target: {$model->tujuan}) berstatus: " . strtoupper($status) . ".";
                        \App\Helpers\FcmHelper::sendNotification($user->push_token, $title, $body, 'https://milastore.cloud/riwayat');
                    }
                }
            }
        });
    }
}
