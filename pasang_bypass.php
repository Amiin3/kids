<?php
$file = 'app/Http/Middleware/CheckMaintenanceMode.php';

if(file_exists($file)){
    $code = file_get_contents($file);
    
    // Ini kode sisipan kita (Aman dengan Try-Catch agar mustahil Error 500)
    $bypass = <<<PHP

        // 👑 JALUR VIP SULTAN & AKSES LOGIN
        try {
            // 1. Jika sudah login sebagai Admin, berikan karpet merah!
            if (auth()->check()) {
                \$level = strtolower(auth()->user()->level ?? '');
                if (in_array(\$level, ['admin', 'superadmin', 'owner'])) {
                    return \$next(\$request);
                }
            }
            
            // 2. Buka gembok halaman login agar Sultan tetep bisa login meski Maintenance aktif
            if (\$request->is('login') || \$request->is('logout') || \$request->is('auth/*')) {
                return \$next(\$request);
            }
        } catch (\Exception \$e) {}
PHP;
    
    // Cek apakah bypass sudah pernah dipasang biar nggak dobel
    if (!str_contains($code, 'JALUR VIP SULTAN')) {
        // Suntikkan tepat di bawah tulisan public function handle
        $code = preg_replace('/public function handle\([^)]+\)\s*\{/i', "$0" . $bypass, $code, 1);
        file_put_contents($file, $code);
        echo "✅ KARPET MERAH VIP SULTAN BERHASIL DIGELAR!\n";
    } else {
        echo "✅ JALUR VIP SUDAH TERPASANG SEBELUMNYA!\n";
    }
} else {
    echo "❌ File Middleware tidak ditemukan.\n";
}
