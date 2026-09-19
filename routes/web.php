<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RiwayatController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\OrderPulsaController;
use App\Http\Controllers\OrderDataController;
use App\Http\Controllers\OrderEwalletController;
use App\Http\Controllers\OrderPlnController;
use App\Http\Controllers\OrderGamesController;
use App\Http\Controllers\OrderVoucherController;
use App\Http\Controllers\AkrabOrderController;
use App\Http\Controllers\OrderXdaController;
use App\Http\Controllers\OrderPoXdaController;
use App\Http\Controllers\OrderMasaAktifController;
use App\Http\Controllers\OrderPerdanaController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminDigiflazzController;
use App\Http\Controllers\AdminKajeController;
use App\Http\Controllers\AdminKhfyController;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\XlToolController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\AdminTransactionController;
use App\Http\Controllers\NotifikasiController;

// Rute yang bikin crash tadi kita pindahkan ke bawah sini (Aman!)
Route::post('/user/po-kaje/submit', [\App\Http\Controllers\UserPoKajeController::class, 'submitPoKaje'])->middleware(['auth', 'verified']);

Route::get('/', function () { return Inertia::render('Welcome'); })->name('home');

// 🌐 JALUR UI CEK KUOTA V12 - AKSES PUBLIK (AMAN DARI CRASH)
Route::get('/order/cek-kuota', function () {
    return inertia('Order/CekKuota', [
        'userBalance' => auth()->check() ? auth()->user()->balance : 0
    ]);
})->name('order.cek-kuota');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/developer/api-docs', function () { return \inertia('Developer/ApiDocs'); })->name('developer.api');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::get('/deposit', [DepositController::class, 'index'])->name('deposit.index');
    Route::post('/deposit', [DepositController::class, 'store'])->name('deposit.store');
    
    Route::name('order.')->prefix('order')->group(function () {
        Route::get('/akrab', [AkrabOrderController::class, 'index'])->name('akrab');
        Route::post('/akrab', [AkrabOrderController::class, 'processOrder'])->name('akrab.store');
        Route::get('/xda', [OrderXdaController::class, 'index'])->name('xda');
        Route::post('/xda/poll', [OrderXdaController::class, 'checkStock'])->name('xda.poll');
        Route::post('/xda', [OrderXdaController::class, 'store'])->name('xda.store');
        Route::get('/pulsa', [OrderPulsaController::class, 'index'])->name('pulsa');
        Route::post('/pulsa/order', [OrderPulsaController::class, 'store'])->name('pulsa.store');
        Route::get('/ewallet', [OrderEwalletController::class, 'index'])->name('ewallet');
        Route::post('/ewallet', [OrderEwalletController::class, 'store'])->name('ewallet.store');
    });
});

require __DIR__.'/auth.php';

// --- MENGEMBALIKAN RUTE ADMIN YANG HILANG ---
Route::middleware(['auth', 'verified', \App\Http\Middleware\IsAdmin::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/developer/api-docs', function () { return \inertia('Developer/ApiDocs'); })->name('developer.api');
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::get('/khfy/war', [\App\Http\Controllers\AdminKhfyController::class, 'warPoIndex'])->name('khfy.war.index');
    Route::get('/users', [\App\Http\Controllers\AdminUserController::class, 'index'])->name('users');
    Route::get('/deposit', [\App\Http\Controllers\AdminDepositController::class, 'index'])->name('deposit.index');
    Route::post('/deposit/process', [\App\Http\Controllers\AdminDepositController::class, 'process'])->name('deposit.process');
    Route::get('/audit', [\App\Http\Controllers\Admin\AuditController::class, 'index'])->name('audit.index');
    Route::post('/audit', [\App\Http\Controllers\Admin\AuditController::class, 'index']);
    Route::get('/hesda', [\App\Http\Controllers\Admin\HesdaController::class, 'index'])->name('admin.hesda.index');
    Route::get('/hesda/api/balance', [\App\Http\Controllers\Admin\HesdaController::class, 'fetchBalance']);
    Route::get('/hesda/api/packages', [\App\Http\Controllers\Admin\HesdaController::class, 'fetchPackages']);
    Route::post('/hesda/api/order', [\App\Http\Controllers\Admin\HesdaController::class, 'executeOrder']);
    Route::get('/hesda/api/stock', [\App\Http\Controllers\Admin\HesdaController::class, 'fetchStock']);
    Route::get('/keuangan', [\App\Http\Controllers\AdminController::class, 'index'])->name('keuangan');
    Route::get('/promo', [\App\Http\Controllers\PromoController::class, 'index'])->name('promo.index');
    Route::post('/promo', [PromoController::class, 'store'])->name('admin.promo.store');
    Route::get('/digiflazz', [\App\Http\Controllers\AdminDigiflazzController::class, 'index'])->name('digiflazz.index');
    Route::get('/kaje', [\App\Http\Controllers\AdminKajeController::class, 'index'])->name('kaje.index');
    Route::get('/khfy', [\App\Http\Controllers\AdminKhfyController::class, 'index'])->name('khfy.index');
});

// --- MENGEMBALIKAN SEMUA RUTE ORDER YANG HILANG ---
Route::middleware(['auth', 'verified'])->name('order.')->prefix('order')->group(function () {
    Route::get('/data', [\App\Http\Controllers\OrderDataController::class, 'index'])->name('data');
    Route::post('/data', [\App\Http\Controllers\OrderDataController::class, 'store'])->name('data.store');
    Route::get('/pln', [\App\Http\Controllers\OrderPlnController::class, 'index'])->name('pln');
    Route::post('/pln', [\App\Http\Controllers\OrderPlnController::class, 'store'])->name('pln.store');
    Route::get('/games', [\App\Http\Controllers\OrderGamesController::class, 'index'])->name('games');
    Route::get('/voucher', [\App\Http\Controllers\OrderVoucherController::class, 'index'])->name('voucher');
    Route::get('/masa-aktif', [\App\Http\Controllers\OrderMasaAktifController::class, 'index'])->name('masa-aktif');
    Route::post('/masa-aktif/order', [\App\Http\Controllers\OrderMasaAktifController::class, 'store'])->name('masa-aktif.store');
    Route::get('/perdana', [\App\Http\Controllers\OrderPerdanaController::class, 'index'])->name('perdana');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/tools/xl', [\App\Http\Controllers\XlToolController::class, 'index'])->name('tools.xl');
});

Route::get('/order/akrab/check-stock', [\App\Http\Controllers\AkrabOrderController::class, 'checkStock'])->name('order.akrab.stock');
Route::any('/hook-khfy', [\App\Http\Controllers\WebhookKhfyController::class, 'handle']);
Route::post('/admin/broadcast/send', [\App\Http\Controllers\AdminController::class, 'index'])->name('admin.broadcast.send');
Route::post('/admin/khfy/bulk', [\App\Http\Controllers\AdminKhfyController::class, 'bulk'])->name('admin.khfy.bulk');
Route::post('/admin/khfy/sync', [\App\Http\Controllers\AdminKhfyController::class, 'sync'])->name('admin.khfy.sync');
Route::post('/admin/khfy/war-engine/execute', [\App\Http\Controllers\AdminKhfyController::class, 'warExecute'])->name('admin.khfy.warengine.execute');
Route::post('/admin/khfy/war-engine/list', [\App\Http\Controllers\AdminKhfyController::class, 'warList'])->name('admin.khfy.warengine.list');
Route::post('/admin/khfy/war-engine/action', [\App\Http\Controllers\AdminKhfyController::class, 'warAction'])->name('admin.khfy.warengine.action');

