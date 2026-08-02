<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Services\KajeService;
use App\Services\DigiflazzService;
use App\Services\AdammediaService;

class BotWaController extends Controller
{
    private $botKey;
    public function __construct() { $this->botKey = env('BOT_WA_KEY', 'MILA_SECRET_2026'); }
    
    private function getDesc($p) {
        if (!empty($p->deskripsi)) {
            $descText = str_replace(['<br>', '<br/>', '<br />', '\n'], "\n       ", (string)$p->deskripsi);
            return "\n    └ 📝 " . trim($descText);
        }
        return "";
    }
    
    private function getPrioritas($kode) {
        if (str_starts_with($kode, 'XLA')) return 1; if (str_starts_with($kode, 'KDA')) return 2; return 3;
    }
    
    private function generateQrisCrc($str) {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $crc ^= (ord($str[$i]) << 8);
            for ($j = 0; $j < 8; $j++) { if ($crc & 0x8000) { $crc = ($crc << 1) ^ 0x1021; } else { $crc = $crc << 1; } }
        }
        return strtoupper(str_pad(dechex($crc &= 0xFFFF), 4, '0', STR_PAD_LEFT));
    }
    
    private function makeDynamicQris($staticQris, $amount) {
        $qris = str_replace('010211', '010212', substr($staticQris, 0, -4));
        $amtStr = (string)$amount; $tag54 = "54" . str_pad(strlen($amtStr), 2, '0', STR_PAD_LEFT) . $amtStr;
        if (strpos($qris, '5802ID') !== false) { $qris = str_replace('5802ID', $tag54 . '5802ID', $qris); } else { $qris .= $tag54; }
        return $qris . $this->generateQrisCrc($qris);
    }
    
    public function handle(Request $request)
    {
        try {
            date_default_timezone_set('Asia/Jakarta');
            $command = $request->input('command');
            $raw_wa = $request->input('no_wa');
            $no_wa = preg_replace("/[^0-9]/", "", explode("@", (string)$raw_wa)[0]);
            if (empty($no_wa) || strlen($no_wa) < 9) return response()->json(["status" => false, "message" => "❌ Nomor tidak valid!"]);
            
            $indo_num = (substr($no_wa, 0, 2) == "62") ? "0" . substr($no_wa, 2) : $no_wa;
            $user = DB::table('users')->where('whatsapp', $no_wa)->orWhere('phone', $no_wa)->orWhere('phone', $indo_num)->first();
            
            $pesanAsli = $request->input('pesan') ?? $request->input('message') ?? $request->input('text') ?? $request->input('msg') ?? '';
            if (is_array($pesanAsli)) { $pesanAsli = $pesanAsli['text'] ?? $pesanAsli['message'] ?? ''; }
            if (empty(trim((string)$pesanAsli)) && !empty($command)) { $pesanAsli = (string)$command; }
            $pesanBersih = trim((string)$pesanAsli);
            $parts = explode(' ', $pesanBersih);
            $cmdAi = strtolower(ltrim($parts[0] ?? '', '.'));

            $adminCmds = ['acc', 'tolak', 'addsaldo', 'bc', 'addbc', 'listbc', 'delbc'];
            if (in_array($cmdAi, $adminCmds)) { $command = 'admin_' . $cmdAi; }

            // === REAL AI & REGISTER SYSTEM ===
            if (!empty($no_wa) && empty($command) && empty($request->input('otp'))) {
                if ($cmdAi === 'login') {
                    if (!isset($parts[1]) || empty(trim($parts[1]))) { return response()->json(['status' => true, 'message' => "✨ *MilaStore* ✨\n━━━━━━━━━━━━━━━━━━━━\n\nJika Kakak *SUDAH PUNYA AKUN* dan ingin pindah ke nomor ini, ketik:\n*.login [Nomor_WA_Lama]*\n_(Contoh: .login 08123456789)_"]); }
                    $oldPhone = preg_replace('/[^0-9]/', '', $parts[1]); $oldPhoneLocal = (substr($oldPhone, 0, 2) == '62') ? '08' . substr($oldPhone, 2) : $oldPhone;
                    $oldUser = DB::table('users')->where('whatsapp', $oldPhone)->orWhere('phone', $oldPhone)->orWhere('whatsapp', $oldPhoneLocal)->orWhere('phone', $oldPhoneLocal)->first();
                    if ($oldUser) {
                        if ($oldUser->whatsapp == $no_wa || $oldUser->phone == $no_wa) return response()->json(['status' => true, 'message' => "Kakak sudah login! Silakan ketik *menu*."]);
                        $otpCode = rand(100000, 999999); DB::table('users')->where('id', $oldUser->id)->update(['otp_code' => $otpCode]);
                        $targetWaLama = (substr($oldPhone, 0, 1) == '0') ? '62' . substr($oldPhone, 1) : $oldPhone;
                        $msgOtpLama = "🚨 *PERINGATAN PINDAH AKUN* 🚨\n\nSeseorang mencoba memindahkan akun MILASTORE Anda.\nGunakan Kode OTP ini: *$otpCode*\n\n_JANGAN BERIKAN KODE INI KEPADA SIAPAPUN!_";
                        try { Http::timeout(3)->post('http://127.0.0.1:3333/send-notif', ['target' => $targetWaLama, 'message' => $msgOtpLama, 'key' => 'SULTAN_MILA_2026']); } catch (\Throwable $e) {}
                        return response()->json(['status' => true, 'message' => "✅ *OTP BERHASIL DIKIRIM!*\n━━━━━━━━━━━━━━━━━━━━\nBalas pesan ini dengan format:\n*.verifikasi [Kode_OTP]*"]);
                    } else { return response()->json(['status' => true, 'message' => "❌ *Nomor tidak ditemukan di database MILASTORE.*"]); }
                }
                if ($cmdAi === 'verifikasi' && isset($parts[1])) {
                    $otpInput = preg_replace('/[^0-9]/', '', $parts[1]);
                    $checkUser = DB::table('users')->where('otp_code', $otpInput)->whereNotNull('otp_code')->first();
                    if ($checkUser) { DB::table('users')->where('id', $checkUser->id)->update(['whatsapp' => $no_wa, 'otp_code' => null, 'status' => 'aktif', 'wa_verified_at' => date('Y-m-d H:i:s')]); return response()->json(['status' => true, 'message' => "🎉 *MIGRASI AKUN SUKSES!*\nKetik *menu* untuk bertransaksi."]); }
                    return response()->json(['status' => true, 'message' => "❌ *Kode OTP Salah atau Kadaluarsa!*"]);
                }
                if ($cmdAi === 'daftar' || $cmdAi === 'register') {
                    if ($user) return response()->json(['status' => true, 'message' => "Kakak sudah terdaftar! Ketik *menu* untuk transaksi."]);
                    if (count($parts) < 3) return response()->json(['status' => true, 'message' => "✨ *MilaStore* ✨\n━━━━━━━━━━━━━━━━━━━━\nUntuk mendaftar, gunakan format:\n*.daftar email_anda@gmail.com Nama Toko*\n_(Contoh: .daftar bosku@gmail.com Sultan Cell)_"]);
                    $emailBaru = $parts[1]; $namaToko = implode(' ', array_slice($parts, 2));
                    if (!filter_var($emailBaru, FILTER_VALIDATE_EMAIL)) return response()->json(['status' => true, 'message' => "❌ Format email tidak valid!"]);
                    if (DB::table('users')->where('email', $emailBaru)->exists()) return response()->json(['status' => true, 'message' => "❌ Email sudah terdaftar! Ketik *.login* untuk pindah HP."]);
                    DB::table('users')->insert(['name' => $namaToko, 'email' => $emailBaru, 'whatsapp' => $no_wa, 'phone' => $no_wa, 'password' => \Illuminate\Support\Facades\Hash::make('123456'), 'saldo' => 0, 'level' => 'Member', 'status' => 'aktif', 'api_key' => \Illuminate\Support\Str::random(30)]);
                    return response()->json(['status' => true, 'message' => "🎉 *PENDAFTARAN SUKSES!*\nSelamat datang, *$namaToko*!\n\n🌐 Web: https://milastore.cloud/login\n📧 Email: $emailBaru\n🔑 Password: 123456\n\nKetik *menu* untuk melihat layanan kami. 🚀"]);
                }
                if (!$user) return response()->json(['status' => true, 'message' => "✨ *MilaStore* ✨\n━━━━━━━━━━━━━━━━━━━━\nNomor Anda belum terdaftar.\n\n1️⃣ *PENGGUNA BARU (DAFTAR)*\nKetik: *.daftar email_anda@gmail.com Nama Toko*\n\n2️⃣ *PENGGUNA LAMA (PINDAH WA)*\nKetik: *.login*"]);
            }
            if (!$user) return response()->json(['status' => false, 'message' => "❌ Sesi ditolak. Nomor belum terdaftar."]);

            // === SYSTEM AUTO OTP LOGIN WEB ===
            if ($command === 'auto_otp' || $cmdAi === 'auto_otp' || (empty($command) && preg_match('/^\d{6}$/', $pesanBersih))) {
                $otp_input = trim($request->input('otp') ?? $pesanBersih ?? '');
                $userV = DB::table('users')->where('otp_code', $otp_input)->first();
                if (!$userV) return response()->json(['status' => false, 'message' => "❌ *KODE OTP SALAH!*\nSistem mendeteksi aktivitas mencurigakan."]);
                DB::table('users')->where('id', $userV->id)->update(['whatsapp' => $no_wa, 'otp_code' => null]);
                return response()->json(['status' => true, 'message' => "✅ *LOGIN BERHASIL!*\nKetik `p` untuk melihat menu."]);
            }

            // === AUTO-ROUTING AGRESIF ===
            $routingMap = [
                '1' => 'menu_xla', '2' => 'menu_pln', '3' => 'menu_xda', '4' => 'menu_data', '5' => 'menu_aktif',
                '6' => 'menu_admin', 'admin' => 'menu_admin', 'panel' => 'menu_admin',
                'p' => 'main_menu', 'menu' => 'main_menu',
                'depo' => 'deposit_create', 'deposit' => 'deposit_create', 'batal' => 'deposit_cancel'
            ];
            if (array_key_exists($cmdAi, $routingMap)) { $command = $routingMap[$cmdAi]; }

            // === MILA AI (GEMINI) BYPASS ===
            $sysCmds = array_merge(array_keys($routingMap), $adminCmds, ['order', 'beli', 'ping', 'help', 'saldo', 'cek', 'cekkuota', 'cek_kuota', 'tagihan', 'login', 'daftar', 'register', 'verifikasi']);
            if ($user && $pesanBersih !== '' && !in_array($cmdAi, $sysCmds) && empty($command)) {
                if (!preg_match('/^[0-9]{4,6}$/', $pesanBersih)) {
                    $key = env('GEMINI_API_KEY', '');
                    if (!empty($key)) {
                        try {
                            $res = Http::timeout(10)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $key, [ 'contents' => [['parts' => [['text' => "Kamu Mila AI, CS MilaStore. User '{$user->name}' chat: '$pesanBersih'. Jawab ramah & singkat. Arahkan ke menu jika ditanya tentang transaksi."]]]] ]);
                            $aiResp = $res->json()['candidates'][0]['content']['parts'][0]['text'] ?? null;
                            if ($aiResp) return response()->json(['status' => true, 'message' => "🤖 *Mila AI - MILASTORE*\n\n" . trim($aiResp)]);
                        } catch (\Exception $e) {}
                    }
                }
            }

            // ==========================================
            // 👑 EKSEKUSI PERINTAH SUPER ADMIN
            // ==========================================
            if (str_starts_with((string)$command, 'admin_') || $command === 'menu_admin') {
                $userLevel = isset($user->level) ? strtolower(trim((string)$user->level)) : 'member';
                if (!in_array($userLevel, ['admin', 'owner', 'superadmin', 'bos'])) {
                    return response()->json(['status' => true, 'message' => "❌ *AKSES DITOLAK!*\nMaaf Bosku, menu ini khusus untuk Administrator."]);
                }

                // FIX: Menambahkan charset utf8mb4 agar support emoji penuh!
                DB::statement("CREATE TABLE IF NOT EXISTS wa_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, pesan TEXT, jadwal VARCHAR(10) NULL, tipe VARCHAR(10) DEFAULT 'instan', status VARCHAR(10) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
                DB::statement("CREATE TABLE IF NOT EXISTS wa_broadcasts_log (id INT AUTO_INCREMENT PRIMARY KEY, bc_id INT, tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

                if ($command === 'admin_acc') {
                    $id = $parts[1] ?? '';
                    $depo = DB::table('deposits')->where('id', $id)->where('status', 'Pending')->first();
                    if (!$depo) return response()->json(['status' => true, 'message' => "❌ Tiket Deposit #$id tidak ditemukan atau sudah diproses."]);
                    DB::table('deposits')->where('id', $id)->update(['status' => 'Sukses']);
                    DB::table('users')->where('id', $depo->user_id)->increment('saldo', $depo->total_bayar);
                    return response()->json(['status' => true, 'message' => "✅ *DEPOSIT #$id BERHASIL DI-ACC!*\nSaldo telah ditambahkan Rp " . number_format($depo->total_bayar, 0, ',', '.') . ".\n_(Sistem Node.js akan mengirim notif otomatis ke user)_"]);
                }
                if ($command === 'admin_tolak') {
                    $id = $parts[1] ?? '';
                    $depo = DB::table('deposits')->where('id', $id)->where('status', 'Pending')->first();
                    if (!$depo) return response()->json(['status' => true, 'message' => "❌ Tiket Deposit #$id tidak ditemukan."]);
                    DB::table('deposits')->where('id', $id)->update(['status' => 'Gagal']);
                    return response()->json(['status' => true, 'message' => "✅ *DEPOSIT #$id DITOLAK!*"]);
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
                    if (empty($pesanBc)) return response()->json(['status' => true, 'message' => "❌ Pesan BC tidak boleh kosong.\nFormat: *.bc [Pesan]*"]);
                    DB::table('wa_broadcasts')->insert(['pesan' => $pesanBc, 'tipe' => 'instan', 'status' => 'pending']);
                    return response()->json(['status' => true, 'message' => "🚀 *BROADCAST INSTAN DIANTRIKAN!*\nPesan sedang dikirim ke seluruh member saat ini juga oleh Node.js!"]);
                }
                if ($command === 'admin_addbc') {
                    $jam = $parts[1] ?? '';
                    if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $jam)) return response()->json(['status' => true, 'message' => "❌ Format jam salah.\nGunakan format 24 Jam (HH:MM).\nContoh: *.addbc 08:30 Selamat Pagi*"]);
                    $pesanBc = trim(substr($pesanBersih, strlen($parts[0]) + strlen($jam) + 2));
                    if (empty($pesanBc)) return response()->json(['status' => true, 'message' => "❌ Pesan BC tidak boleh kosong."]);
                    DB::table('wa_broadcasts')->insert(['pesan' => $pesanBc, 'jadwal' => $jam, 'tipe' => 'harian', 'status' => 'aktif']);
                    return response()->json(['status' => true, 'message' => "⏰ *BROADCAST HARIAN TERSIMPAN!*\nPesan akan dikirim otomatis setiap jam *$jam* oleh server."]);
                }
                if ($command === 'admin_listbc') {
                    $bcs = DB::table('wa_broadcasts')->where('tipe', 'harian')->where('status', 'aktif')->get();
                    $msg = "📋 *DAFTAR BROADCAST HARIAN*\n━━━━━━━━━━━━━━━━━━━━━━\n";
                    if ($bcs->isEmpty()) $msg .= "_Belum ada jadwal broadcast._\n";
                    foreach ($bcs as $bc) { $msg .= "🔹 *ID:* {$bc->id} | ⏰ *Jam:* {$bc->jadwal}\n💬 " . substr($bc->pesan, 0, 40) . "...\n\n"; }
                    $msg .= "━━━━━━━━━━━━━━━━━━━━━━\n_Ketik *.delbc [ID]* untuk menghapus._";
                    return response()->json(['status' => true, 'message' => $msg]);
                }
                if ($command === 'admin_delbc') {
                    $id = $parts[1] ?? '';
                    $bc = DB::table('wa_broadcasts')->where('id', $id)->where('tipe', 'harian')->first();
                    if (!$bc) return response()->json(['status' => true, 'message' => "❌ Jadwal BC ID $id tidak ditemukan."]);
                    DB::table('wa_broadcasts')->where('id', $id)->delete();
                    return response()->json(['status' => true, 'message' => "🗑️ *BROADCAST DIHAPUS!*\nJadwal ID $id tidak akan dikirim lagi."]);
                }

                if ($command === 'menu_admin') {
                    $total_member = (int) DB::table('users')->count();
                    $total_saldo = (float) DB::table('users')->sum('saldo');
                    $trx_hari_ini = (int) DB::table('transaksi')->whereDate('tanggal', date('Y-m-d'))->count();
                    $pending_depo = DB::table('deposits')->where('status', 'Pending')->count();
                    $pending_list = DB::table('deposits')->where('status', 'Pending')->orderBy('created_at', 'asc')->limit(5)->get();
                    
                    $teks = "👑 *PANEL MANAJEMEN ADMIN* 👑\n━━━━━━━━━━━━━━━━━━━━━━\n👥 *Member:* {$total_member} Akun\n💰 *Total Saldo:* Rp " . number_format($total_saldo, 0, ',', '.') . "\n🛒 *Trx Hari Ini:* {$trx_hari_ini} Trx\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
                    $teks .= "⏳ *DEPOSIT PENDING ({$pending_depo})*\n";
                    if ($pending_list->isEmpty()) { $teks .= "_Tidak ada deposit pending._\n"; } 
                    else { foreach($pending_list as $dp) { $usrName = DB::table('users')->where('id', $dp->user_id)->value('name') ?? 'Unknown'; $teks .= "🔹 *ID {$dp->id}* | Rp " . number_format($dp->total_bayar, 0, ',', '.') . "\n👤 {$usrName} ({$dp->metode})\n\n"; } }
                    
                    $teks .= "🛠️ *MANAJEMEN KEUANGAN*\n» `.acc [ID]` ➔ Approve Deposit\n» `.tolak [ID]` ➔ Tolak Deposit\n» `.addsaldo [No_HP] [Nominal]`\n\n";
                    $teks .= "📢 *MANAJEMEN BROADCAST (BC)*\n» `.bc [Pesan]` ➔ BC Instant\n» `.addbc [Jam] [Pesan]` ➔ Buat Jadwal BC\n» `.listbc` ➔ Lihat Daftar BC\n» `.delbc [ID]` ➔ Hapus Jadwal BC\n\n";
                    $teks .= "↪️ _Ketik *p* untuk kembali_";
                    return response()->json(['status' => true, 'message' => (string)$teks]);
                }
            }
            // ==========================================

            // === FITUR CEK KUOTA ===
            if ($command === 'cek_kuota' || $cmdAi === 'cekkuota' || $cmdAi === 'cek') {
                $target_number = $parts[1] ?? '';
                if(empty($target_number)) return response()->json(['status' => true, 'message' => "📱 *CEK KUOTA*\nGunakan format: *.cek [NOMOR_HP]*"]);
                $msisdn = preg_replace('/[^0-9]/', '', $target_number);
                if (strlen($msisdn) < 9) return response()->json(['status' => true, 'message' => "❌ Nomor tidak valid!"]);
                try {
                    $timestamp = round(microtime(true) * 1000);
                    $res = Http::timeout(15)->withHeaders(['Authorization' => 'Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw', 'X-API-Key' => '60ef29aa-a648-4668-90ae-20951ef90c55', 'X-App-Version' => '4.0.0', 'Accept' => 'application/json', 'Content-Type' => 'application/x-www-form-urlencoded', 'Origin' => 'https://sidompul.kmsp-store.com', 'Referer' => 'https://sidompul.kmsp-store.com/', 'User-Agent' => 'Mozilla/5.0'])->get("https://apigw.kmsp-store.com/sidompul/v4/cek_kuota", ['msisdn' => $msisdn, 'isJSON' => 'true', '_' => $timestamp]);
                    if ($res->successful()) {
                        $data = $res->json(); $hasil = "📊 *HASIL CEK KUOTA*\n📱 *Nomor:* $msisdn\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
                        if(isset($data['status']) && $data['status'] === false) return response()->json(['status' => true, 'message' => "❌ *CEK KUOTA GAGAL*\n" . ($data['message'] ?? 'Sistem sibuk.')]);
                        if(isset($data['data']['hasil'])){ $infoAsli = str_replace(['<br>', '<br/>', '<br />'], "\n", $data['data']['hasil']); $infoAsli = str_replace(["📄 RESULT: \n\nMSISDN: " . $msisdn . "\n\n", "📄 RESULT: \n\n", "&#128195; RESULT:"], "", $infoAsli); $hasil .= trim($infoAsli) . "\n\n"; } else { $hasil .= "✅ *Pengecekan berhasil!*\nFormat berbeda atau tidak ada paket.\n\n"; }
                        $hasil .= "━━━━━━━━━━━━━━━━━━━━━━\n_MilaStore System_"; return response()->json(['status' => true, 'message' => (string)$hasil]);
                    } else { return response()->json(['status' => true, 'message' => "❌ *SERVER GANGGUAN*"]); }
                } catch (\Exception $e) { return response()->json(['status' => true, 'message' => "❌ *TIMEOUT* Pusat sibuk."]); }
            }
            
            // === KUMPULAN MENU KATALOG ===
            if ($command === 'main_menu') {
                $teks = "*M I L A S T O R E*\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *Akun:* {$user->name}\n💳 *Saldo:* Rp " . number_format($user->saldo, 0, ',', '.') . "\n━━━━━━━━━━━━━━━━━━━━━━\n\n*» KATEGORI PRODUK «*\n*[ 1 ]* ⚡ *AKRAB XL*\n*[ 2 ]* 🚀 *AKRAB V2*\n*[ 3 ]* 🔥 *AKRAB XDA*\n*[ 4 ]* 🌐 *PAKET DATA*\n*[ 5 ]* ⏳ *MASA AKTIF KARTU*\n";
                $userLevel = isset($user->level) ? strtolower(trim((string)$user->level)) : 'member';
                if (in_array($userLevel, ['admin', 'owner', 'superadmin', 'bos'])) { $teks .= "*[ 6 ]* 👑 *PANEL ADMIN / OWNER*\n"; }
                $teks .= "\n*» PINTASAN CEPAT «*\n*+* `.depo` ➔ Isi Saldo\n*-* `.batal` ➔ Batal Tiket\n*🔎* `.cek` ➔ Cek Kuota\n\n_Balas dengan angka *1-6*._";
                return response()->json(['status' => true, 'message' => (string)$teks]);
            }
            if ($command === 'menu_xla') {
                $akrabXla = DB::table('layanan_khfy')->where('kode_layanan', 'like', 'XLA%')->orderBy('harga_jual', 'asc')->get();
                $stockKhfy = []; try { $res = Http::timeout(3)->get('https://panel.khfy-store.com/api_v3/cek_stock_akrab'); if ($res->successful()) foreach ($res->json()['data'] as $s) { $stockKhfy[$s['type']] = $s['sisa_slot']; } } catch (\Exception $e) { }
                $teks = "┌──[ 💠 *XL AKRAB (XLA)* ]──\n\n"; foreach ($akrabXla as $i => $p) { $sisa = $stockKhfy[$p->kode_layanan] ?? '0'; $stIcon = ($sisa > 0) ? '🟢' : '🔴'; $desc = $this->getDesc($p); $teks .= " *[ X".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "* | 📦 $stIcon *$sisa*{$desc}\n\n"; } $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\n↪️ _Ketik *p* untuk kembali_"; return response()->json(['status' => true, 'message' => (string)$teks]);
            }
            if ($command === 'menu_xda') {
                $akrabXda = DB::table('layanan_kaje')->where(fn($q) => $q->where('kode_layanan', 'like', 'KDA%')->orWhere('kode_layanan', 'like', 'PDA%'))->get()->map(function($item) { preg_match('/(\d+)-/i', $item->nama_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy(function($item) { return sprintf('%03d-%010d', $item->size, $item->harga_jual); })->values();
                $stockKaje = []; try { $kaje = app(KajeService::class); $resK = $kaje->getStock(); if (isset($resK['success']) && $resK['success'] == true) foreach ($resK['data'] as $p) { $stockKaje[$p['code'] ?? $p['kode_layanan']] = $p['stock'] ?? $p['stok'] ?? 0; } } catch (\Exception $e) { }
                $teks = "┌──[ 💠 *AMIFI (KDA/PDA)* ]──\n\n"; foreach ($akrabXda as $i => $p) { $sisa = $stockKaje[$p->kode_layanan] ?? $p->stok ?? 0; $stIcon = ($sisa > 0) ? '🟢' : '🔴'; $desc = $this->getDesc($p); $teks .= " *[ A".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "* | 📦 $stIcon *$sisa*{$desc}\n\n"; } $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\n↪️ _Ketik *p* untuk kembali_"; return response()->json(['status' => true, 'message' => (string)$teks]);
            }
            if ($command === 'menu_pln') {
                $adamProducts = DB::table('ppob_products')->select('id', 'product_code as kode_layanan', 'product_name as nama_layanan', 'price_sell as harga_jual', 'description as deskripsi', 'is_active as status')->where('provider_name', 'ADAMMEDIA')->where(function($q) { $q->where('product_code', 'like', '%XDA%')->orWhere('product_code', 'like', '%XCLP%'); })->orderBy('price_sell', 'asc')->get();
                $stockV8 = []; try { $key = env('ADAMMEDIA_API_KEY'); if (empty($key) && file_exists(base_path('.env'))) { preg_match('/ADAMMEDIA_API_KEY=(.*)/', file_get_contents(base_path('.env')), $matches); $key = trim($matches[1] ?? ''); } $reqReg = Http::withHeaders(['x-api-key' => $key])->timeout(10)->get("https://juraganxl.my.id/api/regulers"); if ($reqReg->successful() && is_array($reqReg->json())) foreach ($reqReg->json() as $i) { if (isset($i['config'])) { $stockV8[strtoupper($i['config'])] = ($i['open'] ?? true) ? (int)($i['count'] ?? 0) : 0; } } $reqCir = Http::withHeaders(['x-api-key' => $key])->timeout(10)->get("https://juraganxl.my.id/api/circles"); if ($reqCir->successful() && is_array($reqCir->json())) foreach ($reqCir->json() as $i) { if (isset($i['config'])) { $stockV8[strtoupper($i['config'])] = ($i['open'] ?? true) ? (int)($i['count'] ?? 0) : 0; } } } catch (\Exception $e) { }
                $teks = "*AKRAB V2 & XDA*\n━━━━━━━━━━━━━━━━━━━━━━\n\n"; foreach ($adamProducts as $i => $p) { $sisa = $stockV8[strtoupper($p->kode_layanan)] ?? 0; $stIcon = ($sisa > 0) ? '🟢' : '🔴'; $desc = $this->getDesc($p); $teks .= "*[ V".($i+1)." ]* {$p->nama_layanan}\n ↳ 🏷️ *Rp " . number_format($p->harga_jual) . "* | 📦 $stIcon *$sisa*{$desc}\n\n"; } $teks .= "━━━━━━━━━━━━━━━━━━━━━━\n*» CARA ORDER «*\nKetik: `.order [KODE] [NO_HP]`\n\n_Ketik *p* untuk kembali._"; return response()->json(['status' => true, 'message' => (string)$teks]);
            }
            if ($command === 'menu_data') {
                $dataDigi = DB::table('layanan')->where(function($q) { $q->where('nama_layanan', 'LIKE', '%edukasi%')->orWhere('nama_layanan', 'LIKE', '%conference%'); })->orderBy('harga_jual', 'asc')->get();
                $teks = "┌──[ 🌐 *PAKET DATA* ]──\n\n"; if($dataDigi->isEmpty()) { $teks .= " _(Produk kosong)_\n\n"; } else { foreach ($dataDigi as $i => $p) { $desc = $this->getDesc($p); $teks .= " *[ DT".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "*{$desc}\n\n"; } } $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\n↪️ _Ketik *p* untuk kembali_"; return response()->json(['status' => true, 'message' => (string)$teks]);
            }
            if ($command === 'menu_aktif') {
                $aktifDigi = DB::table('layanan')->where('nama_layanan', 'LIKE', '%masa aktif%')->orderBy('harga_jual', 'asc')->get();
                $teks = "┌──[ ⏳ *MASA AKTIF KARTU* ]──\n\n"; if($aktifDigi->isEmpty()) { $teks .= " _(Produk kosong)_\n\n"; } else { foreach ($aktifDigi as $i => $p) { $desc = $this->getDesc($p); $teks .= " *[ M".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "*{$desc}\n\n"; } } $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡ *ORDER:* `.order [KODE] [NO_HP]`\n↪️ _Ketik *p* untuk kembali_"; return response()->json(['status' => true, 'message' => (string)$teks]);
            }
            
            // === DEPOSIT & ORDER SYSTEM ===
            if ($command === 'deposit_create') {
                $rawNominal = strtolower(trim($request->input('nominal') ?? $parts[1] ?? ''));
                if (str_ends_with($rawNominal, 'k')) { $nominal = (int)str_replace('k', '', $rawNominal) * 1000; } else { $nominal = (int)preg_replace('/[^0-9]/', '', $rawNominal); }
                $metode_idx = (int)($request->input('metode') ?? $parts[2] ?? 0) - 1;
                $all_payments = DB::table('payment_settings')->get(); $payments = []; foreach($all_payments as $p) { if ($p->metode !== 'QRIS') { $payments[] = $p; } }
                $cek_pending = DB::table('deposits')->where('user_id', $user->id)->where('status', 'Pending')->first();
                if ($cek_pending) { $pay_active = DB::table('payment_settings')->where('metode', $cek_pending->metode)->first(); $nominal_pending = $cek_pending->total_bayar; $is_new = false; } else {
                    if ($nominal < 1000 || !isset($payments[$metode_idx])) {
                        $msg = "┌──[ 💳 *ISI SALDO MILASTORE* ]──\n\n✨ *KODE METODE TERSEDIA:*\n"; foreach($payments as $k => $v) { $icon = str_starts_with($v->metode, 'QRIS') ? '📱' : '🏦'; $msg .= " 👉 *D".($k+1)."* ➔ $icon " . str_replace('_', ' ', $v->metode) . "\n"; } $msg .= "\n💬 *Contoh Cara Cepat:*\n`.depo 50k 1`\n└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"; return response()->json(['status' => false, 'message' => (string)$msg]);
                    }
                    $pay_active = $payments[$metode_idx]; $is_new = true;
                }
                if ($is_new) {
                    do { $kode_unik = rand(10, 999); $total_bayar = $nominal + $kode_unik; $cek_dobel = DB::table("deposits")->where("status", "Pending")->where("total_bayar", $total_bayar)->exists(); } while ($cek_dobel);
                    DB::table("deposits")->insert(["user_id"=>$user->id,"metode"=>$pay_active->metode,"amount"=>$nominal,"kode_unik"=>$kode_unik,"total_bayar"=>$total_bayar,"status"=>"Pending","created_at"=>now(),"updated_at"=>now()]);
                } else { $total_bayar = $nominal_pending; }
                $msg = ($is_new) ? "💳 *TIKET DEPOSIT BERHASIL DIBUAT!*\n" : "⏳ *MOHON SELESAIKAN PEMBAYARAN*\n"; $msg .= "┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n│ 🏦 Metode: *" . str_replace('_', ' ', $pay_active->metode) . "*\n"; if ($pay_active) { $msg .= "│ 👤 Nama: *{$pay_active->atas_nama}*\n"; if (!str_starts_with($pay_active->metode, 'QRIS')) { $msg .= "│ 🔢 Rek: *{$pay_active->nomor}*\n"; } } $msg .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\nSilakan transfer TEPAT SEBESAR:\n👉 *Rp " . number_format($total_bayar, 0, ',', '.') . "* 👈\n\n⚡ _Sistem otomatis (1-5 Menit)._\n";
                if ($pay_active->metode === 'SEABANK') { $msg .= "🚨 *PENTING:* Transfer WAJIB dari sesama SeaBank agar otomatis.\n\n"; } else { $msg .= "⚠️ _Wajib transfer hingga 3 digit terakhir._\n\n"; } $msg .= "⛔ _Ganti nominal? Ketik: `.batal`_"; $res_data = ['status' => true];
                if ($pay_active && str_starts_with($pay_active->metode, 'QRIS')) { $dq = $this->makeDynamicQris($pay_active->nomor, $total_bayar); $res_data['image_url'] = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" . urlencode($dq); $msg = str_replace("👉 *Rp", "⚠️ _Scan Barcode di atas! Nominal sudah otomatis._\n\n👉 *Rp", $msg); } $res_data['message'] = (string)$msg; return response()->json($res_data);
            }
            if ($command === 'deposit_cancel' || $cmdAi === 'batal') {
                $p = DB::table('deposits')->where('user_id', $user->id)->where('status', 'Pending')->first();
                if (!$p) return response()->json(['status'=>false, 'message'=>"❌ *TIDAK ADA TIKET PENDING.*\nSaldo Anda aman."]);
                DB::table('deposits')->where('id', $p->id)->update(['status'=>'Gagal', 'updated_at'=>now()]); return response()->json(['status'=>true, 'message'=>"✅ *TIKET BERHASIL DIBATALKAN.*"]);
            }
            
            if ($command === 'order_akrab' || $command === 'war_sikat') {
                $kode_input = strtoupper($request->input('kode') ?? $parts[1] ?? ''); $selected = null;
                $akrabXla = DB::table('layanan_khfy')->where('kode_layanan', 'like', 'XLA%')->orderBy('harga_jual', 'asc')->get();
                $akrabXda = DB::table('layanan_kaje')->where(fn($q) => $q->where('kode_layanan', 'like', 'KDA%')->orWhere('kode_layanan', 'like', 'PDA%'))->get()->map(function($item) { preg_match('/(\d+)-/i', $item->nama_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy(function($item) { return sprintf('%03d-%010d', $item->size, $item->harga_jual); })->values();
                $adamProducts = DB::table('ppob_products')->select('id', 'product_code as kode_layanan', 'product_name as nama_layanan', 'price_sell as harga_jual', 'description as deskripsi', 'is_active as status')->where('provider_name', 'ADAMMEDIA')->where(function($q) { $q->where('product_code', 'like', '%XDA%')->orWhere('product_code', 'like', '%XCLP%'); })->orderBy('price_sell', 'asc')->get();
                $dataDigi = DB::table('layanan')->where(function($q) { $q->where('nama_layanan', 'LIKE', '%edukasi%')->orWhere('nama_layanan', 'LIKE', '%conference%'); })->orderBy('harga_jual', 'asc')->get();
                $aktifDigi = DB::table('layanan')->where('nama_layanan', 'LIKE', '%masa aktif%')->orderBy('harga_jual', 'asc')->get();

                if (preg_match('/^X(\d+)$/', $kode_input, $m)) { $selected = $akrabXla->values()->get((int)$m[1] - 1); } elseif (preg_match('/^A(\d+)$/', $kode_input, $m)) { $selected = $akrabXda->values()->get((int)$m[1] - 1); } elseif (preg_match('/^V(\d+)$/', $kode_input, $m)) { $selected = $adamProducts->get((int)$m[1] - 1); } elseif (preg_match('/^DT(\d+)$/', $kode_input, $m)) { $selected = $dataDigi->values()->get((int)$m[1] - 1); } elseif (preg_match('/^M(\d+)$/', $kode_input, $m)) { $selected = $aktifDigi->values()->get((int)$m[1] - 1); }
                if (!$selected) return response()->json(['status' => false, 'message' => "❌ *PRODUK TIDAK DITEMUKAN*"]);
                
                $isKaje = DB::table('layanan_kaje')->where('kode_layanan', $selected->kode_layanan)->exists();
                $isDigi = DB::table('layanan')->where('kode_layanan', $selected->kode_layanan)->exists();
                $isAdam = DB::table('ppob_products')->where('provider_name', 'ADAMMEDIA')->where('product_code', $selected->kode_layanan)->exists();
                $target_input = $request->input('target') ?? $parts[2] ?? '';
                $numbers = array_values(array_unique(array_filter(preg_split('/[\r\n, ]+/', $target_input), fn($n) => strlen(preg_replace('/[^0-9]/', '', $n)) >= 5)));
                if(empty($numbers)) return response()->json(['status'=>false, 'message'=>"❌ Format order salah!"]);
                $qty = count($numbers); $total = $selected->harga_jual * $qty;
                
                DB::beginTransaction();
                try {
                    $dbUser = DB::table('users')->where('id', $user->id)->lockForUpdate()->first();
                    if ($dbUser->saldo < $total) { DB::rollBack(); return response()->json(['status' => false, 'message' => "❌ *SALDO TIDAK MENCUKUPI*"]); }
                    if ($command === 'war_sikat' && ($isKaje || $isDigi)) { DB::rollBack(); return response()->json(['status' => false, 'message' => "❌ *PRODUK INI HANYA MENDUKUNG .ORDER*"]); }
                    DB::table('users')->where('id', $user->id)->decrement('saldo', $total);
                    DB::commit(); $sisa_saldo_realtime = $dbUser->saldo - $total;
                } catch (\Exception $e) { DB::rollBack(); return response()->json(['status' => false, 'message' => '❌ *SYSTEM ERROR LOCKING SALDO*']); }
                
                if ($command === 'war_sikat') {
                    foreach($numbers as $index => $tjn) {
                        $ref = 'POX-' . time() . '-' . $index;
                        DB::table('antrian_po')->insert(['ref_id'=>$ref,'username'=>$user->name,'kode_produk'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Menunggu','prioritas'=>$this->getPrioritas($selected->kode_layanan),'tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]);
                        DB::table('transaksi')->insert(['username'=>$user->name,'ref_id'=>$ref,'kode_layanan'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Pending','sn'=>'Antrean WAR','tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]);
                    }
                    $msg = "⚔️ *SISTEM WAR DIAKTIFKAN!* ⚔️\n╭━━━━━━━━━━━━━━━━━━━━━━\n│ 📦 Produk: *{$selected->nama_layanan}*\n│ 🎯 Target: *$qty Nomor*\n└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n_Sistem akan menembak otomatis._";
                    return response()->json(['status' => true, 'message' => $msg . "\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')]);
                } else {
                    $berhasil = 0; $gagal = 0;
                    foreach($numbers as $tjn) {
                        $refId = ($isKaje ? "INV-" : ($isDigi ? "DIGI-" : "TRX-")) . date("YmdHis") . rand(100,999); $is_success = false; $sn_msg = '';
                        try {
                            if ($isKaje) { $kaje = app(KajeService::class); $res = $kaje->placeOrder($tjn, $selected->kode_layanan, $refId); if (isset($res['success']) && $res['success'] == true) { $is_success = true; $sn_msg = $res['data']['trx_id']??'KAJE'; } }
                            elseif ($isDigi) { $digi = app(DigiflazzService::class); $res = $digi->placeOrder($refId, $tjn, $selected->kode_layanan); if (isset($res['success']) && $res['success'] == true) { $is_success = true; $sn_msg = 'API Digiflazz'; } }
                            elseif ($isAdam) { try { $adam = app(AdammediaService::class); $res = $adam->placeOrder($refId, $tjn, $selected->kode_layanan); if (isset($res['status']) && in_array($res['status'], ['SUKSES', 'PROSES'])) { $is_success = true; $sn_msg = $res['sn'] ?? 'VIP-V8'; } else { $is_success = false; $sn_msg = $res['msg'] ?? 'Gagal Server VIP'; } } catch (\Exception $e) { $is_success = false; $sn_msg = 'Timeout Server VIP'; } }
                            else { $res = Http::timeout(10)->get('https://panel.khfy-store.com/api_v2/trx', ['api_key'=>env('KHFY_API_KEY'), 'produk'=>$selected->kode_layanan, 'tujuan'=>$tjn, 'reff_id'=>$refId]); if (!isset($res->json()['ok']) || $res->json()['ok'] !== false) { $is_success = true; $sn_msg = 'Antrian Khfy'; } }
                        } catch (\Exception $e) { $is_success = true; $sn_msg = 'Proses Latar Belakang'; }
                        if ($is_success) { DB::table('transaksi')->insert(['username'=>$user->name,'ref_id'=>$refId,'kode_layanan'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Proses','sn'=>$sn_msg,'tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]); $berhasil++; } else { DB::table('transaksi')->insert(['username'=>$user->name,'ref_id'=>$refId,'kode_layanan'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Gagal','sn'=>$sn_msg,'tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]); DB::table('users')->where('id', $user->id)->increment('saldo', $selected->harga_jual); $gagal++; $sisa_saldo_realtime += $selected->harga_jual; }
                    }
                    if ($berhasil > 0) { $msg = "🚀 *ORDER BERHASIL DIPROSES!*\n╭━━━━━━━━━━━━━━━━━━━━━━\n│ 📦 Produk: *{$selected->nama_layanan}*\n│ ✅ Berhasil: *$berhasil*\n"; if ($gagal > 0) $msg .= "│ ❌ Gagal/Refund: *$gagal*\n"; $msg .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n_Mohon tunggu, pesanan sedang dikirim._"; return response()->json(['status' => true, 'message' => (string)$msg . "\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')]); } else { return response()->json(['status'=>false, 'message'=>"❌ *GAGAL PROSES SERVER PUSAT*\nSaldo telah dikembalikan.\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')]); }
                }
            }

            return response()->json(['status' => true, 'message' => "🔧 _Perintah tidak dikenali sistem._"]);
        } catch (\Throwable $e) { return response()->json(['status' => true, 'message' => "🚨 *FATAL ERROR:* " . $e->getMessage()]); }
    }
}
