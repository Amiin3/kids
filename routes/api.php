<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::any('/webhook/khfy', [\App\Http\Controllers\WebhookKhfyController::class, 'handle']);
Route::any('/webhook/digiflazz', [\App\Http\Controllers\WebhookDigiflazzController::class, 'handle']);
Route::any('/webhook/kaje', [\App\Http\Controllers\WebhookKajeWarController::class, 'handle']);

// Rute API Publik Mila Store (Live Command Center VIP)
Route::get('/areaxl/area-all', [\App\Http\Controllers\PublicToolsController::class, 'getAreaAll']);
Route::get('/areaxl/stok-filter', [\App\Http\Controllers\PublicToolsController::class, 'cekStokFilter']);

// 🤖 JALUR KHUSUS BOT WHATSAPP
Route::post('/bot-wa/webhook', [\App\Http\Controllers\Api\BotWaController::class, 'handle']);

// ==========================================
// 🚀 JALUR API H2H MILASTORE (BENTENG BAJA)
// ==========================================
use App\Http\Controllers\Api\H2HController;
use App\Http\Middleware\H2HAuth;

// Semua route di bawah ini WAJIB pakai API Key (H2HAuth)
Route::prefix('v1')->middleware([H2HAuth::class])->group(function () {
    
    // 🛑 LIMITER KETAT (4x per detik): Khusus Cek Stok
    Route::middleware('throttle:check-stock-limit')->group(function () {
        Route::post('/check-stock', [H2HController::class, 'checkStock']);
    });

    // 🚦 LIMITER NORMAL (60x per menit): Profil, Pricelist, dan Transaksi
    Route::middleware('throttle:h2h-normal')->group(function () {
        Route::post('/profile', [H2HController::class, 'profile']);
        Route::post('/pricelist', [H2HController::class, 'pricelist']);
        Route::post('/transaction', [H2HController::class, 'transaction']);
        Route::post('/transaction/status', [H2HController::class, 'status']);
    });
});
Route::post('/gateway/pay', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'createTransaction']);
Route::get('/gateway/status/{id}', ['App\Http\Controllers\Api\PaymentGatewayStatusController', 'check']);

// ==========================================
// JALUR API AKRAB (RESELLER / PENYEWA API)
// ==========================================
Route::middleware([\App\Http\Middleware\ApiAkrabProtected::class])->prefix('v1/apiakrab')->group(function () {
    Route::post('/sessions', [\App\Http\Controllers\Api\ApiAkrabController::class, 'listSessions']);
    Route::post('/invite', [\App\Http\Controllers\Api\ApiAkrabController::class, 'executeInvite']);
});

Route::post('/telegram/webhook', [\App\Http\Controllers\TelegramBotController::class, 'webhook']);

// 🚀 JALUR TIKUS VIP WAR ENGINE MILASTORE (NO AUTH & NO CSRF)
Route::any('/war-machine/trigger', [\App\Http\Controllers\AdminKhfyController::class, 'warExecute']);

// === WEBHOOK / CALLBACK PROVIDER H2H ===
Route::post('/callback/digiflazz', [\App\Http\Controllers\ApiCallbackController::class, 'digiflazz']);
Route::any('/callback/okeconnect', [\App\Http\Controllers\ApiCallbackController::class, 'okeconnect']);