// --- JALUR PROVIDER KAJE ---
Route::prefix('admin/kaje')->name('admin.kaje.')->group(function () {
    Route::get('/', [\App\Http\Controllers\AdminKajeController::class, 'index'])->name('index');
    Route::post('/update', [\App\Http\Controllers\AdminKajeController::class, 'update'])->name('update');
    Route::post('/mass-update', [\App\Http\Controllers\AdminKajeController::class, 'massUpdate'])->name('mass-update');
    Route::post('/sync', [\App\Http\Controllers\AdminKajeController::class, 'sync'])->name('sync');
    Route::delete('/{id}', [\App\Http\Controllers\AdminKajeController::class, 'destroy'])->name('destroy');
});

Route::post('/order/xda/poll', [\App\Http\Controllers\OrderXdaController::class, 'poll'])->name('order.xda.poll');
Route::post('admin/deposit/qris-save', [\App\Http\Controllers\AdminDepositController::class, 'store'])->name('admin.deposit.qris');
Route::post('deposit/cancel', [\App\Http\Controllers\DepositController::class, 'cancel'])->name('deposit.cancel');
Route::post('admin/deposit/bank', [\App\Http\Controllers\AdminDepositController::class, 'updateBank'])->name('admin.deposit.bank');
Route::post('admin/deposit/{id}/action', [\App\Http\Controllers\AdminDepositController::class, 'handleAction'])->name('admin.deposit.action');
Route::get('deposit/{id}/status', [\App\Http\Controllers\DepositController::class, 'status'])->name('deposit.status');

// --- KHUSUS WAR XLA (100% ANTI BEGAL) ---
Route::middleware(['auth'])->group(function () {
    Route::get('/war-xla/sikat', [\App\Http\Controllers\CustomerPoController::class, 'index'])->name('war.xla.index');
    Route::post('/war-xla/sikat', [\App\Http\Controllers\CustomerPoController::class, 'store'])->name('war.xla.store');
    Route::get('/admin/khfy/war-po', [\App\Http\Controllers\AdminKhfyController::class, 'warPoIndex'])->name('admin.khfy.war.po');
});

Route::post('/admin/po/action', [\App\Http\Controllers\AdminPoManagerController::class, 'action'])->name('admin.po.action');

// Rute Saklar Gatling Gun (Support Kaje & Khfy)
Route::post('/admin/po/toggle-status', function(\Illuminate\Http\Request $request) {
    $key = $request->provider == 'kaje' ? 'war_status_kaje' : 'war_status';
    \Illuminate\Support\Facades\DB::table('settings')->updateOrInsert(['key' => $key], ['value' => $request->status]);
    return response()->json(['success' => true]);
})->name('admin.po.toggle');

// 🛡️ JALUR KHUSUS WAR KAJE
Route::middleware(['auth'])->group(function () {
    Route::get('/api/admin/kaje/list', [\App\Http\Controllers\AdminKajeWarController::class, 'getQueue'])->name('admin.kaje.war.list');
    Route::post('/api/admin/kaje/action', [\App\Http\Controllers\AdminKajeWarController::class, 'actionDewa'])->name('admin.kaje.war.action');
});

Route::post('/promo', [\App\Http\Controllers\PromoController::class, 'store'])->middleware(['auth']);
Route::get('/api/active-promos', function() {
    return response()->json(DB::table('promos')->where('is_active', true)->orderBy('id', 'desc')->get());
});

// 🛡️ RUTE PASCABAYAR & OMNI (SUNTIKAN OTOMATIS)
Route::middleware(['auth'])->group(function () {
    Route::get('/order/pascabayar', [\App\Http\Controllers\PascabayarController::class, 'index'])->name('order.pascabayar');
    Route::post('/order/pascabayar/inquiry', [\App\Http\Controllers\PascabayarController::class, 'inquiry'])->name('order.pascabayar.inquiry');
    Route::post('/order/pascabayar/pay', [\App\Http\Controllers\PascabayarController::class, 'pay'])->name('order.pascabayar.pay');
});

Route::get('/api/theme/status', [\App\Http\Controllers\ThemeController::class, 'getTheme']);
Route::middleware(['auth', 'verified', \App\Http\Middleware\IsAdmin::class])->prefix('admin')->group(function () {
    Route::post('/theme/save', [\App\Http\Controllers\ThemeController::class, 'saveTheme']);
});

Route::middleware(["auth", "verified"])->prefix("admin")->group(function () {
    Route::get("/transaksi", [\App\Http\Controllers\AdminTransactionController::class, "index"])->name("admin.transaksi.index");
    Route::post("/transaksi/{id}/status", [\App\Http\Controllers\AdminTransactionController::class, "updateStatus"]);
});

// --- PUSAT NOTIFIKASI SULTAN ---
Route::middleware(["auth", "verified"])->group(function () {
    Route::get("/notifikasi", [\App\Http\Controllers\NotifikasiController::class, "index"])->name("notifikasi.index");
    Route::post("/notifikasi/{id}/read", [\App\Http\Controllers\NotifikasiController::class, "markAsRead"]);
    Route::post("/notifikasi/read-all", [\App\Http\Controllers\NotifikasiController::class, "markAllAsRead"]);
});

Route::middleware(["auth", "verified"])->prefix("admin")->group(function () {
    Route::get("/broadcast", [\App\Http\Controllers\AdminNotificationController::class, "index"])->name("admin.broadcast");
    Route::post("/broadcast/send", [\App\Http\Controllers\AdminNotificationController::class, "send"]);
});

// Pintu Rahasia untuk Menyimpan Token Android Bos
Route::post('/api/save-push-token', function (\Illuminate\Http\Request $request) {
    if (!auth()->check()) return response()->json(['error' => 'Belum Login'], 401);
    $user = auth()->user();
    $user->push_token = $request->token;
    $user->save();
    return response()->json(['success' => true]);
});

Route::post('/api/remove-push-token', function () {
    if (!auth()->check()) return response()->json(['error' => 'Unauthenticated'], 401);
    $user = auth()->user();
    $user->push_token = null;
    $user->save();
    return response()->json(['success' => true]);
});

Route::get('/api/notifications', function() { return DB::table('site_notifications')->orderBy('created_at', 'desc')->limit(10)->get(); })->middleware(['web', 'auth']);

// API Notifikasi untuk Menu Lonceng
Route::middleware(['auth'])->group(function () {
    Route::get('/api/site-notifications', function () {
        return DB::table('site_notifications')->orderBy('created_at', 'desc')->limit(10)->get();
    });
    Route::post('/api/site-notifications/read-all', function () {
        DB::table('site_notifications')->where('is_read', false)->update(['is_read' => true]);
        return response()->json(['status' => 'success']);
    });
    Route::get('/api/get-my-notifications', function () {
        return DB::table('notifications')
            ->orderBy('created_at', 'desc')->limit(10)->get()
            ->map(function ($notif) {
                $notif->data = json_decode($notif->data);
                return $notif;
            });
    });
    Route::post('/api/read-my-notifications', function () {
        DB::table('notifications')->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['status' => 'success']);
    });
    Route::get('/api/get-unread-count', function (\Illuminate\Http\Request $request) {
        $count = \Illuminate\Support\Facades\DB::table('notifications')
            ->where('notifiable_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();
        return response()->json(['count' => $count]);
    });
});

