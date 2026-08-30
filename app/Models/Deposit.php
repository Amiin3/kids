<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deposit extends Model
{
    protected $table = 'deposits';
    protected $guarded = [];

    // 🚀 SMART HOOK: DETEKSI PERUBAHAN STATUS DEPOSIT -> PUSH NOTIFIKASI
    protected static function booted()
    {
        if (method_exists(get_parent_class(), 'booted')) { parent::booted(); }
        static::updated(function ($model) {
            if ($model->isDirty('status')) {
                $status = strtolower($model->status);
                if (in_array($status, ['sukses', 'success', 'gagal', 'failed', 'ditolak'])) {
                    $user = \App\Models\User::find($model->user_id);
                    if ($user && !empty($user->push_token)) {
                        $title = in_array($status, ['sukses', 'success']) ? '💰 Deposit Masuk!' : '❌ Deposit Ditolak';
                        $body = "Isi saldo Rp " . number_format($model->amount, 0, ',', '.') . " via {$model->metode} berstatus: " . strtoupper($status) . ".";
                        \App\Helpers\FcmHelper::sendNotification($user->push_token, $title, $body, 'https://milastore.cloud/deposit');
                    }
                }
            }
        });
    }
}
