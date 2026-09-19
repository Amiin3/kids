<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Services\KajeService;
use App\Services\DigiflazzService;
use App\Services\AdammediaService;
use App\Helpers\WhatsappHelper;
use App\Helpers\FcmHelper;

class BotWaController extends Controller
{
    private function normalizePhone($phone)
    {
        $clean = preg_replace('/[^0-9]/', '', (string)$phone);
        if (empty($clean)) return '';
        if (substr($clean, 0, 2) === '62') return '0' . substr($clean, 2);
        return $clean;
    }

    private function getDesc($p)
    {
        if (!empty($p->deskripsi) && $p->deskripsi !== '-' && $p->deskripsi !== ' ') {
            $descText = str_replace([' | ', '|'], "\n", (string)$p->deskripsi);
            $descText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '\n', '\\n'], "\n", $descText));
            $descText = preg_replace("/[\r\n]+/", "\n", $descText);

            $lines = explode("\n", trim($descText));
            $formatted = "";
            foreach ($lines as $index => $line) {
                $cleanLine = trim($line);
                if (!empty($cleanLine)) {
                    $formatted .= ($index === 0) ? "\n    └ 📝 " . $cleanLine : "\n        ▪ " . $cleanLine;
                }
            }
            return $formatted;
        }
        return "";
    }

    private function getPrioritas($kode)
    {
        if (str_starts_with($kode, 'XLA')) return 1;
        if (str_starts_with($kode, 'KDA')) return 2;
        return 3;
    }

    private function generateQrisCrc($str)
    {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $crc ^= (ord($str[$i]) << 8);
            for ($j = 0; $j < 8; $j++) {
                $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) : ($crc << 1);
            }
        }
        return strtoupper(str_pad(dechex($crc &= 0xFFFF), 4, '0', STR_PAD_LEFT));
    }

    private function makeDynamicQris($staticQris, $amount)
    {
        $qris = str_replace('010211', '010212', substr($staticQris, 0, -4));
        $amtStr = (string)$amount;
        $tag54 = "54" . str_pad(strlen($amtStr), 2, '0', STR_PAD_LEFT) . $amtStr;
        $qris = (strpos($qris, '5802ID') !== false) ? str_replace('5802ID', $tag54 . '5802ID', $qris) : $qris . $tag54;
        return $qris . $this->generateQrisCrc($qris);
    }

    public function webhook(Request $request)
    {
        return $this->handle($request);
    }

    public function handle(Request $request)
    {
        try {
            date_default_timezone_set('Asia/Jakarta');

            $command = $request->input('command');

            // 0. JALUR PUSH NOTIFIKASI APLIKASI
            if ($command === 'push_notif_app') {
                $targetUid = $request->input('user_id');
                $targetU = DB::table('users')->where('id', $targetUid)->first();
                $tok = $targetU->fcm_token ?? $targetU->push_token ?? null;
                if ($tok) {
                    FcmHelper::sendNotification($tok, $request->input('title'), $request->input('body'));
                }
                return response()->json(['status' => true]);
            }

            $raw_wa  = $request->input('no_wa');
            $clean_wa = preg_replace('/[^0-9]/', '', explode('@', (string)$raw_wa)[0]);

            if (empty($clean_wa) || strlen($clean_wa) < 5) {
                return response()->json(['status' => false, 'message' => '❌ Pengenal WhatsApp tidak valid!']);
            }

            $local_wa = (substr($clean_wa, 0, 2) === '62') ? '0' . substr($clean_wa, 2) : $clean_wa;
            $intl_wa  = (substr($clean_wa, 0, 1) === '0') ? '62' . substr($clean_wa, 1) : $clean_wa;

            $pesanAsli = $request->input('pesan') ?? $request->input('message') ?? $request->input('text') ?? $request->input('msg') ?? '';
            if (is_array($pesanAsli)) $pesanAsli = $pesanAsli['text'] ?? $pesanAsli['message'] ?? '';
            if (empty(trim((string)$pesanAsli)) && !empty($command)) $pesanAsli = (string)$command;

            $pesanBersih = trim((string)$pesanAsli);
            $parts = preg_split('/\s+/', $pesanBersih);
            $cmdAi = strtolower(ltrim($parts[0] ?? '', '.'));

            // =========================================================
            // 1. SISTEM VERIFIKASI OTP & PINDAH HP (GLOBAL INTERCEPTOR)
            // =========================================================
            $isVerifCmd = in_array($cmdAi, ['verifikasi', 'verivikasi', 'verif', 'otp', 'v', 'auto_otp']);
            $isDirectOtp = (preg_match('/^\d{6}$/', $pesanBersih));

            if ($isVerifCmd || $isDirectOtp || $command === 'auto_otp') {
                $otpInput = '';
                if ($isDirectOtp) {
                    $otpInput = $pesanBersih;
                } elseif (isset($parts[1]) && preg_match('/^\d{6}$/', trim($parts[1]))) {
                    $otpInput = trim($parts[1]);
                } else {
                    $otpInput = trim($request->input('otp') ?? $parts[1] ?? '');
                }

                if (!empty($otpInput)) {
                    $matchUser = DB::table('users')->where('otp_code', $otpInput)->whereNotNull('otp_code')->first();

                    if ($matchUser) {
                        $isRealPhone = (str_starts_with($clean_wa, '08') || str_starts_with($clean_wa, '628')) && strlen($clean_wa) >= 10 && strlen($clean_wa) <= 14;

                        $updateData = [
                            'wa_lid'         => $clean_wa,
                            'otp_code'       => null,
                            'status'         => 'aktif',
                            'wa_verified_at' => now(),
                            'updated_at'     => now()
                        ];

                        if ($isRealPhone) {
                            $updateData['whatsapp'] = $local_wa;
                            $updateData['phone']    = $local_wa;
                        }

                        DB::table('users')->where('id', $matchUser->id)->update($updateData);

                        return response()->json([
                            'status'  => true,
                            'message' => "🎉 *MIGRASI AKUN BERHASIL!*\n━━━━━━━━━━━━━━━━━━━━━━\nSelamat datang kembali, *{$matchUser->name}*!\nAkun Anda kini tersambung permanen ke WhatsApp ini.\n\nKetik *menu* untuk melihat produk & mulai bertransaksi."
                        ]);
                    }

                    return response()->json([
                        'status'  => false,
                        'message' => "❌ *KODE OTP SALAH ATAU KADALUARSA!*\nPastikan 6 digit angka yang dimasukkan sesuai."
                    ]);
                }

                return response()->json([
                    'status'  => false,
                    'message' => "❌ Format salah. Ketik langsung 6 digit OTP atau gunakan:\n`.verifikasi [Kode_OTP]`\nContoh: `.verifikasi 500176`"
                ]);
            }

            // =========================================================
            // 2. SISTEM LOGIN PINDAH HP (.login)
            // =========================================================
            if ($cmdAi === 'login') {
                if (!isset($parts[1]) || empty(trim($parts[1]))) {
                    return response()->json([
                        'status'  => true,
                        'message' => "🔄 *MIGRASI / LOGIN NOMOR BARU*\n━━━━━━━━━━━━━━━━━━━━━━\nKetik:\n*.login [Nomor_WA_Lama]*\n\nContoh:\n`.login 081234567890`"
                    ]);
                }

                $targetNomor = $this->normalizePhone($parts[1]);
                $targetIntl  = (substr($targetNomor, 0, 1) === '0') ? '62' . substr($targetNomor, 1) : $targetNomor;

                $oldUser = DB::table('users')
                    ->where('whatsapp', $targetNomor)->orWhere('phone', $targetNomor)
                    ->orWhere('whatsapp', $targetIntl)->orWhere('phone', $targetIntl)
                    ->first();

                if (!$oldUser) {
                    return response()->json([
                        'status'  => false,
                        'message' => "❌ Akun dengan nomor *{$parts[1]}* tidak ditemukan di database MILA STORE."
                    ]);
                }

                $otpCode = (string)rand(100000, 999999);
                DB::table('users')->where('id', $oldUser->id)->update([
                    'otp_code'   => $otpCode,
                    'updated_at' => now()
                ]);

                $pesanOtp = "🚨 *KODE VERIFIKASI PINDAH AKUN* 🚨\n━━━━━━━━━━━━━━━━━━━━━━\nPermintaan transfer akun MILA STORE ke nomor WhatsApp baru.\n\n🔑 *KODE OTP:* *{$otpCode}*\n\n_Jangan berikan kode ini kepada orang lain._";
                WhatsappHelper::send($oldUser->whatsapp ?? $oldUser->phone, $pesanOtp);

                return response()->json([
                    'status'  => true,
                    'message' => "✅ *KODE OTP BERHASIL DIKIRIM!*\n━━━━━━━━━━━━━━━━━━━━━━\nKode 6-digit telah dikirimkan ke nomor lama Anda (*{$parts[1]}*).\n\n👉 *CARA VERIFIKASI:*\nCukup *balas dan ketik langsung 6 digit angkanya* ke chat ini.\n\nContoh:\n*123456*"
                ]);
            }

            // =========================================================
            // 3. CARI USER TERDAFTAR (CARI VIA WA_LID, WA, ATAU PHONE)
            // =========================================================
            $user = DB::table('users')
                ->where('wa_lid', $clean_wa)
                ->orWhere('whatsapp', $clean_wa)->orWhere('phone', $clean_wa)
                ->orWhere('whatsapp', $local_wa)->orWhere('phone', $local_wa)
                ->orWhere('whatsapp', $intl_wa)->orWhere('phone', $intl_wa)
                ->orWhere('whatsapp', (string)$raw_wa)->orWhere('phone', (string)$raw_wa)
                ->first();

            // =========================================================
            // 4. SISTEM REGISTRASI BARU (.daftar / .register)
            // =========================================================
            if ($cmdAi === 'daftar' || $cmdAi === 'register') {
                if ($user) {
                    return response()->json([
                        'status'  => true,
                        'message' => "Halo *{$user->name}*! Akun ini sudah terdaftar di MILA STORE.\n\nKetik *menu* untuk melihat katalog produk. 🚀"
                    ]);
                }

                if (count($parts) < 3) {
                    return response()->json([
                        'status'  => true,
                        'message' => "✨ *PENDAFTARAN MEMBER MILA STORE* ✨\n━━━━━━━━━━━━━━━━━━━━━━\nFormat pendaftaran:\n*.daftar email_anda@gmail.com Nama Toko*\n\nContoh:\n`.daftar sultan@gmail.com Sultan Cell`"
                    ]);
                }

                $emailBaru = trim($parts[1]);
                $namaToko  = trim(implode(' ', array_slice($parts, 2)));

                if (!filter_var($emailBaru, FILTER_VALIDATE_EMAIL)) {
                    return response()->json(['status' => false, 'message' => '❌ Format email tidak valid! Gunakan alamat email yang benar.']);
                }

                if (DB::table('users')->where('email', $emailBaru)->exists()) {
                    return response()->json([
                        'status'  => false,
                        'message' => "❌ Email *$emailBaru* sudah terdaftar!\nJika ingin memindahkan akun ke nomor baru ini, ketik:\n*.login [Nomor_WA_Lama]*"
                    ]);
                }

                DB::table('users')->insert([
                    'name'       => $namaToko,
                    'email'      => $emailBaru,
                    'whatsapp'   => $local_wa,
                    'phone'      => $local_wa,
                    'wa_lid'     => $clean_wa,
                    'password'   => Hash::make('123456'),
                    'saldo'      => 0,
                    'level'      => 'Member',
                    'status'     => 'aktif',
                    'api_key'    => Str::random(32),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                return response()->json([
                    'status'  => true,
                    'message' => "🎉 *PENDAFTARAN BERHASIL!*\n━━━━━━━━━━━━━━━━━━━━━━\nSelamat bergabung di *MILA STORE*, *{$namaToko}*!\n\n🌐 Web: https://milastore.cloud\n📧 Email: `{$emailBaru}`\n🔑 Password Default: `123456`\n\nKetik *menu* untuk mulai bertransaksi! 🚀"
                ]);
            }

            if (!$user) {
                return response()->json([
                    'status'  => true,
                    'message' => "✨ *SELAMAT DATANG DI MILA STORE* ✨\n━━━━━━━━━━━━━━━━━━━━━━\nNomor WhatsApp Anda belum terdaftar di sistem kami.\n\n1️⃣ *PENGGUNA BARU (DAFTAR)*\nKetik: `.daftar email_anda@gmail.com Nama Toko`\n\n2️⃣ *PENGGUNA LAMA (PINDAH HP)*\nKetik: `.login [Nomor_WA_Lama]`"
                ]);
            }

            // =========================================================
            // 5. FITUR ADMIN & OWNER MANAGEMENT
            // =========================================================
            $adminCmds = ['acc', 'tolak', 'addsaldo', 'bc', 'addbc', 'listbc', 'delbc'];
            if (in_array($cmdAi, $adminCmds)) $command = 'admin_' . $cmdAi;

            if (str_starts_with((string)$command, 'admin_') || $command === 'menu_admin' || $cmdAi === 'admin' || $cmdAi === 'panel') {
                $userLevel = isset($user->level) ? strtolower(trim((string)$user->level)) : 'member';
                $userRole  = isset($user->role) ? strtolower(trim((string)$user->role)) : 'member';
                if (!in_array($userLevel, ['admin', 'owner', 'superadmin', 'bos']) && !in_array($userRole, ['admin', 'owner', 'superadmin', 'bos'])) {
                    return response()->json(['status' => true, 'message' => "❌ *AKSES DITOLAK!*\nMaaf Bosku, menu ini khusus untuk Administrator."]);
                }

                DB::statement("CREATE TABLE IF NOT EXISTS wa_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, pesan TEXT, jadwal VARCHAR(10) NULL, tipe VARCHAR(10) DEFAULT 'instan', status VARCHAR(10) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

                if ($command === 'admin_acc') {
                    $id = $parts[1] ?? '';
                    $depo = DB::table('deposits')->where('id', $id)->where('status', 'Pending')->first();
                    if (!$depo) return response()->json(['status' => true, 'message' => "❌ Tiket Deposit #$id tidak ditemukan atau sudah diproses."]);
                    DB::table('deposits')->where('id', $id)->update(['status' => 'Sukses', 'updated_at' => now()]);
                    DB::table('users')->where('id', $depo->user_id)->increment('saldo', $depo->total_bayar);

                    $targetUser = DB::table('users')->where('id', $depo->user_id)->first();
                    if ($targetUser) {
                        WhatsappHelper::send($targetUser->whatsapp ?? $targetUser->phone, "✅ *DEPOSIT BERHASIL DI-APPROVE!*\n━━━━━━━━━━━━━━━━━━━━━━\nSaldo sebesar *Rp " . number_format($depo->total_bayar, 0, ',', '.') . "* telah ditambahkan ke akun Anda.");
                        if (!empty($targetUser->fcm_token ?? $targetUser->push_token)) {
                            FcmHelper::sendNotification($targetUser->fcm_token ?? $targetUser->push_token, "💰 Deposit Sukses!", "Saldo Rp " . number_format($depo->total_bayar, 0, ',', '.') . " berhasil masuk.", ["type" => "deposit"]);
                        }
                    }

                    return response()->json(['status' => true, 'message' => "✅ *DEPOSIT #$id BERHASIL DI-ACC!*\nSaldo telah ditambahkan Rp " . number_format($depo->total_bayar, 0, ',', '.') . "."]);
                }

                if ($command === 'admin_tolak') {
                    $id = $parts[1] ?? '';
                    $depo = DB::table('deposits')->where('id', $id)->where('status', 'Pending')->first();
                    if (!$depo) return response()->json(['status' => true, 'message' => "❌ Tiket Deposit #$id tidak ditemukan."]);
                    DB::table('deposits')->where('id', $id)->update(['status' => 'Gagal', 'updated_at' => now()]);
                    return response()->json(['status' => true, 'message' => "✅ *DEPOSIT #$id TELAH DITOLAK.*"]);
                }

                if ($command === 'admin_addsaldo') {
                    $tujuan = $parts[1] ?? '';
                    $nom = (int)preg_replace('/[^0-9]/', '', $parts[2] ?? '0');
                    $usr = DB::table('users')->where('whatsapp', 'like', "%$tujuan%")->orWhere('phone', 'like', "%$tujuan%")->first();
                    if (!$usr) return response()->json(['status' => true, 'message' => "❌ Member dengan nomor $tujuan tidak ditemukan."]);
                    DB::table('users')->where('id', $usr->id)->increment('saldo', $nom);
                    return response()->json(['status' => true, 'message' => "✅ Saldo Rp " . number_format($nom, 0, ',', '.') . " sukses ditambahkan ke *{$usr->name}*."]);
                }

                if ($command === 'admin_bc') {
                    $pesanBc = trim(substr($pesanBersih, strlen($parts[0]) + 1));
                    if (empty($pesanBc)) return response()->json(['status' => true, 'message' => "❌ Pesan BC tidak boleh kosong.\nFormat: `.bc [Pesan]`"]);
                    DB::table('wa_broadcasts')->insert(['pesan' => $pesanBc, 'tipe' => 'instan', 'status' => 'pending']);
                    return response()->json(['status' => true, 'message' => "🚀 *BROADCAST INSTAN DIANTRIKAN!*\nPesan sedang dikirimkan oleh sistem Node.js."]);
                }

                if ($command === 'admin_addbc') {
                    $jam = $parts[1] ?? '';
                    if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $jam)) return response()->json(['status' => true, 'message' => "❌ Format jam salah (HH:MM).\nContoh: `.addbc 08:30 Selamat Pagi`"]);
                    $pesanBc = trim(substr($pesanBersih, strlen($parts[0]) + strlen($jam) + 2));
                    if (empty($pesanBc)) return response()->json(['status' => true, 'message' => "❌ Pesan BC tidak boleh kosong."]);
                    DB::table('wa_broadcasts')->insert(['pesan' => $pesanBc, 'jadwal' => $jam, 'tipe' => 'harian', 'status' => 'aktif']);
                    return response()->json(['status' => true, 'message' => "⏰ *BROADCAST HARIAN TERSIMPAN!*\nPesan akan dikirim otomatis setiap jam *$jam*."]);
                }

                if ($command === 'admin_listbc') {
                    $bcs = DB::table('wa_broadcasts')->where('tipe', 'harian')->where('status', 'aktif')->get();
                    $msg = "📋 *DAFTAR BROADCAST HARIAN*\n━━━━━━━━━━━━━━━━━━━━━━\n";
                    if ($bcs->isEmpty()) $msg .= "_Belum ada jadwal broadcast._\n";
                    foreach ($bcs as $bc) { $msg .= "🔹 *ID:* {$bc->id} | ⏰ *Jam:* {$bc->jadwal}\n💬 " . substr($bc->pesan, 0, 40) . "...\n\n"; }
                    $msg .= "━━━━━━━━━━━━━━━━━━━━━━\n_Ketik `.delbc [ID]` untuk menghapus._";
                    return response()->json(['status' => true, 'message' => $msg]);
                }

                if ($command === 'admin_delbc') {
                    $id = $parts[1] ?? '';
                    $bc = DB::table('wa_broadcasts')->where('id', $id)->where('tipe', 'harian')->first();
                    if (!$bc) return response()->json(['status' => true, 'message' => "❌ Jadwal BC ID $id tidak ditemukan."]);
                    DB::table('wa_broadcasts')->where('id', $id)->delete();
                    return response()->json(['status' => true, 'message' => "🗑️ *BROADCAST DIHAPUS!*\nJadwal ID $id tidak akan dikirim lagi."]);
                }

                if ($command === 'menu_admin' || $cmdAi === 'admin' || $cmdAi === 'panel' || $cmdAi === '6') {
                    $total_member = (int) DB::table('users')->count();
                    $total_saldo  = (float) DB::table('users')->sum('saldo');
                    $trx_hari_ini = (int) DB::table('transaksi')->whereDate('tanggal', date('Y-m-d'))->count();
                    $pending_depo = DB::table('deposits')->where('status', 'Pending')->count();
                    $pending_list = DB::table('deposits')->where('status', 'Pending')->orderBy('created_at', 'asc')->limit(5)->get();

                    $teks = "👑 *PANEL MANAJEMEN ADMIN* 👑\n━━━━━━━━━━━━━━━━━━━━━━\n👥 *Member:* {$total_member} Akun\n💰 *Total Saldo:* Rp " . number_format($total_saldo, 0, ',', '.') . "\n🛒 *Trx Hari Ini:* {$trx_hari_ini} Trx\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
                    $teks .= "⏳ *DEPOSIT PENDING ({$pending_depo})*\n";
                    if ($pending_list->isEmpty()) {
                        $teks .= "_Tidak ada deposit pending._\n";
                    } else {
                        foreach($pending_list as $dp) {
                            $usrName = DB::table('users')->where('id', $dp->user_id)->value('name') ?? 'Unknown';
                            $teks .= "🔹 *ID {$dp->id}* | Rp " . number_format($dp->total_bayar, 0, ',', '.') . "\n👤 {$usrName} ({$dp->metode})\n\n";
                        }
                    }
                    $teks .= "🛠️ *MANAJEMEN KEUANGAN*\n» `.acc [ID]` ➔ Approve Deposit\n» `.tolak [ID]` ➔ Tolak Deposit\n» `.addsaldo [No_HP] [Nominal]`\n\n";
                    $teks .= "📢 *MANAJEMEN BROADCAST (BC)*\n» `.bc [Pesan]` ➔ BC Instant\n» `.addbc [Jam] [Pesan]` ➔ Buat Jadwal BC\n» `.listbc` ➔ Lihat Daftar BC\n» `.delbc [ID]` ➔ Hapus Jadwal BC\n\n↪️ _Ketik *p* untuk kembali_";
                    return response()->json(['status' => true, 'message' => (string)$teks]);
                }
            }

            // =========================================================
            // 6. ROUTING MAP KATALOG, SALAM & PINTASAN
            // =========================================================
            $routingMap = [
                '1' => 'menu_xla', '2' => 'menu_pln', '3' => 'menu_xda', '4' => 'menu_data', '5' => 'menu_aktif',
                '6' => 'menu_admin', 'admin' => 'menu_admin', 'panel' => 'menu_admin',
                'p' => 'main_menu', 'menu' => 'main_menu', 'start' => 'main_menu', 'halo' => 'main_menu', 'hai' => 'main_menu', 'hi' => 'main_menu', 'help' => 'main_menu', 'bantuan' => 'main_menu', 'tes' => 'main_menu', 'ping' => 'main_menu',
                'depo' => 'deposit_create', 'deposit' => 'deposit_create', 'batal' => 'deposit_cancel',
                'cek' => 'cek_kuota', 'cekkuota' => 'cek_kuota', 'saldo' => 'cek_saldo'
            ];

            if (array_key_exists($cmdAi, $routingMap)) {
                $command = $routingMap[$cmdAi];
            }

            // Deteksi Otomatis Format Order Langsung (Misal: X1 081916526445 atau A2 08123456789)
            if (empty($command) && preg_match('/^(X|A|V|DT|M)\d+$/i', $parts[0] ?? '') && isset($parts[1]) && strlen(preg_replace('/[^0-9]/', '', $parts[1])) >= 5) {
                $command = 'order_akrab';
            }

            if ($command === 'cek_saldo' || $cmdAi === 'saldo') {
                return response()->json([
                    'status'  => true,
                    'message' => "💳 *INFORMASI SALDO*\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *Nama:* {$user->name}\n📱 *Nomor:* {$user->whatsapp}\n💰 *Saldo:* Rp " . number_format($user->saldo, 0, ',', '.') . "\n\n_Ketik `.depo` untuk top up saldo._"
                ]);
            }

            // =========================================================
            // 7. FITUR CEK KUOTA SIDOMPUL
            // =========================================================
            if ($command === 'cek_kuota' || $cmdAi === 'cekkuota' || $cmdAi === 'cek') {
                $target_number = $request->input('target') ?? $parts[1] ?? '';
                if (empty($target_number)) {
                    return response()->json(['status' => true, 'message' => "📱 *CEK KUOTA SIDOMPUL*\nFormat: `.cek [NOMOR_HP]`\nContoh: `.cek 081916526445`"]);
                }

                $msisdn = preg_replace('/[^0-9]/', '', $target_number);
                if (strlen($msisdn) < 9) {
                    return response()->json(['status' => false, 'message' => '❌ Nomor tujuan tidak valid!']);
                }

                try {
                    $timestamp = round(microtime(true) * 1000);
                    $res = Http::timeout(15)->withHeaders([
                        'Authorization' => 'Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw',
                        'X-API-Key'     => '60ef29aa-a648-4668-90ae-20951ef90c55',
                        'X-App-Version' => '4.0.0',
                        'Accept'        => 'application/json',
                        'Origin'        => 'https://sidompul.kmsp-store.com',
                        'Referer'       => 'https://sidompul.kmsp-store.com/'
                    ])->get("https://apigw.kmsp-store.com/sidompul/v4/cek_kuota", ['msisdn' => $msisdn, 'isJSON' => 'true', '_' => $timestamp]);

                    if ($res->successful()) {
                        $data = $res->json();
                        $hasil = "📊 *HASIL CEK KUOTA SIDOMPUL*\n📱 *Nomor:* {$msisdn}\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
                        if (isset($data['status']) && $data['status'] === false) {
                            return response()->json(['status' => true, 'message' => "❌ *CEK KUOTA GAGAL*\n" . ($data['message'] ?? 'Sistem provider sibuk.')]);
                        }
                        if (isset($data['data']['hasil'])) {
                            $infoAsli = str_replace(['<br>', '<br/>', '<br />'], "\n", $data['data']['hasil']);
                            $infoAsli = str_replace(["📄 RESULT: \n\nMSISDN: " . $msisdn . "\n\n", "📄 RESULT: \n\n", "&#128195; RESULT:"], "", $infoAsli);
                            $hasil .= trim($infoAsli) . "\n\n";
                        } else {
                            $hasil .= "✅ Nomor aktif. Tidak ditemukan paket data aktif.\n\n";
                        }
                        $hasil .= "━━━━━━━━━━━━━━━━━━━━━━\n_MilaStore System_";
                        return response()->json(['status' => true, 'message' => (string)$hasil]);
                    }
                    return response()->json(['status' => true, 'message' => '❌ Server Sidompul sedang gangguan.']);
                } catch (\Throwable $e) {
                    return response()->json(['status' => true, 'message' => '❌ Permintaan timeout ke pusat.']);
                }
            }

            // =========================================================
            // 8. MENU UTAMA & KATALOG
            // =========================================================
            if ($command === 'main_menu') {
                $teks = "*M I L A S T O R E*\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *Akun:* {$user->name}\n💳 *Saldo:* Rp " . number_format($user->saldo, 0, ',', '.') . "\n━━━━━━━━━━━━━━━━━━━━━━\n\n*» KATEGORI PRODUK «*\n*[ 1 ]* ⚡ *AKRAB XL*\n*[ 2 ]* 🚀 *AKRAB XDA & PROMO*\n*[ 3 ]* 🔥 *AMIFI KDA/PDA*\n*[ 4 ]* 🌐 *PAKET DATA*\n*[ 5 ]* ⏳ *MASA AKTIF KARTU*\n";

                $userLevel = isset($user->level) ? strtolower(trim((string)$user->level)) : 'member';
                $userRole  = isset($user->role) ? strtolower(trim((string)$user->role)) : 'member';
                if (in_array($userLevel, ['admin', 'owner', 'superadmin', 'bos']) || in_array($userRole, ['admin', 'owner', 'superadmin', 'bos'])) {
                    $teks .= "*[ 6 ]* 👑 *PANEL ADMIN*\n";
                }

                $teks .= "\n*» PINTASAN CEPAT «*\n*+* `.depo` ➔ Isi Saldo\n*-* `.batal` ➔ Batal Tiket\n*🔎* `.cek` ➔ Cek Kuota\n\n_Balas dengan angka *1-6*._";
                return response()->json(['status' => true, 'message' => (string)$teks]);
            }

            if ($command === 'menu_xla') {
                $akrabXla = DB::table('layanan_khfy')->where('kode_layanan', 'like', 'XLA%')->where('harga_jual', '>', 0)->get()->map(function($item) { preg_match('/(\d+)/', $item->kode_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy('size')->values();
                $stockKhfy = [];
                try {
                    $res = Http::timeout(3)->get('https://panel.khfy-store.com/api_v3/cek_stock_akrab');
                    if ($res->successful()) {
                        foreach ($res->json()['data'] as $s) { $stockKhfy[$s['type']] = $s['sisa_slot']; }
                    }
                } catch (\Throwable $e) {}

                $teks = "┌──[ 💠 *XL AKRAB (XLA)* ]──\n\n";
                foreach ($akrabXla as $i => $p) {
                    $sisa = $this->getSmartStock($stockKhfy, $p, $akrabXla, 0);
                    $stIcon = ($sisa > 0) ? '🟢' : '🔴';
                    $desc = $this->getDesc($p);
                    $hargaFinal = $this->getHargaFinalWa($p, "khfy", $user);
                    $teks .= " *[ X" . ($i + 1) . " ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($hargaFinal, 0, ',', '.') . "* | 📦 $stIcon *$sisa*{$desc}\n\n";
                }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order X1 081916526445`\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => (string)$teks]);
            }

            if ($command === 'menu_xda') {
                $akrabXda = DB::table('layanan_kaje')->where(fn($q) => $q->where('kode_layanan', 'like', 'KDA%')->orWhere('kode_layanan', 'like', 'PDA%'))->where('harga_jual', '>', 0)->get()->map(function($item) { $item->type = str_starts_with($item->kode_layanan, 'KDA') ? '1_KDA' : '2_PDA'; preg_match('/(\d+)/', $item->kode_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy(function($item) { return sprintf('%s-%04d', $item->type, $item->size); })->values();
                $stockKaje = [];
                try {
                    $kaje = app(KajeService::class);
                    $resK = $kaje->getStock();
                    if (isset($resK['success']) && $resK['success'] == true) {
                        foreach ($resK['data'] as $p) { $stockKaje[$p['code'] ?? $p['kode_layanan']] = $p['stock'] ?? $p['stok'] ?? 0; }
                    }
                } catch (\Throwable $e) {}

                $teks = "┌──[ 💠 *AMIFI (KDA/PDA)* ]──\n\n";
                foreach ($akrabXda as $i => $p) {
                    $sisa = $this->getSmartStock($stockKaje, $p, $akrabXda, $p->stok ?? 0);
                    $stIcon = ($sisa > 0) ? '🟢' : '🔴';
                    $desc = $this->getDesc($p);
                    $hargaFinal = $this->getHargaFinalWa($p, "kaje", $user);
                    $teks .= " *[ A" . ($i + 1) . " ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($hargaFinal, 0, ',', '.') . "* | 📦 $stIcon *$sisa*{$desc}\n\n";
                }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order A1 081916526445`\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => (string)$teks]);
            }

            if ($command === 'menu_pln') {
                $adamProducts = DB::table('ppob_products')
                    ->select('id', 'product_code as kode_layanan', 'product_name as nama_layanan', 'price_sell as harga_jual', 'description as deskripsi', 'is_active as status')
                    ->where('provider_name', 'ADAMMEDIA')->where('price_sell', '>', 0)
                    ->where(function($q) { $q->where('product_code', 'like', 'XDA%')->orWhere('product_code', 'like', 'XAP%'); })
                    ->get()->map(function($item) { preg_match('/(\d+)/', $item->kode_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })
                    ->sortBy('size')->values();

                $stockV8 = [];
                try {
                    $key = env('ADAMMEDIA_API_KEY');
                    if (!empty($key)) {
                        $reqReg = Http::withHeaders(['x-api-key' => $key])->timeout(10)->get("https://juraganxl.my.id/api/regulers");
                        if ($reqReg->successful() && is_array($reqReg->json())) {
                            foreach ($reqReg->json() as $i) { if (isset($i['config'])) { $stockV8[strtoupper($i['config'])] = ($i['open'] ?? true) ? (int)($i['count'] ?? 0) : 0; } }
                        }
                    }
                } catch (\Throwable $e) {}

                $teks = "┌──[ 🚀 *AKRAB XDA & PROMO* ]──\n\n";
                foreach ($adamProducts as $i => $p) {
                    $sisa = $this->getSmartStock($stockV8, $p, $adamProducts, 0);
                    $stIcon = ($sisa > 0) ? '🟢' : '🔴';
                    $desc = $this->getDesc($p);
                    $badge = str_starts_with($p->kode_layanan, 'XAP') ? ' 🔥' : '';
                    $hargaFinal = $this->getHargaFinalWa($p, "adam", $user);
                    $teks .= " *[ V" . ($i + 1) . " ]* {$p->nama_layanan}{$badge}\n  └ 🏷️ *Rp " . number_format($hargaFinal, 0, ',', '.') . "* | 📦 $stIcon *$sisa*{$desc}\n\n";
                }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order V1 081916526445`\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => (string)$teks]);
            }

            if ($command === 'menu_data') {
                $dataDigi = DB::table('layanan')->where(function($q) { $q->where('nama_layanan', 'LIKE', '%edukasi%')->orWhere('nama_layanan', 'LIKE', '%conference%'); })->where('harga_jual', '>', 0)->orderBy('harga_jual', 'asc')->get();
                $teks = "┌──[ 🌐 *PAKET DATA* ]──\n\n";
                if ($dataDigi->isEmpty()) {
                    $teks .= " _(Produk kosong)_\n\n";
                } else {
                    foreach ($dataDigi as $i => $p) {
                        $desc = $this->getDesc($p);
                        $teks .= " *[ DT" . ($i + 1) . " ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual, 0, ',', '.') . "*{$desc}\n\n";
                    }
                }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order DT1 081916526445`\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => (string)$teks]);
            }

            if ($command === 'menu_aktif') {
                $aktifDigi = DB::table('layanan')->where('nama_layanan', 'LIKE', '%masa aktif%')->where('harga_jual', '>', 0)->orderBy('harga_jual', 'asc')->get();
                $teks = "┌──[ ⏳ *MASA AKTIF KARTU* ]──\n\n";
                if ($aktifDigi->isEmpty()) {
                    $teks .= " _(Produk kosong)_\n\n";
                } else {
                    foreach ($aktifDigi as $i => $p) {
                        $desc = $this->getDesc($p);
                        $teks .= " *[ M" . ($i + 1) . " ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual, 0, ',', '.') . "*{$desc}\n\n";
                    }
                }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order M1 081916526445`\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => (string)$teks]);
            }

            // =========================================================
            // 9. SISTEM DEPOSIT OTOMATIS
            // =========================================================
            if ($command === 'deposit_create') {
                $rawNominal = strtolower(trim($request->input('nominal') ?? $parts[1] ?? ''));
                if (str_ends_with($rawNominal, 'k')) {
                    $nominal = (int)str_replace('k', '', $rawNominal) * 1000;
                } else {
                    $nominal = (int)preg_replace('/[^0-9]/', '', $rawNominal);
                }

                $metode_idx = (int)($request->input('metode') ?? $parts[2] ?? 0) - 1;
                $all_payments = DB::table('payment_settings')->get();
                $payments = [];
                foreach ($all_payments as $p) {
                    $payments[] = $p;
                }

                $cek_pending = DB::table('deposits')->where('user_id', $user->id)->where('status', 'Pending')->first();
                if ($cek_pending) {
                    $pay_active = DB::table('payment_settings')->where('metode', $cek_pending->metode)->first();
                    $total_bayar = $cek_pending->total_bayar;
                    $is_new = false;
                } else {
                    if ($nominal < 1000 || !isset($payments[$metode_idx])) {
                        $msg = "┌──[ 💳 *ISI SALDO MILASTORE* ]──\n\n✨ *METODE PEMBAYARAN:*\n";
                        foreach ($payments as $k => $v) {
                            $icon = str_starts_with($v->metode, 'QRIS') ? '📱' : '🏦';
                            $msg .= " 👉 *D" . ($k + 1) . "* ➔ $icon " . str_replace('_', ' ', $v->metode) . "\n";
                        }
                        $msg .= "\n💬 *Contoh Order Cepat:*\n`.depo 50k 1`\n└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈";
                        return response()->json(['status' => false, 'message' => (string)$msg]);
                    }
                    $pay_active = $payments[$metode_idx];
                    $is_new = true;

                    do {
                        $kode_unik = rand(10, 999);
                        $total_bayar = $nominal + $kode_unik;
                        $cek_dobel = DB::table("deposits")->where("status", "Pending")->where("total_bayar", $total_bayar)->exists();
                    } while ($cek_dobel);

                    DB::table("deposits")->insert([
                        "user_id"     => $user->id,
                        "metode"      => $pay_active->metode,
                        "amount"      => $nominal,
                        "kode_unik"   => $kode_unik,
                        "total_bayar" => $total_bayar,
                        "status"      => "Pending",
                        "created_at"  => now(),
                        "updated_at"  => now()
                    ]);
                }

                $msg = ($is_new) ? "💳 *TIKET DEPOSIT DIBUAT!*\n" : "⏳ *SELESAIKAN PEMBAYARAN TIKET AKTIF*\n";
                $msg .= "┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n│ 🏦 Metode: *" . str_replace('_', ' ', $pay_active->metode) . "*\n";
                if ($pay_active) {
                    $msg .= "│ 👤 Nama: *{$pay_active->atas_nama}*\n";
                    if (!str_starts_with($pay_active->metode, 'QRIS')) {
                        $msg .= "│ 🔢 Rek: *{$pay_active->nomor}*\n";
                    }
                }
                $msg .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\nSilakan transfer TEPAT SEBESAR:\n👉 *Rp " . number_format($total_bayar, 0, ',', '.') . "* 👈\n\n⚡ _Proses otomatis 1-3 menit._\n⛔ _Batal tiket? Ketik: `.batal`_";

                $res_data = ['status' => true, 'message' => (string)$msg];
                if ($pay_active && str_starts_with($pay_active->metode, 'QRIS')) {
                    $dq = $this->makeDynamicQris($pay_active->nomor, $total_bayar);
                    $res_data['image_url'] = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" . urlencode($dq);
                }
                return response()->json($res_data);
            }

            if ($command === 'deposit_cancel' || $cmdAi === 'batal') {
                $p = DB::table('deposits')->where('user_id', $user->id)->where('status', 'Pending')->first();
                if (!$p) return response()->json(['status' => false, 'message' => '❌ Tidak ada tiket deposit aktif yang pending.']);
                DB::table('deposits')->where('id', $p->id)->update(['status' => 'Gagal', 'updated_at' => now()]);
                return response()->json(['status' => true, 'message' => '✅ Tiket deposit berhasil dibatalkan.']);
            }

            // =========================================================
            // 10. SISTEM TRANSAKSI (.order & .sikat / war)
            // =========================================================
            if ($command === 'order_akrab' || $command === 'war_sikat' || $cmdAi === 'order' || $cmdAi === 'beli' || $cmdAi === 'sikat' || preg_match('/^(X|A|V|DT|M)\d+$/i', $cmdAi)) {
                
                // Jika formatnya langsung "X1 081916526445"
                if (preg_match('/^(X|A|V|DT|M)\d+$/i', $cmdAi)) {
                    $kode_input = strtoupper($cmdAi);
                    $target_raw = $parts[1] ?? '';
                } else {
                    $kode_input = strtoupper($request->input('kode') ?? $parts[1] ?? '');
                    $target_raw = $request->input('target') ?? $parts[2] ?? '';
                }

                $selected = null;
                $akrabXla = DB::table('layanan_khfy')->where('kode_layanan', 'like', 'XLA%')->where('harga_jual', '>', 0)->get();
                $akrabXda = DB::table('layanan_kaje')->where(fn($q) => $q->where('kode_layanan', 'like', 'KDA%')->orWhere('kode_layanan', 'like', 'PDA%'))->where('harga_jual', '>', 0)->get();
                $adamProducts = DB::table('ppob_products')->select('id', 'product_code as kode_layanan', 'product_name as nama_layanan', 'price_sell as harga_jual', 'description as deskripsi', 'is_active as status')->where('provider_name', 'ADAMMEDIA')->where('price_sell', '>', 0)->where(function($q) { $q->where('product_code', 'like', 'XDA%')->orWhere('product_code', 'like', 'XAP%'); })->get();
                $dataDigi = DB::table('layanan')->where(function($q) { $q->where('nama_layanan', 'LIKE', '%edukasi%')->orWhere('nama_layanan', 'LIKE', '%conference%'); })->where('harga_jual', '>', 0)->get();
                $aktifDigi = DB::table('layanan')->where('nama_layanan', 'LIKE', '%masa aktif%')->where('harga_jual', '>', 0)->get();

                if (preg_match('/^X(\d+)$/', $kode_input, $m)) {
                    $selected = $akrabXla->map(function($item) { preg_match('/(\d+)/', $item->kode_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy('size')->values()->get((int)$m[1] - 1);
                } elseif (preg_match('/^A(\d+)$/', $kode_input, $m)) {
                    $selected = $akrabXda->map(function($item) { $item->type = str_starts_with($item->kode_layanan, 'KDA') ? '1_KDA' : '2_PDA'; preg_match('/(\d+)/', $item->kode_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy(function($item) { return sprintf('%s-%04d', $item->type, $item->size); })->values()->get((int)$m[1] - 1);
                } elseif (preg_match('/^V(\d+)$/', $kode_input, $m)) {
                    $selected = $adamProducts->map(function($item) { preg_match('/(\d+)/', $item->kode_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy('size')->values()->get((int)$m[1] - 1);
                } elseif (preg_match('/^DT(\d+)$/', $kode_input, $m)) {
                    $selected = $dataDigi->sortBy('harga_jual')->values()->get((int)$m[1] - 1);
                } elseif (preg_match('/^M(\d+)$/', $kode_input, $m)) {
                    $selected = $aktifDigi->sortBy('harga_jual')->values()->get((int)$m[1] - 1);
                }

                if (!$selected) {
                    return response()->json(['status' => false, 'message' => "❌ *PRODUK TIDAK DITEMUKAN*\nPeriksa kode produk pada menu katalog."]);
                }

                $isKaje = DB::table('layanan_kaje')->where('kode_layanan', $selected->kode_layanan)->exists();
                $isDigi = DB::table('layanan')->where('kode_layanan', $selected->kode_layanan)->exists();
                $isAdam = DB::table('ppob_products')->where('provider_name', 'ADAMMEDIA')->where('product_code', $selected->kode_layanan)->exists();

                $numbers = array_values(array_unique(array_filter(preg_split('/[\r\n, ]+/', $target_raw), fn($n) => strlen(preg_replace('/[^0-9]/', '', $n)) >= 5)));

                if (empty($numbers)) {
                    return response()->json(['status' => false, 'message' => "❌ Nomor tujuan belum diisi!\nFormat: `.order [KODE] [NOMOR_HP]`\nContoh: `.order {$kode_input} 081916526445`"]);
                }

                $provKey = $isKaje ? 'kaje' : ($isAdam ? 'adam' : ($isDigi ? 'digiflazz' : 'khfy'));
                $hargaPerItem = $this->getHargaFinalWa($selected, $provKey, $user);
                $qty = count($numbers);
                $total = $hargaPerItem * $qty;

                DB::beginTransaction();
                try {
                    $dbUser = DB::table('users')->where('id', $user->id)->lockForUpdate()->first();
                    if ($dbUser->saldo < $total) {
                        DB::rollBack();
                        return response()->json(['status' => false, 'message' => "❌ *SALDO TIDAK MENCUKUPI*\nSaldo Anda: Rp " . number_format($dbUser->saldo, 0, ',', '.') . "\nTotal Pembelian: Rp " . number_format($total, 0, ',', '.')]);
                    }
                    DB::table('users')->where('id', $user->id)->decrement('saldo', $total);
                    DB::commit();
                    $sisa_saldo_realtime = $dbUser->saldo - $total;
                } catch (\Throwable $e) {
                    DB::rollBack();
                    return response()->json(['status' => false, 'message' => '❌ Terjadi kendala saat mengunci saldo.']);
                }

                if ($command === 'war_sikat' || $cmdAi === 'sikat') {
                    foreach($numbers as $index => $tjn) {
                        $ref = 'POX-' . time() . '-' . $index;
                        DB::table('antrian_po')->insert([
                            'ref_id'      => $ref,
                            'username'    => $user->name,
                            'kode_produk' => $selected->kode_layanan,
                            'tujuan'      => $tjn,
                            'harga'       => $hargaPerItem,
                            'status'      => 'Menunggu',
                            'prioritas'   => $this->getPrioritas($selected->kode_layanan),
                            'tanggal'     => now(),
                            'created_at'  => now(),
                            'updated_at'  => now()
                        ]);
                        DB::table('transaksi')->insert([
                            'username'     => $user->name,
                            'ref_id'       => $ref,
                            'kode_layanan' => $selected->kode_layanan,
                            'tujuan'       => $tjn,
                            'harga'        => $hargaPerItem,
                            'status'       => 'Pending',
                            'sn'           => 'Antrean WAR',
                            'tanggal'      => now(),
                            'created_at'   => now(),
                            'updated_at'   => now()
                        ]);
                    }
                    $msg = "⚔️ *SISTEM WAR DIAKTIFKAN!* ⚔️\n╭━━━━━━━━━━━━━━━━━━━━━━\n│ 📦 Produk: *{$selected->nama_layanan}*\n│ 🎯 Target: *$qty Nomor*\n└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n_Sistem akan mengeksekusi otomatis._";
                    return response()->json(['status' => true, 'message' => $msg . "\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')]);
                }

                $berhasil = 0;
                $gagal = 0;

                foreach ($numbers as $tjn) {
                    $refId = ($isKaje ? "INV-" : ($isDigi ? "DIGI-" : "TRX-")) . date("YmdHis") . rand(100, 999);
                    $is_success = false;
                    $sn_msg = '';

                    try {
                        if ($isKaje) {
                            $kaje = app(KajeService::class);
                            $res = $kaje->placeOrder($tjn, $selected->kode_layanan, $refId);
                            if (isset($res['success']) && $res['success'] == true) {
                                $is_success = true;
                                $sn_msg = $res['data']['trx_id'] ?? 'KAJE';
                            }
                        } elseif ($isDigi) {
                            $digi = app(DigiflazzService::class);
                            $res = $digi->placeOrder($refId, $tjn, $selected->kode_layanan);
                            if (isset($res['success']) && $res['success'] == true) {
                                $is_success = true;
                                $sn_msg = 'API Digiflazz';
                            }
                        } elseif ($isAdam) {
                            $adam = app(AdammediaService::class);
                            $res = $adam->placeOrder($refId, $tjn, $selected->kode_layanan);
                            if (isset($res['status']) && in_array($res['status'], ['SUKSES', 'PROSES'])) {
                                $is_success = true;
                                $sn_msg = $res['sn'] ?? 'VIP-V8';
                            }
                        } else {
                            $res = Http::timeout(10)->get('https://panel.khfy-store.com/api_v2/trx', [
                                'api_key' => env('KHFY_API_KEY'),
                                'produk'  => $selected->kode_layanan,
                                'tujuan'  => $tjn,
                                'reff_id' => $refId
                            ]);
                            if (!isset($res->json()['ok']) || $res->json()['ok'] !== false) {
                                $is_success = true;
                                $sn_msg = 'Antrian Khfy';
                            }
                        }
                    } catch (\Throwable $e) {
                        $is_success = true;
                        $sn_msg = 'Background Task';
                    }

                    if ($is_success) {
                        DB::table('transaksi')->insert([
                            'username'     => $user->name,
                            'ref_id'       => $refId,
                            'kode_layanan' => $selected->kode_layanan,
                            'tujuan'       => $tjn,
                            'harga'        => $hargaPerItem,
                            'status'       => 'Proses',
                            'sn'           => $sn_msg,
                            'tanggal'      => now(),
                            'created_at'   => now(),
                            'updated_at'   => now()
                        ]);
                        $berhasil++;
                    } else {
                        DB::table('transaksi')->insert([
                            'username'     => $user->name,
                            'ref_id'       => $refId,
                            'kode_layanan' => $selected->kode_layanan,
                            'tujuan'       => $tjn,
                            'harga'        => $hargaPerItem,
                            'status'       => 'Gagal',
                            'sn'           => $sn_msg,
                            'tanggal'      => now(),
                            'created_at'   => now(),
                            'updated_at'   => now()
                        ]);
                        DB::table('users')->where('id', $user->id)->increment('saldo', $hargaPerItem);
                        $gagal++;
                        $sisa_saldo_realtime += $hargaPerItem;
                    }
                }

                if ($berhasil > 0) {
                    $msg = "🚀 *ORDER DIPROSES!*\n╭━━━━━━━━━━━━━━━━━━━━━━\n│ 📦 Produk: *{$selected->nama_layanan}*\n│ ✅ Berhasil: *$berhasil*\n";
                    if ($gagal > 0) $msg .= "│ ❌ Gagal/Refund: *$gagal*\n";
                    $msg .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.');

                    if (!empty($user->push_token)) {
                        FcmHelper::sendNotification(
                            $user->push_token,
                            "📦 MILA STORE: Pesanan Diproses!",
                            "Produk: {$selected->nama_layanan}\nStatus: {$berhasil} Berhasil diproses\nSisa Saldo: Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')
                        );
                    }

                    return response()->json(['status' => true, 'message' => (string)$msg]);
                } else {
                    return response()->json([
                        'status'  => false,
                        'message' => "❌ *GAGAL PROSES SERVER PUSAT*\nSaldo Anda telah dikembalikan utuh.\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')
                    ]);
                }
            }

            // CS AI Gemini Fallback
            $geminiKey = env('GEMINI_API_KEY', '');
            if (!empty($geminiKey)) {
                try {
                    $res = Http::timeout(6)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $geminiKey, [
                        'contents' => [['parts' => [['text' => "Kamu Mila AI, CS ramah MilaStore. User '{$user->name}' mengirim: '{$pesanBersih}'. Balas singkat, ramah, dan sarankan ketik 'menu' jika butuh bantuan bertransaksi."]]]]
                    ]);
                    $aiResp = $res->json()['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($aiResp) return response()->json(['status' => true, 'message' => "🤖 *Mila AI*\n\n" . trim($aiResp)]);
                } catch (\Throwable $e) {}
            }

            return response()->json(['status' => true, 'message' => "🔧 Perintah tidak dikenali. Ketik *menu* untuk melihat opsi pilihan."]);
        } catch (\Throwable $e) {
            return response()->json(['status' => false, 'message' => '🚨 Fatal Error: ' . $e->getMessage()]);
        }
    }

    protected function getHargaFinalWa($produk, $provider, $user)
    {
        $hargaTabel = (int) ($produk->harga_jual ?? $produk->price_sell ?? 0);
        $hargaModal = (int) ($produk->harga_modal ?? $produk->price_buy ?? $produk->price_original ?? 0);
        $userLevel  = strtolower(trim((string) ($user->role ?? $user->level ?? 'member')));

        if ($userLevel === 'reseller' || $userLevel === 'admin') {
            $diskon = (int) \Illuminate\Support\Facades\Cache::remember(
                'diskon_reseller_' . strtolower($provider),
                3600,
                fn () => DB::table('reseller_discounts')->where('provider', strtolower($provider))->value('potongan') ?? 0
            );
            $hargaAkhir = $hargaTabel - $diskon;
            $batasBawah = ($hargaModal > 0) ? $hargaModal : 1;
            return max($hargaAkhir, $batasBawah);
        }

        return $hargaTabel;
    }

    protected function getSmartStock($stockArray, $currentProduct, $allProducts = null, $default = 0)
    {
        if (empty($stockArray) || !is_array($stockArray)) {
            return (int) ($currentProduct->stok ?? $default);
        }

        $kode = trim((string)($currentProduct->kode_layanan ?? ''));
        if (!empty($kode) && isset($stockArray[$kode]) && (int)$stockArray[$kode] > 0) return (int)$stockArray[$kode];

        $upperKode = strtoupper($kode);
        if (!empty($upperKode) && isset($stockArray[$upperKode]) && (int)$stockArray[$upperKode] > 0) return (int)$stockArray[$upperKode];

        $cleanKode = trim(preg_replace('/[-_ ]*(PROMO|PRM|P\d*)$/i', '', $kode));
        $cleanKode = trim(preg_replace('/[-_ ]*promo[-_ ]*/i', '', $cleanKode));
        if (!empty($cleanKode) && isset($stockArray[$cleanKode]) && (int)$stockArray[$cleanKode] > 0) return (int)$stockArray[$cleanKode];

        return (int) ($currentProduct->stok ?? $default);
    }
}