Route::middleware(['auth'])->get('/bantuan', function () { return inertia('Bantuan'); })->name('bantuan');

// Route Portofolio / Statistik
Route::get('/statistik', function () {
    $auth = auth()->user();
    $userDb = \Illuminate\Support\Facades\DB::table('users')->where('id', $auth->id)->first();
    $total_in = \Illuminate\Support\Facades\DB::table('deposits')
        ->where('user_id', $auth->id)
        ->whereIn('status', ['success', 'sukses', 'paid', 'Success', 'Paid'])
        ->sum('amount');
    $total_out = \Illuminate\Support\Facades\DB::table('transaksi')
        ->where(function($q) use ($auth) {
            $q->where('username', $auth->email)->orWhere('username', $auth->name);
        })
        ->whereIn('status', ['success', 'sukses', 'Success', 'Lunas'])
        ->sum('harga');
    $h_depo = \Illuminate\Support\Facades\DB::table('deposits')
        ->where('user_id', $auth->id)
        ->select('amount as amt', 'metode as title', 'status', 'created_at', \Illuminate\Support\Facades\DB::raw("'in' as type"))
        ->orderBy('created_at', 'desc')->limit(5)->get();
    $h_trans = \Illuminate\Support\Facades\DB::table('transaksi')
        ->where(function($q) use ($auth) {
            $q->where('username', $auth->email)->orWhere('username', $auth->name);
        })
        ->select('harga as amt', 'kode_layanan as title', 'status', 'created_at', \Illuminate\Support\Facades\DB::raw("'out' as type"))
        ->orderBy('created_at', 'desc')->limit(10)->get();
    $activities = $h_depo->concat($h_trans)->sortByDesc('created_at')->values()->take(15);
    return inertia('Statistik', [
        'saldo_user' => (float) ($userDb->saldo ?? 0),
        'pemasukan' => (float) $total_in,
        'pengeluaran' => (float) $total_out, 'riwayat' => $activities,
    ]);
})->middleware(['auth'])->name('statistik');

// Rute Verifikasi OTP WhatsApp
Route::get('/verify-otp', [\App\Http\Controllers\Auth\OtpController::class, 'show'])->name('otp.verify');
Route::post('/verify-otp', [\App\Http\Controllers\Auth\OtpController::class, 'verify'])->name('otp.check')->middleware('throttle:3,1');
Route::get('/setup-whatsapp', [\App\Http\Controllers\Auth\OtpController::class, 'setup'])->name('whatsapp.setup');
Route::post('/setup-whatsapp', [\App\Http\Controllers\Auth\OtpController::class, 'sendOtp'])->name('whatsapp.send')->middleware('throttle:1,1');

// Rute Update Profil & Password (FIX ZIGGY)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile-upload-murni', [\App\Http\Controllers\ProfileController::class, 'updateMurni'])->name('profile.update.murni');
});

// ========== ROUTE XL TOOLS & OTP ==========
Route::middleware('auth')->group(function () {
    Route::get('/tools/xl', [\App\Http\Controllers\XlToolsController::class, 'index'])->name('tools.xl');
    Route::post('/tools/xl/get-otp', [\App\Http\Controllers\XlToolsController::class, 'getOtp'])->middleware('throttle:1,1');
    Route::post('/tools/xl/login-otp', [\App\Http\Controllers\XlToolsController::class, 'loginOtp']);
    Route::post('/tools/xl/login-sesi', [\App\Http\Controllers\XlToolsController::class, 'loginSesi']);
    Route::post('/tools/xl/get-info', [\App\Http\Controllers\XlToolsController::class, 'getInfo']);
    Route::post('/tools/xl/set-lock', [\App\Http\Controllers\XlToolsController::class, 'setLock']);
    Route::post('/tools/xl/unreg', [\App\Http\Controllers\XlToolsController::class, 'unsubscribe']);
    Route::get('/tools/xl/list-otp', [\App\Http\Controllers\XlToolsController::class, 'listOtp']);
    Route::post('/tools/xl/order-otp', [\App\Http\Controllers\XlToolsController::class, 'orderOtp']);
    Route::get('/referral', [\App\Http\Controllers\ReferralController::class, 'index'])->name('referral.index');
    Route::post('/referral/cairkan', [\App\Http\Controllers\ReferralController::class, 'cairkan'])->name('referral.cairkan');
});

Route::post('/admin/digiflazz/sync', [\App\Http\Controllers\AdminDigiflazzController::class, 'sync'])->name('admin.digiflazz.sync')->middleware(['auth']);
Route::post('/admin/kaje-war/sync', [\App\Http\Controllers\AdminKajeWarController::class, 'syncPending'])->name('admin.kaje.sync_final');
Route::post('/order/games', [\App\Http\Controllers\OrderGamesController::class, 'store'])->name('order.games.store');
Route::any('/webhook/deposit', [\App\Http\Controllers\Webhook\DepositController::class, 'handle']);
Route::get('/order/po-xda', [\App\Http\Controllers\UserPoKajeController::class, 'index'])->name('order.po-xda.view')->middleware(['auth', 'verified']);
Route::post('/order/po-xda', [\App\Http\Controllers\OrderPoXdaController::class, 'store'])->name('order.po-xda')->middleware(['auth']);
Route::get('auth/google', [\App\Http\Controllers\Auth\GoogleController::class, 'redirectToGoogle'])->name('google.login');
Route::get('auth/google/callback', [\App\Http\Controllers\Auth\GoogleController::class, 'handleGoogleCallback']);

Route::middleware(['auth'])->group(function () {
    Route::get('/admin/kaje/war', [\App\Http\Controllers\AdminKajeWarController::class, 'index'])->name('admin.kaje.war.index');
    Route::get('/admin/kaje/war/logs', [\App\Http\Controllers\AdminKajeWarController::class, 'getLogs'])->name('admin.kaje.war.logs');
    Route::post('/admin/kaje/war/poll', [\App\Http\Controllers\AdminKajeWarController::class, 'pollStatus'])->name('admin.kaje.war.poll');
    Route::post('/admin/kaje/war/update', [\App\Http\Controllers\AdminKajeWarController::class, 'updateStatus'])->name('admin.kaje.war.update');
});

// 🛡️ JALUR VIP MASA AKTIF
Route::post('/api/order/masa-aktif/proses', [\App\Http\Controllers\OrderMasaAktifController::class, 'store'])->middleware(['auth', 'verified']);
Route::get('/order/xda/check-stock', [\App\Http\Controllers\AkrabOrderController::class, 'checkStockXda'])->name('order.xda.check-stock');
Route::get('/areaxl', [\App\Http\Controllers\PublicToolsController::class, 'index'])->name('public.areaxl');
Route::post('/api/webhook/android', [\App\Http\Controllers\AndroidWebhookController::class, 'handle']);
Route::put('/profile/pin', [\App\Http\Controllers\SecurityController::class, 'updatePin'])->name('profile.pin.update')->middleware('auth');
Route::post('/verify-pin', [\App\Http\Controllers\SecurityController::class, 'verifyPin'])->middleware(['auth', 'throttle:5,5']);

// --- PRESTIGE v7.5 & SECURE SYNC ---
Route::middleware(['web', 'auth', 'verified', \App\Http\Middleware\AntiMalingSession::class])->group(function () {
    Route::get("/order/vpn", [\App\Http\Controllers\OrderVpnController::class, "index"])->name("order.vpn");
    Route::post("/order/vpn/proses", [\App\Http\Controllers\OrderVpnController::class, "store"])->name("order.vpn.store");
    Route::middleware([\App\Http\Middleware\IsAdmin::class])->prefix('admin/adammedia')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdammediaController::class, 'index'])->name('admin.adammedia.index');
        Route::post('/sync', [\App\Http\Controllers\Admin\AdammediaController::class, 'sync'])->name('admin.adammedia.sync');
        Route::post('/auto-price', [\App\Http\Controllers\Admin\AdammediaController::class, 'autoPriceUpdate'])->name('admin.adammedia.auto-price');
        Route::post('/update/{id}', [\App\Http\Controllers\Admin\AdammediaController::class, 'update'])->name('admin.adammedia.update-product');
        Route::post('/ticket', [\App\Http\Controllers\Admin\AdammediaController::class, 'ticket'])->name('admin.adammedia.ticket');
    });
    // // DIMATIKAN KARENA BENTROK ANTI-MALING (LOGOUT BUG)
    Route::get('/akrabv8', [\App\Http\Controllers\OrderController::class, 'index'])->name('order.akrabv8.lama');
    Route::post('/akrabv8/process', [\App\Http\Controllers\OrderController::class, 'process']);
});

Route::any('api/callback/adammedia', [\App\Http\Controllers\Api\WebhookAdammediaController::class, 'handle']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/order/akrabv8', [\App\Http\Controllers\Order\AkrabV8Controller::class, 'index'])->name('order.akrabv8');
    Route::get('/order/akrabv8/live-stock', [\App\Http\Controllers\Order\AkrabV8Controller::class, 'liveStock'])->name('order.akrabv8.stock');
});

Route::post('/order/place', [\App\Http\Controllers\Order\OrderController::class, 'place'])
    ->middleware(['web', 'auth', 'verified', \App\Http\Middleware\AntiMalingSession::class, 'throttle:10,1'])
    ->name('order.place');

Route::middleware(['auth', 'verified', \App\Http\Middleware\IsAdmin::class])->prefix('admin')->group(function () {
    Route::post('/users/{id}/update-info', [\App\Http\Controllers\AdminUserController::class, 'updateInfo']);
    Route::put('admin/users/{id}', [\App\Http\Controllers\AdminUserController::class, 'updateInfo']);
    Route::post('/users/{id}/balance', [\App\Http\Controllers\AdminUserController::class, 'updateBalance']);
    Route::post('/users/{id}/password', [\App\Http\Controllers\AdminUserController::class, 'updatePassword']);
    Route::post('/users/{id}/level', [\App\Http\Controllers\AdminUserController::class, 'updateLevel']);
    Route::post('/users/{id}/suspend', [\App\Http\Controllers\AdminUserController::class, 'toggleSuspend']);
    Route::delete('/users/{id}', [\App\Http\Controllers\AdminUserController::class, 'destroy']);
});

// 🔥 JALUR VIP: KHUSUS SIMPAN PENGATURAN API H2H
Route::post('/admin/users/{id}/update-h2h', function (\Illuminate\Http\Request $request, $id) {
    $u = \App\Models\User::findOrFail($id);
    $u->api_key = $request->api_key;
    $u->ip_whitelist = $request->ip_whitelist;
    $u->webhook_url = $request->webhook_url;
    $u->save();
    return response()->json(['status' => true, 'message' => 'Data H2H Berhasil Disimpan!']);
})->middleware(['web', 'auth']);

// 🚀 MESIN TESTER WEBHOOK H2H MILASTORE
Route::post('/user/test-webhook', function (\Illuminate\Http\Request $request) {
    $user = auth()->user();
    $targetUrl = $request->input('custom_url');
    if (empty($targetUrl)) $targetUrl = $user ? $user->webhook_url : null;
    if (empty($targetUrl)) return response()->json(['success' => false, 'message' => 'Masukkan URL Webhook terlebih dahulu!']);
    $statusReq = $request->input('status', 'Sukses');
    $ref_id = 'TEST-WEBHOOK-' . time();
    $message = 'Transaksi ' . $statusReq;
    if ($statusReq === 'Sukses') $sn = 'SN-TEST-' . rand(10000, 99999);
    elseif ($statusReq === 'Pending') $sn = '';
    else $sn = 'Gagal / Ditolak Provider';
    $dummyPayload = [
        'status' => $statusReq,
        'trx_id' => $ref_id,
        'ref_id' => $ref_id,
        'kode_produk' => 'TEST_PRODUK',
        'tujuan' => '081234567890',
        'sn' => $sn,
        'message' => $message,
        'signature' => md5(($user ? $user->api_key : 'APIKEY_TEST') . $ref_id)
    ];
    try {
        $response = \Illuminate\Support\Facades\Http::timeout(10)->withoutVerifying()->post($targetUrl, $dummyPayload);
        return response()->json([
            'success' => true,
            'message' => 'Webhook berhasil dikirim!',
            'http_code' => $response->status(),
            'response_body' => substr($response->body(), 0, 200)
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Gagal terhubung ke server target: ' . $e->getMessage()]);
    }
})->middleware(['web', 'auth']);

// 🚀 JALUR H2H MEMBER SULTAN
Route::post('/profile/update-h2h', function (\Illuminate\Http\Request $request) {
    $user = auth()->user();
    if ($request->action == 'generate') {
        $user->api_key = 'MS-' . strtoupper(\Illuminate\Support\Str::random(30));
    } elseif ($request->action == 'generate_secret') {
        $user->payment_secret = 'SK-' . strtoupper(\Illuminate\Support\Str::random(32));
    } else {
        $request->validate([
            'webhook_url'  => 'nullable|url|max:255',
            'payment_webhook' => 'nullable|url|max:255',
            'ip_whitelist' => 'nullable|string|max:255',
        ]);
        $ip_clean = $request->ip_whitelist ? preg_replace('/\s+/', '', $request->ip_whitelist) : null;
        $user->webhook_url = $request->webhook_url;
        $user->payment_webhook = $request->payment_webhook;
        $user->payment_secret = $request->payment_secret;
        $user->ip_whitelist = $ip_clean;
    }
    $user->save();
    return response()->json(['status' => true, 'message' => 'Konfigurasi MilaPay V12 Berhasil Disinkronkan!']);
})->middleware(['web', 'auth']);

// 🚀 RUTE MAINTENANCE SULTAN
Route::get('/maintenance', [\App\Http\Controllers\MaintenanceController::class, 'index'])->name('maintenance.index');
Route::middleware(['auth'])->group(function () {
    Route::get('/admin/maintenance-settings', [\App\Http\Controllers\MaintenanceController::class, 'adminPage'])->name('admin.maintenance.index');
    Route::post('/admin/maintenance-settings', [\App\Http\Controllers\MaintenanceController::class, 'save'])->name('admin.maintenance.save');
});

Route::get('/test-harga', function () {
    $potongan = ['khfy' => 1000, 'adam' => 500, 'kaje' => 2000, 'digiflazz' => 0];
    $produkKhfy = \Illuminate\Support\Facades\DB::table('layanan_khfy')->where('status', 'active')->first();
    $produkAdam = \Illuminate\Support\Facades\DB::table('ppob_products')->where('is_active', 1)->first();
    $produkKaje = \Illuminate\Support\Facades\DB::table('layanan_kaje')->where('status', 'active')->first();
    $hitungHarga = function ($hargaAsli, $provider, $level) use ($potongan) {
        if ($level === 'reseller') {
            $diskon = $potongan[$provider] ?? 0;
            return max($hargaAsli - $diskon, 0);
        }
        return $hargaAsli;
    };
    return response()->json([
        'PESAN_SULTAN' => 'Ini simulasi aman.',
        'SIMULASI_USER_BIASA' => [
            'khfy_tampil' => $hitungHarga($produkKhfy->harga_jual ?? 0, 'khfy', 'user'),
            'adam_tampil' => $hitungHarga($produkAdam->price_sell ?? 0, 'adam', 'user'),
            'kaje_tampil' => $hitungHarga($produkKaje->harga_jual ?? 0, 'kaje', 'user'),
        ],
        'SIMULASI_RESELLER' => [
            'khfy_tampil' => $hitungHarga($produkKhfy->harga_jual ?? 0, 'khfy', 'reseller'),
            'adam_tampil' => $hitungHarga($produkAdam->price_sell ?? 0, 'adam', 'reseller'),
            'kaje_tampil' => $hitungHarga($produkKaje->harga_jual ?? 0, 'kaje', 'reseller'),
        ],
    ]);
});

Route::middleware(['auth'])->prefix('admin')->group(function () {
    Route::get('/reseller-discounts', [\App\Http\Controllers\Admin\ResellerDiscountController::class, 'index'])->name('admin.reseller.discounts');
    Route::post('/reseller-discounts', [\App\Http\Controllers\Admin\ResellerDiscountController::class, 'update'])->name('admin.reseller.discounts.update');
});

Route::get('/developer/payment-gateway-docs', function () { return \inertia('Developer/PaymentDocs'); })->name('payment.gateway.doc');
Route::get('/checkout/v1/{id}', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'renderInvoice']);
Route::get('/admin/payment-settings', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'index']);
Route::post('/admin/payment-settings', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'store']);
Route::post('/api/gateway/cancel/{id}', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'cancelTransaction']);

// 🌐 JALUR BYPASS CEK KUOTA V12 - AKSES PUBLIK (DENGAN PROTEKSI SPAM - 5 REQUEST / 4 MENIT)
Route::post('/proxy/cek-kuota', function (\Illuminate\Http\Request $request) {
    $timestamp = round(microtime(true) * 1000);
    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'Authorization' => 'Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw',
        'X-API-Key' => '60ef29aa-a648-4668-90ae-20951ef90c55',
        'X-App-Version' => '4.0.0',
        'Accept' => 'application/json, text/javascript, */*; q=0.01',
        'Content-Type' => 'application/x-www-form-urlencoded',
        'Origin' => 'https://sidompul.kmsp-store.com',
        'Referer' => 'https://sidompul.kmsp-store.com/',
        'User-Agent' => 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
    ])->get("https://apigw.kmsp-store.com/sidompul/v4/cek_kuota", [
        'msisdn' => $request->input('msisdn'),
        'isJSON' => 'true',
        '_' => $timestamp
    ]);
    return response()->json($response->json());
})->middleware('throttle:5,4');

Route::middleware(['auth', 'verified'])->group(function () {
});

// 🚀 ROUTE ADMIN COMMAND CENTER PO V8
Route::middleware(['auth'])->group(function () {
    Route::get('/admin/po-v8', [\App\Http\Controllers\Admin\AdminPOController::class, 'index'])->name('admin.po_v8');
    Route::post('/admin/po-v8/toggle', [\App\Http\Controllers\Admin\AdminPOController::class, 'toggleMode']);
    Route::post('/admin/po-v8/retry/{id}', [\App\Http\Controllers\Admin\AdminPOController::class, 'retry']);
    Route::post('/admin/po-v8/cancel/{id}', [\App\Http\Controllers\Admin\AdminPOController::class, 'cancel']);
});

// 🚀 ROUTE API LIVE STOK V8
Route::get('/api/v8/live-stock', function() { return response()->json(\Illuminate\Support\Facades\DB::table('ppob_products')->where('product_code', 'LIKE', '%XDA%' )->orWhere('product_code', 'LIKE', '%XCLP%' )->get()); });

// ==========================================
// 👑 MENU BARU: AKRAB COMMAND CENTER V14.3
// ==========================================
Route::middleware(['auth', 'verified', \App\Http\Middleware\IsAdmin::class])->prefix('admin')->name('admin.akrab.')->group(function () {
    Route::get('/akrab', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'index'])->name('index');
    Route::post('/akrab/req-otp', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'reqOtp'])->name('req_otp');
    Route::post('/akrab/submit-otp', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'submitOtp'])->name('submit_otp');
    Route::get('/akrab/sessions', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'listSessions'])->name('sessions');
    Route::get('/akrab/member-info', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'memberInfo'])->name('member_info');
    Route::post('/akrab/action', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'handleAction'])->name('action');
    Route::post('/akrab/ajax-sync-slot', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'ajaxSyncSlot'])->name('ajax_sync');
    Route::post('/akrab/products', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'storeProduct'])->name('store_product');
    Route::post('/akrab/products/delete', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'deleteProduct'])->name('delete_product');
    Route::post('/akrab/pengelola/update', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'updatePengelola'])->name('update_pengelola');
    Route::post('/akrab/slots/map', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'mapSlot'])->name('map_slot');
});

// Route Otomatis Terintegrasi - Akrab Enterprise v4.7
Route::post('akrab/bulk-sync', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'ajaxBulkSyncByDate'])->name('admin.akrab.bulk-sync');
Route::post('akrab/close-all-slots', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'ajaxCloseEmptySlots'])->name('admin.akrab.close-all');
Route::post('akrab/open-all-slots', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'ajaxOpenEmptySlots'])->name('admin.akrab.open-all');
Route::post('akrab/force-release-slot', [\App\Http\Controllers\Admin\AkrabManagerController::class, 'ajaxForceReleaseSlot'])->name('admin.akrab.force-release');

// Akrab Manager Routes Fix
Route::middleware(["auth", "verified"])->group(function () {
    Route::post("/admin/akrab/store-product", [App\Http\Controllers\Admin\AkrabManagerController::class, "storeProduct"])->name("admin.akrab.store_product");
    Route::post("/admin/akrab/delete-product", [App\Http\Controllers\Admin\AkrabManagerController::class, "deleteProduct"])->name("admin.akrab.delete_product");
    Route::get("/admin/akrab/member-info", [App\Http\Controllers\Admin\AkrabManagerController::class, "memberInfo"])->name("admin.akrab.member_info");
    Route::post("/admin/akrab/action", [App\Http\Controllers\Admin\AkrabManagerController::class, "handleAction"])->name("admin.akrab.action");
    Route::post("/admin/akrab/map-slot", [App\Http\Controllers\Admin\AkrabManagerController::class, "mapSlot"])->name("admin.akrab.map_slot");
});

// RUTINITAS MENU ORDER MILASTORE
Route::middleware(['web', 'auth', 'verified'])->group(function () {
    Route::get('/admin/akrab/order', [\App\Http\Controllers\Admin\AkrabOrderController::class, 'index'])->name('admin.akrab.order');
    Route::post('/admin/akrab/order/submit', [\App\Http\Controllers\Admin\AkrabOrderController::class, 'submitOrder']);
    Route::get('/admin/akrab/order/queues', [\App\Http\Controllers\Admin\AkrabOrderController::class, 'getQueues']);
});

// CRON JOB WORKER (Bisa dipanggil via Cron/Panel Server tanpa Login)
Route::get('/cron/akrab/process-kuber', [\App\Http\Controllers\Admin\AkrabOrderController::class, 'processQueue']);

// RUTE FORM ORDER USER INTERAKTIF MILASTORE
Route::middleware(['web', 'auth', 'verified'])->group(function () {
    Route::post('/order/akrab/submit', [\App\Http\Controllers\Order\AkrabOrderController::class, 'submitOrder']);
});

// RUTE FORM ORDER USER INTERAKTIF (VERSI BARU)
Route::middleware(['web', 'auth', 'verified'])->group(function () {
    Route::get('/order/akrabnew', [\App\Http\Controllers\Order\AkrabOrderController::class, 'index'])->name('order.akrabnew');
    Route::post('/order/akrabnew/submit', [\App\Http\Controllers\Order\AkrabOrderController::class, 'submitOrder']);
});

// ==========================================
// 🚀 RUTE CMS MANAJEMEN MENU (CLEAN VERSION)
// ==========================================
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/api/menus/list', [\App\Http\Controllers\Admin\MenuController::class, 'apiList']);
    Route::get('/admin/menus', [\App\Http\Controllers\Admin\MenuController::class, 'index'])->name('admin.menus');
    Route::post('/admin/menus/store', [\App\Http\Controllers\Admin\MenuController::class, 'store']);
    Route::post('/admin/menus/reorder', [\App\Http\Controllers\Admin\MenuController::class, 'updateOrder']);
    Route::post('/admin/menus/delete', [\App\Http\Controllers\Admin\MenuController::class, 'destroy']);
});

// ==========================================
// 🚀 MILASTORE - XLKU ENGINE BRIDGE
// ==========================================
Route::middleware(['auth', 'verified', \App\Http\Middleware\IsAdmin::class])->prefix('admin/xlku')->name('admin.xlku.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'index'])->name('index');
    Route::post('/req-otp', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'requestOtp'])->name('req_otp');
    Route::post('/submit-otp', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'submitOtp'])->name('submit_otp');
    Route::post('/delete-session', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'deleteSession'])->name('delete_session');
    Route::post('/sync-session', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'syncSession'])->name('sync_session');
    Route::post('/invite', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'inviteMember'])->name('invite');
    Route::post('/remove', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'removeMember'])->name('remove');
    Route::post('/set-quota', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'setQuota'])->name('set_quota');
    Route::post('/save-api', [App\Http\Controllers\Admin\AkrabEngineController::class, 'saveApiConfig'])->name('save_api');
    Route::post('/assign-owner', [App\Http\Controllers\Admin\AkrabEngineController::class, 'assignOwner'])->name('assign_owner');
});

// ROUTE DOKUMENTASI RESELLER H2H
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/docakrabmanagement', function () {
        return inertia('Admin/DocAkrab');
    })->name('docakrabmanagement');
});

// Route Tambahan untuk Halaman XLKU
Route::middleware(['auth', 'admin'])->group(function () {
    
    
});

// SYSTEM MANAGEMENT WAR ENGINE & TENANT H2H SYNC v2.5
Route::middleware(['auth'])->prefix('admin/xlku')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'index'])->name('admin.xlku.index');
    Route::post('/reseller', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'storeReseller'])->name('admin.xlku.reseller.store');
    Route::delete('/reseller/{id}', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'destroyReseller'])->name('admin.xlku.reseller.destroy');
    Route::post('/assign-owner', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'assignOwner'])->name('admin.xlku.assign_owner');
    Route::post('/save-api', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'saveApiConfig'])->name('admin.xlku.save_api');
    Route::post('/req-otp', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'requestOtp'])->name('admin.xlku.req_otp');
    Route::post('/submit-otp', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'submitOtp'])->name('admin.xlku.submit_otp');
    Route::post('/delete-session', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'deleteSession'])->name('admin.xlku.delete_session');
    Route::post('/sync-session', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'syncSession'])->name('admin.xlku.sync_session');
    Route::post('/invite', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'inviteMember'])->name('admin.xlku.invite');
    Route::post('/remove', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'removeMember'])->name('admin.xlku.remove');
    Route::post('/set-quota', [\App\Http\Controllers\Admin\AkrabEngineController::class, 'setQuota'])->name('admin.xlku.set_quota');
});

// SYSTEM MANAGEMENT WAR ENGINE & TENANT H2H SYNC v2.6
Route::middleware(["auth"])->prefix("admin/xlku")->group(function () {
    Route::get("/", [\App\Http\Controllers\Admin\AkrabEngineController::class, "index"])->name("admin.xlku.index");
    Route::post("/reseller", [\App\Http\Controllers\Admin\AkrabEngineController::class, "storeReseller"])->name("admin.xlku.reseller.store");
    Route::post("/save-api", [\App\Http\Controllers\Admin\AkrabEngineController::class, "saveApiConfig"])->name("admin.xlku.save_api");
    Route::delete("/reseller/{id}", [\App\Http\Controllers\Admin\AkrabEngineController::class, "destroyReseller"])->name("admin.xlku.reseller.destroy");
    Route::post("/assign-owner", [\App\Http\Controllers\Admin\AkrabEngineController::class, "assignOwner"])->name("admin.xlku.assign_owner");
    
    // API PYTHON BRIDGES
    Route::post("/req-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "requestOtp"])->name("admin.xlku.req_otp");
    Route::post("/submit-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "submitOtp"])->name("admin.xlku.submit_otp");
    Route::post("/delete-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "deleteSession"])->name("admin.xlku.delete_session");
    Route::post("/sync-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "syncSession"])->name("admin.xlku.sync_session");
    Route::post("/invite", [\App\Http\Controllers\Admin\AkrabEngineController::class, "inviteMember"])->name("admin.xlku.invite");
    Route::post("/remove", [\App\Http\Controllers\Admin\AkrabEngineController::class, "removeMember"])->name("admin.xlku.remove");
    Route::post("/set-quota", [\App\Http\Controllers\Admin\AkrabEngineController::class, "setQuota"])->name("admin.xlku.set_quota");
});

// ROUTES FIX FULL VERSION WAR ENGINE
Route::middleware(["auth"])->prefix("admin/xlku")->group(function () {
    Route::get("/", [\App\Http\Controllers\Admin\AkrabEngineController::class, "index"])->name("admin.xlku.index");
    Route::post("/reseller", [\App\Http\Controllers\Admin\AkrabEngineController::class, "storeReseller"])->name("admin.xlku.reseller.store");
    Route::post("/save-api", [\App\Http\Controllers\Admin\AkrabEngineController::class, "saveApiConfig"])->name("admin.xlku.save_api");
    Route::delete("/reseller/{id}", [\App\Http\Controllers\Admin\AkrabEngineController::class, "destroyReseller"])->name("admin.xlku.reseller.destroy");
    Route::post("/assign-owner", [\App\Http\Controllers\Admin\AkrabEngineController::class, "assignOwner"])->name("admin.xlku.assign_owner");
    
    Route::post("/req-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "requestOtp"])->name("admin.xlku.req_otp");
    Route::post("/submit-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "submitOtp"])->name("admin.xlku.submit_otp");
    Route::post("/delete-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "deleteSession"])->name("admin.xlku.delete_session");
    Route::post("/sync-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "syncSession"])->name("admin.xlku.sync_session");
    Route::post("/invite", [\App\Http\Controllers\Admin\AkrabEngineController::class, "inviteMember"])->name("admin.xlku.invite");
    Route::post("/remove", [\App\Http\Controllers\Admin\AkrabEngineController::class, "removeMember"])->name("admin.xlku.remove");
    Route::post("/set-quota", [\App\Http\Controllers\Admin\AkrabEngineController::class, "setQuota"])->name("admin.xlku.set_quota");
});

// ROUTES FIX FULL VERSION DENGAN FITUR SEARCH USER
Route::middleware(["auth"])->prefix("admin/xlku")->group(function () {
    Route::get("/", [\App\Http\Controllers\Admin\AkrabEngineController::class, "index"])->name("admin.xlku.index");
    
    // Fitur Search & Promote User (Pengganti Buat Akun Baru)
    Route::get("/search-users", [\App\Http\Controllers\Admin\AkrabEngineController::class, "searchUsers"])->name("admin.xlku.search_users");
    Route::post("/promote-user", [\App\Http\Controllers\Admin\AkrabEngineController::class, "promoteUser"])->name("admin.xlku.promote_user");
    
    Route::post("/save-api", [\App\Http\Controllers\Admin\AkrabEngineController::class, "saveApiConfig"])->name("admin.xlku.save_api");
    Route::delete("/reseller/{id}", [\App\Http\Controllers\Admin\AkrabEngineController::class, "revokeReseller"])->name("admin.xlku.reseller.destroy");
    Route::post("/assign-owner", [\App\Http\Controllers\Admin\AkrabEngineController::class, "assignOwner"])->name("admin.xlku.assign_owner");
    
    Route::post("/req-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "requestOtp"])->name("admin.xlku.req_otp");
    Route::post("/submit-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "submitOtp"])->name("admin.xlku.submit_otp");
    Route::post("/delete-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "deleteSession"])->name("admin.xlku.delete_session");
    Route::post("/sync-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "syncSession"])->name("admin.xlku.sync_session");
    Route::post("/invite", [\App\Http\Controllers\Admin\AkrabEngineController::class, "inviteMember"])->name("admin.xlku.invite");
    Route::post("/remove", [\App\Http\Controllers\Admin\AkrabEngineController::class, "removeMember"])->name("admin.xlku.remove");
    Route::post("/set-quota", [\App\Http\Controllers\Admin\AkrabEngineController::class, "setQuota"])->name("admin.xlku.set_quota");
});

Route::middleware(["auth"])->prefix("admin/xlku")->group(function () {
    Route::get("/", [\App\Http\Controllers\Admin\AkrabEngineController::class, "index"])->name("admin.xlku.index");
    Route::get("/search-users", [\App\Http\Controllers\Admin\AkrabEngineController::class, "searchUsers"])->name("admin.xlku.search_users");
    Route::post("/promote-user", [\App\Http\Controllers\Admin\AkrabEngineController::class, "promoteUser"])->name("admin.xlku.promote_user");
    Route::post("/save-api", [\App\Http\Controllers\Admin\AkrabEngineController::class, "saveApiConfig"])->name("admin.xlku.save_api");
    Route::delete("/reseller/{id}", [\App\Http\Controllers\Admin\AkrabEngineController::class, "revokeReseller"])->name("admin.xlku.reseller.destroy");
    Route::post("/assign-owner", [\App\Http\Controllers\Admin\AkrabEngineController::class, "assignOwner"])->name("admin.xlku.assign_owner");
    
    Route::post("/req-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "requestOtp"])->name("admin.xlku.req_otp");
    Route::post("/submit-otp", [\App\Http\Controllers\Admin\AkrabEngineController::class, "submitOtp"])->name("admin.xlku.submit_otp");
    Route::post("/delete-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "deleteSession"])->name("admin.xlku.delete_session");
    Route::post("/sync-session", [\App\Http\Controllers\Admin\AkrabEngineController::class, "syncSession"])->name("admin.xlku.sync_session");
    Route::post("/invite", [\App\Http\Controllers\Admin\AkrabEngineController::class, "inviteMember"])->name("admin.xlku.invite");
    Route::post("/remove", [\App\Http\Controllers\Admin\AkrabEngineController::class, "removeMember"])->name("admin.xlku.remove");
    Route::post("/set-quota", [\App\Http\Controllers\Admin\AkrabEngineController::class, "setQuota"])->name("admin.xlku.set_quota");
});

Route::get('/download-vault/{token}', function ($token) {
    // Tarik dan HAPUS INSTAN token dari memori agar tidak bisa dipakai 2x
    $filePath = \Illuminate\Support\Facades\Cache::pull('vault_' . $token);
    
    if (!$filePath || !file_exists($filePath)) {
        return abort(404, '🔥 LINK SUDAH HANGUS ATAU KEDALUWARSA! Link ini hanya berlaku untuk 1x klik.');
    }
    
    // Kirim file ke browser, dan HAPUS FISIK FILE setelah selesai didownload
    return response()->download($filePath)->deleteFileAfterSend(true);
});

Route::post('/admin/khfy/update-single', [\App\Http\Controllers\AdminKhfyController::class, 'updateSingle'])->name('admin.khfy.update_single')->middleware(['web', 'auth']);




// Endpoint POST (Transaksi) kita lindungi dengan Throttle (Max 15 hit / 1 menit) mencegah spam / brute-force saldo!
Route::middleware(['web', 'auth', 'verified', \App\Http\Middleware\AntiMalingSession::class, 'throttle:15,1'])->group(function () {
    Route::post('/order/pulsa/store', [\App\Http\Controllers\OrderPulsaController::class, 'store'])->name('order.pulsa.store');
    Route::post('/order/data/store', [\App\Http\Controllers\OrderDataController::class, 'store'])->name('order.data.store');
});

// === INJEKSI RUTE MILASTORE V12 (PULSA & DATA) ===
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/order/pulsa', [\App\Http\Controllers\OrderPulsaController::class, 'index'])->name('order.pulsa');
    Route::post('/order/pulsa/store', [\App\Http\Controllers\OrderPulsaController::class, 'store'])->name('order.pulsa.store');

    Route::get('/order/data', [\App\Http\Controllers\OrderDataController::class, 'index'])->name('order.data');
    Route::post('/order/data/store', [\App\Http\Controllers\OrderDataController::class, 'store'])->name('order.data.store');
});

// 🛡️ JALUR RIWAYAT AMAN (Fix Bug Tendangan Login)
// 🐛 JALUR DEBUG RIWAYAT BEBAS HAMBATAN
Route::get('/riwayat', [\App\Http\Controllers\RiwayatController::class, 'index'])->name('riwayat');

// 🔄 RADAR POLLING PASCABAYAR
Route::post('/order/pascabayar/poll', [\App\Http\Controllers\PascabayarController::class, 'poll'])->name('order.pascabayar.poll')->middleware(['web', 'auth']);

// 🚀 MENU VOUCHER
Route::get('/order/voucher', [\App\Http\Controllers\OrderVoucherController::class, 'index'])->name('order.voucher')->middleware(['web', 'auth']);
Route::post('/order/voucher', [\App\Http\Controllers\OrderVoucherController::class, 'store'])->middleware(['web', 'auth']);

// 🚀 MENU MASA AKTIF
Route::get('/order/masa-aktif', [\App\Http\Controllers\OrderMasaAktifController::class, 'index'])->name('order.masa-aktif')->middleware(['web', 'auth']);
Route::post('/order/masa-aktif', [\App\Http\Controllers\OrderMasaAktifController::class, 'store'])->middleware(['web', 'auth']);

// 👑 ADMIN KONTROL: OKECONNECT MANAGER (SYNCED WITH CONTROLLER)
Route::middleware(['auth', 'verified', \App\Http\Middleware\IsAdmin::class])->prefix('admin')->group(function () {
    Route::get('/okeconnect', [\App\Http\Controllers\AdminOkeconnectController::class, 'index'])->name('admin.okeconnect.index');
    Route::post('/okeconnect/sync', [\App\Http\Controllers\AdminOkeconnectController::class, 'sync'])->name('admin.okeconnect.sync');
    Route::post('/okeconnect/markup', [\App\Http\Controllers\AdminOkeconnectController::class, 'bulkMarkup'])->name('admin.okeconnect.markup');
    Route::post('/okeconnect/toggle/{id}', [\App\Http\Controllers\AdminOkeconnectController::class, 'toggleStatus'])->name('admin.okeconnect.toggle');
    Route::delete('/okeconnect/destroy/{id}', [\App\Http\Controllers\AdminOkeconnectController::class, 'destroy'])->name('admin.okeconnect.destroy');
});

// 🛡️ MENU PUBLIC CEK STOK (Aman dari Hacker - Max 60 request/menit)
Route::get('/cek-stok', [\App\Http\Controllers\PublicStokController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('public.stok');

// 🛠️ API TOOLS PUSAT AKRAB V8
Route::middleware(['auth'])->group(function () {
    Route::post('/api/v8/check-promo', [\App\Http\Controllers\Order\AkrabV8Controller::class, 'checkPromo']);
    Route::post('/api/v8/check-transaction', [\App\Http\Controllers\Order\AkrabV8Controller::class, 'checkTransaction']);
});

// 🛡️ JALUR VVIP CYBER SECURITY CY STORE
Route::middleware(['auth'])->prefix('admin/cyber-security')->group(function () {
    Route::get('/', [\App\Http\Controllers\CyberSecurityController::class, 'index'])->name('admin.cyber.index');
    Route::post('/unblock-ip', [\App\Http\Controllers\CyberSecurityController::class, 'unblockIp'])->name('admin.cyber.unblock');
    Route::post('/clear-logs', [\App\Http\Controllers\CyberSecurityController::class, 'clearLogs'])->name('admin.cyber.clear-logs');
    Route::post('/scan-malware', [\App\Http\Controllers\CyberSecurityController::class, 'scanMalware'])->name('admin.cyber.scan-malware');
    Route::post('/delete-malware', [\App\Http\Controllers\CyberSecurityController::class, 'deleteMalware'])->name('admin.cyber.delete-malware');
    Route::post('/osint-lookup', [\App\Http\Controllers\CyberSecurityController::class, 'osintLookup'])->name('admin.cyber.osint');
});

// --- JALUR WEBHOOK KHFY YANG BENAR ---
Route::any('api/webhook/khfy', [\App\Http\Controllers\WebhookKhfyController::class, 'handle']);

// --- ROUTE ADMIN WHATSAPP SESSION & BOT ---
Route::middleware(['auth', 'verified', \App\Http\Middleware\IsAdmin::class])->prefix('admin/whatsapp')->name('admin.whatsapp.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\WhatsAppSessionController::class, 'index'])->name('index');
    Route::get('/status', [\App\Http\Controllers\Admin\WhatsAppSessionController::class, 'getStatus'])->name('status');
    Route::get('/logs', [\App\Http\Controllers\Admin\WhatsAppSessionController::class, 'getLogs'])->name('logs');
    Route::post('/pairing', [\App\Http\Controllers\Admin\WhatsAppSessionController::class, 'requestPairing'])->name('pairing');
    Route::post('/send-test', [\App\Http\Controllers\Admin\WhatsAppSessionController::class, 'sendTestMessage'])->name('send_test');
    Route::post('/logout', [\App\Http\Controllers\Admin\WhatsAppSessionController::class, 'logout'])->name('logout');
});

// 🚀 WEBHOOK KAJE & OKCONNECT SULTAN
Route::any('/api/webhook/kaje', [\App\Http\Controllers\WebhookKajeController::class, 'handle']);
Route::any('/api/callback/okconnect', [\App\Http\Controllers\OkeCallbackController::class, 'handle']);

// 📱 TELEGRAM MINI APP MANAGEMENT
Route::prefix('telegram/management')->group(function () {
    Route::get('/', [\App\Http\Controllers\TelegramManagementController::class, 'index'])->name('telegram.management.index');
    Route::get('/data', [\App\Http\Controllers\TelegramManagementController::class, 'getDashboardData'])->name('telegram.management.data');
    Route::post('/scan', [\App\Http\Controllers\TelegramManagementController::class, 'runScan'])->name('telegram.management.scan');
    Route::post('/unblock', [\App\Http\Controllers\TelegramManagementController::class, 'unblockIp'])->name('telegram.management.unblock');
    Route::post('/clear-cache', [\App\Http\Controllers\TelegramManagementController::class, 'clearCache'])->name('telegram.management.clear_cache');
    Route::post('/osint', [\App\Http\Controllers\TelegramManagementController::class, 'osintLookup'])->name('telegram.management.osint');
});

// 🚀 WEBHOOK OKE CONNECT (FIX TYPO & DUAL ALIAS)
Route::any('/api/callback/okeconnect', [\App\Http\Controllers\OkeCallbackController::class, 'handle']);
Route::any('/api/callback/okconnect', [\App\Http\Controllers\OkeCallbackController::class, 'handle']);
Route::any('/callback/okeconnect', [\App\Http\Controllers\OkeCallbackController::class, 'handle']);

// 📢 RUTE UPDATE PROMO MULTIPART
Route::match(['put', 'post'], '/admin/promo/{id}', [\App\Http\Controllers\PromoController::class, 'update'])->middleware(['auth']);

// 📢 RUTE MANAJEMEN PROMO (FIX UPLOAD & DELETE)
Route::middleware(['auth'])->group(function () {
    Route::post('/admin/promo/update/{id}', [\App\Http\Controllers\PromoController::class, 'update']);
    Route::delete('/admin/promo/{id}', [\App\Http\Controllers\PromoController::class, 'destroy']);
});

// 🚀 FIX RUTE PROMO (ANTI ERROR 405 & GAMBAR BLANK)
Route::post('/admin/promo/update/{id}', [\App\Http\Controllers\PromoController::class, 'update'])->middleware(['auth']);
Route::post('/admin/promo/delete/{id}', [\App\Http\Controllers\PromoController::class, 'destroy'])->middleware(['auth']);
Route::get('/api/active-promos', [\App\Http\Controllers\PromoController::class, 'apiActive']);
