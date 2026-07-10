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
    protected $botKey = 'MILA_SEC_v9B4xK8mP2qL7jW5nC3zR1hT6fD0yX5g';

    private function getPrioritas($kode) {
        $prioMap = ['CFMX'=>0, 'XLA89'=>1, 'XLA14'=>2, 'XLA32'=>3, 'XLA39'=>4, 'XLA51'=>5, 'XLA65'=>6];
        return $prioMap[strtoupper($kode)] ?? 99;
    }

    private function getDesc($p) {
        $desc = $p->deskripsi ?? $p->catatan ?? '';
        if (empty($desc)) return '';

        $cleanDesc = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $desc)));
        $lines = explode("\n", $cleanDesc);
        $finalLines = [];

        foreach ($lines as $line) {
            $tLine = trim($line); if (empty($tLine)) continue;
            if (preg_match('/(Bisa ke XL|Resmi|Bergaransi|tanggung jawab|myRewerd|PRIORITAS|otomatis ke kick|Kesalahan nomor)/i', $tLine)) continue;

            if (strpos($tLine, '|') !== false) {
                $areas = explode('|', $tLine);
                foreach($areas as $area) {
                    $cleanArea = trim(str_replace([':', '-'], '=', $area));
                    if(!empty($cleanArea)) $finalLines[] = "▪️ " . $cleanArea;
                }
            } else {
                $cleanLine = trim(str_replace([':', '-'], '=', $tLine));
                if (stripos($cleanLine, 'Global') !== false) {
                    $finalLines[] = "🌐 " . $cleanLine;
                } else {
                    $finalLines[] = "▪️ " . $cleanLine;
                }
            }
        }

        if (empty($finalLines)) return '';
        return "\n  └ 📝 *Detail Kuota:*\n      " . implode("\n      ", array_slice($finalLines, 0, 15));
    }

    private function generateQrisCrc($str) {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $crc ^= (ord($str[$i]) << 8);
            for ($j = 0; $j < 8; $j++) {
                if ($crc & 0x8000) { $crc = ($crc << 1) ^ 0x1021; } else { $crc = $crc << 1; }
            }
        }
        $crc &= 0xFFFF;
        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }

    private function makeDynamicQris($staticQris, $amount) {
        $qris = substr($staticQris, 0, -4);
        $qris = str_replace('010211', '010212', $qris);
        $amtStr = (string)$amount;
        $amtLen = str_pad(strlen($amtStr), 2, '0', STR_PAD_LEFT);
        $tag54 = "54" . $amtLen . $amtStr;
        if (strpos($qris, '5802ID') !== false) { $qris = str_replace('5802ID', $tag54 . '5802ID', $qris); } else { $qris .= $tag54; }
        return $qris . $this->generateQrisCrc($qris);
    }

    public function handle(Request $request)
    {
        try {
            date_default_timezone_set('Asia/Jakarta');
            if ($request->header('X-API-KEY') !== $this->botKey) { return response()->json(['status' => false, 'message' => '❌    Akses Ditolak!']); }

            $command = $request->command;
            $raw_wa = $request->no_wa;
            $no_wa = preg_replace("/[^0-9]/", "", explode("@", $raw_wa)[0]);

            if (empty($no_wa) || strlen($no_wa) < 9) return response()->json(["status" => false, "message" => "❌   Nomor pengirim tidak valid!"]);
            $indo_num = (substr($no_wa, 0, 2) == "62") ? "0" . substr($no_wa, 2) : $no_wa;
            $user = DB::table('users')->where('whatsapp', $no_wa)->orWhere('phone', $no_wa)->orWhere('phone', $indo_num)->first();

            // --- REAL AI & REGISTER SYSTEM ---
            try {
                $pesanAsli = request('pesan') ?? request('message') ?? request('text') ?? request('msg') ?? '';
                if (is_array($pesanAsli)) { $pesanAsli = $pesanAsli['text'] ?? $pesanAsli['message'] ?? ''; }
                if (empty($pesanAsli) && is_array(request('data'))) { $pesanAsli = request('data')['message'] ?? request('data')['text'] ?? ''; }

                $pesanBersih = trim((string)$pesanAsli);
                $parts = explode(' ', $pesanBersih);
                $cmdAi = strtolower(ltrim($parts[0] ?? '', '.'));

                if (!empty($no_wa)) {
                    // 1. FITUR LOGIN
                    if ($cmdAi === 'login') {
                        if (!isset($parts[1]) || empty(trim($parts[1]))) {
                            return response()->json(['status' => true, 'message' => "✨  *MilaStore* ✨ \n━━━━━━━━━━━━━━━━━━━━\n\nHalo Kak!\n\nJika Kakak *SUDAH PUNYA AKUN* (di Web/WA lama) dan ingin pindah ke nomor ini, ketik:\n*.login [Nomor_WA_Lama]*\n_(Contoh: .login 08123456789)_"]);
                        }
                        $oldPhone = preg_replace('/[^0-9]/', '', $parts[1]);
                        $oldPhoneLocal = (substr($oldPhone, 0, 2) == '62') ? '08' . substr($oldPhone, 2) : $oldPhone;
                        $oldUser = \App\Models\User::where('whatsapp', $oldPhone)->orWhere('phone', $oldPhone)->orWhere('whatsapp', $oldPhoneLocal)->orWhere('phone', $oldPhoneLocal)->first();

                        if ($oldUser) {
                            if ($oldUser->whatsapp == $no_wa || $oldUser->phone == $no_wa) {
                                return response()->json(['status' => true, 'message' => "Kakak sudah login menggunakan nomor ini! Silakan ketik *menu*."]);
                            }
                            $otpCode = rand(100000, 999999);
                            \App\Models\User::where('id', $oldUser->id)->update(['otp_code' => $otpCode]);

                            $targetWaLama = (substr($oldPhone, 0, 1) == '0') ? '62' . substr($oldPhone, 1) : $oldPhone;
                            $msgOtpLama = "🚨 *PERINGATAN PINDAH AKUN* 🚨\n\nSeseorang mencoba memindahkan akun MILASTORE Anda ke nomor baru.\nGunakan Kode OTP ini: *$otpCode*\n\n_JANGAN BERIKAN KODE INI KEPADA SIAPAPUN!_";
                            try { \Illuminate\Support\Facades\Http::timeout(3)->post('http://127.0.0.1:3333/send-notif', ['target' => $targetWaLama, 'message' => $msgOtpLama, 'key' => 'SULTAN_MILA_2026']); } catch (\Throwable $e) {}

                            return response()->json(['status' => true, 'message' => "✅  *OTP BERHASIL DIKIRIM!*\n━━━━━━━━━━━━━━━━━━━━\n\nKode OTP otorisasi telah dikirim ke WhatsApp lama Kakak.\nBalas pesan ini di nomor baru dengan format:\n*.verifikasi [Kode_OTP]*"]);
                        } else {
                            return response()->json(['status' => true, 'message' => "❌  *Nomor tidak ditemukan di database MILASTORE.*"]);
                        }
                    }

                    // 2. FITUR VERIFIKASI OTP
                    if ($cmdAi === 'verifikasi' && isset($parts[1])) {   
                        $otpInput = preg_replace('/[^0-9]/', '', $parts[1]);
                        $checkUser = \App\Models\User::where('otp_code', $otpInput)->whereNotNull('otp_code')->first();
                        if ($checkUser) {
                            \App\Models\User::where('id', $checkUser->id)->update(['whatsapp' => $no_wa, 'otp_code' => null, 'status' => 'aktif', 'wa_verified_at' => date('Y-m-d H:i:s')]);
                            return response()->json(['status' => true, 'message' => "🎉 *MIGRASI AKUN SUKSES!*\n━━━━━━━━━━━━━━━━━━━━\nAkun terhubung dengan nomor WA baru ini! 🚀\nKetik *menu* untuk bertransaksi."]);
                        }
                        return response()->json(['status' => true, 'message' => "❌  *Kode OTP Salah atau Kadaluarsa!*"]);
                    }

                    // 3. FITUR DAFTAR 1 BARIS
                    if ($cmdAi === 'daftar' || $cmdAi === 'register') {
                        if ($user) return response()->json(['status' => true, 'message' => "Kakak sudah terdaftar! Ketik *menu* untuk transaksi."]);
                        if (count($parts) < 3) {
                            return response()->json(['status' => true, 'message' => "✨  *MilaStore* ✨ \n━━━━━━━━━━━━━━━━━━━━\n\nUntuk mendaftar, gunakan format:\n*.daftar email_anda@gmail.com Nama Toko*\n\n_(Contoh: .daftar bosku@gmail.com Sultan Cell)_"]);
                        }

                        $emailBaru = $parts[1];
                        $namaToko = implode(' ', array_slice($parts, 2));

                        if (!filter_var($emailBaru, FILTER_VALIDATE_EMAIL)) return response()->json(['status' => true, 'message' => "❌  Format email tidak valid!"]);
                        if (\App\Models\User::where('email', $emailBaru)->exists()) return response()->json(['status' => true, 'message' => "❌ Email sudah terdaftar! Ketik *.login* untuk pindah HP."]);

                        $newUser = new \App\Models\User();
                        $newUser->name = $namaToko;
                        $newUser->email = $emailBaru;
                        $newUser->whatsapp = $no_wa;
                        $newUser->phone = $no_wa;
                        $newUser->password = \Illuminate\Support\Facades\Hash::make('123456');
                        $newUser->saldo = 0;
                        $newUser->level = 'Member';
                        $newUser->status = 'aktif';
                        $newUser->api_key = \Illuminate\Support\Str::random(30);
                        $newUser->save();

                        return response()->json(['status' => true, 'message' => "🎉 *PENDAFTARAN SUKSES!*\n━━━━━━━━━━━━━━━━━━━━\nSelamat datang, *$namaToko*!\nAkun Kakak berhasil dibuat dan sudah aktif.\n\n🌐 Web: https://milastore.cloud/login\n📧 Email: $emailBaru\n🔑 Password: 123456\n\nKetik *menu* untuk melihat layanan kami. 🚀"]);
                    }

                    // 4. MUNCULKAN 2 OPSI JIKA BELUM DAFTAR & KETIK SEMBARANG (Misal: P, Menu)
                    if (!$user) {
                        return response()->json(['status' => true, 'message' => "✨  *MilaStore* ✨  \n━━━━━━━━━━━━━━━━━━━━\n\nHalo Kak! 👋\nNomor Anda belum terdaftar di sistem kami.\n\nSilakan pilih salah satu opsi di bawah ini:\n\n1️⃣ *PENGGUNA BARU (DAFTAR)*\nKetik: *.daftar email_anda@gmail.com Nama Toko*\n_(Contoh: .daftar bosku@gmail.com Sultan Cell)_\n\n2️⃣ *PENGGUNA LAMA (PINDAH WA)*\nKetik: *.login*"]);
                    }

                    // JIKA USER SUDAH DAFTAR, BIARKAN PERINTAH MENGALIR KE SISTEM KONVENSIONAL!
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("BOT ERROR: " . $e->getMessage());
            }
            // --- END REAL AI ---

            if ($command === 'auto_otp' || $command === 'login') {   
                $otp_input = trim($request->otp ?? '');
                if ($command === 'auto_otp') {
                    $userV = DB::table('users')->where('otp_code', $otp_input)->first();
                    if (!$userV) return response()->json(['status' => false, 'message' => "❌    *KODE OTP SALAH/DITOLAK!*\nSistem mendeteksi aktivitas mencurigakan atau kode salah."]);
                    DB::table('users')->where('id', $userV->id)->update(['whatsapp' => $no_wa, 'otp_code' => null]);
                    return response()->json(['status' => true, 'message' => "✅    *LOGIN BERHASIL!*\nSelamat datang kembali di MilaStore.\n\nKetik `p` untuk melihat menu."]);
                }
                $target = trim($request->target_number);
                $indo_num_login = (substr($target, 0, 2) == '62') ? '0' . substr($target, 2) : $target;
                $wa_num_login = (substr($target, 0, 1) == '0') ? '62' . substr($target, 1) : $target;
                $userL = DB::table('users')->where('phone', $indo_num_login)->orWhere('whatsapp', $indo_num_login)->first();
                if (!$userL) return response()->json(['status' => false, 'message' => "❌    *NOMOR TIDAK TERDAFTAR.*\nPastikan nomor terdaftar di web MilaStore."]);
                $otp = rand(111111, 999999);
                DB::table('users')->where('id', $userL->id)->update(['otp_code' => $otp, 'otp_expires_at' => now()->addMinutes(30)]);
                return response()->json(['status' => true, 'target_wa' => $wa_num_login . '@s.whatsapp.net', 'otp_message' => "🔐 *OTP MILASTORE*\n\nKode OTP: *{$otp}*", 'reply_message' => "⏳    OTP terkirim ke WA *{$indo_num_login}*.\n\nBalas dengan *6 digit angka OTP*."]);
            }

            // --- START MASTER GATEWAY V8 (REPLACING OLD LOGIN BLOCK) ---
            if (!$user) {
                try {
                    $pesanAsli = request('pesan') ?? request('message') ?? request('text') ?? request('msg') ?? '';
                    if (is_array($pesanAsli)) { $pesanAsli = $pesanAsli['text'] ?? $pesanAsli['message'] ?? ''; }
                    if (empty($pesanAsli) && is_array(request('data'))) { $pesanAsli = request('data')['message'] ?? request('data')['text'] ?? ''; }
                    $pesanBersih = trim((string)$pesanAsli);
                    $parts = explode(' ', $pesanBersih);
                    $cmdAi = ltrim(strtolower($parts[0] ?? ''), '.');
                    $no_wa = request('nomor') ?? request('sender') ?? request('from') ?? request('phone') ?? request('whatsapp') ?? '';
                    if (empty($no_wa) && is_array(request('data'))) { $no_wa = request('data')['sender'] ?? request('data')['from'] ?? request('data')['phone'] ?? ''; }
                    $no_wa = preg_replace('/[^0-9]/', '', str_replace('@c.us', '', (string)$no_wa));

                    if (str_starts_with(strtolower($pesanBersih), '.login')) {
                        return response()->json(['status' => false, 'message' => "❌     *SESI BELUM TERHUBUNG*\n\nSilakan login terlebih dahulu.\nKetik: `.login [NOMOR_HP]`\nContoh: `.login 08123456789`"]);
                    }

                    if ($cmdAi === 'daftar' || $cmdAi === 'register') {
                        if (count($parts) < 3) {
                            return response()->json(['status' => true, 'message' => "✨  *MilaStore* ✨ \n━━━━━━━━━━━━━━━━━━━━\n\nHalo Kak! 👋\nNomor Anda belum terdaftar di sistem kami.\n\nSilakan pilih salah satu opsi di bawah ini:\n\n1️⃣ *PENGGUNA BARU (DAFTAR)*\nKetik: *.daftar email_anda@gmail.com Nama Toko*\n_(Contoh: .daftar bosku@gmail.com Sultan Cell)_\n\n2️⃣ *PENGGUNA LAMA (PINDAH WA)*\nKetik: *.login*"]);
                        }
                    }
                } catch (\Throwable $e) {
                    // JIKA ERROR, KIRIMKAN DETAIL ERROR LANGSUNG KE CHAT WHATSAPP USER
                    return response()->json(['status' => true, 'message' => "🚨 *WA BOT DEBUG ERROR* 🚨\n\n💬 *Pesan Error:* " . $e->getMessage() . "\n📍 *File:* " . $e->getFile() . "\n🔢 *Baris:* " . $e->getLine() . "\n\n💡 _Kirim pesan ini ke AI untuk diperbaiki kolom databasenya!_"]);   
                }
            }

            if ($user && $user->status === 'pending') {
                $pesanAsli = request('pesan') ?? request('message') ?? request('text') ?? request('msg') ?? '';
                if (is_array($pesanAsli)) { $pesanAsli = $pesanAsli['text'] ?? $pesanAsli['message'] ?? ''; }
                $parts = explode(' ', trim((string)$pesanAsli));
                $cmdAi = ltrim(strtolower($parts[0] ?? ''), '.');
                if ($cmdAi === 'verifikasi' && isset($parts[1]) && $parts[1] == $user->otp_code) {
                    $passWeb = $parts[2] ?? '123456';
                    \Illuminate\Support\Facades\DB::table('users')->where('id', $user->id)->update(['status' => 'aktif', 'otp_code' => null, 'wa_verified_at' => date('Y-m-d H:i:s')]);
                    return response()->json(['status' => true, 'message' => "🎉 *VERIFIKASI AKUN BERHASIL!* 🎉\nSelamat bergabung, *{$user->name}*!\n\n🌐 *Akses Web:* https://milastore.cloud/login\n📧 *Email:* {$user->email}\n🔑 *Pass:* `$passWeb`\n\nKetik *.menu* untuk akses katalog bot!"]);
                }
                return response()->json(['status' => true, 'message' => "⚠️ *AKUN MENUNGGU AKTIVASI*\n\nHarap verifikasi OTP Anda terlebih dahulu.\nKetik: `.verifikasi {$user->otp_code}`"]);
            }

            $pesanAsliAktif = request('pesan') ?? request('message') ?? request('text') ?? request('msg') ?? '';
            if (is_array($pesanAsliAktif)) { $pesanAsliAktif = $pesanAsliAktif['text'] ?? $pesanAsliAktif['message'] ?? ''; }
            if (empty($pesanAsliAktif) && is_array(request('data'))) { $pesanAsliAktif = request('data')['message'] ?? request('data')['text'] ?? ''; }
            $pesanAktifBersih = trim((string)$pesanAsliAktif);
            $partsAktif = explode(' ', $pesanAktifBersih);
            $cmdAiAktif = ltrim(strtolower($partsAktif[0] ?? ''), '.');
            $isDot = str_starts_with($pesanAktifBersih, '.');
            $sysCmds = ['depo', 'deposit', 'order', 'beli', 'batal', 'menu', 'main_menu', 'menu_xla', 'ping', 'help', 'saldo', 'cek', 'tagihan', 'login'];

            if ($user && $pesanAktifBersih !== '' && (!in_array($cmdAiAktif, $sysCmds) || (in_array($cmdAiAktif, $sysCmds) && !$isDot))) {
                if (!preg_match('/^[0-9]{4,6}$/', $pesanAktifBersih)) {
                    $key = null /* AI KILLED */;
                    if (!empty($key)) {
                        try {
                            $res = \Illuminate\Support\Facades\Http::timeout(10)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $key, [
                                'contents' => [['parts' => [['text' => "Kamu Mila AI, CS MilaStore. User '{$user->name}' chat: '$pesanAktifBersih'. Jawab ramah & singkat. Arahkan pakai titik (.) untuk transaksi contoh .menu, .order."]]]]
                            ]);
                            $aiResp = $res->json()['candidates'][0]['content']['parts'][0]['text'] ?? null;
                            if ($aiResp) return response()->json(['status' => true, 'message' => "🤖 *Mila AI - MILASTORE*\n\n" . trim($aiResp)]);
                        } catch (\Exception $e) {}
                    }
                }
            }
            // --- END MASTER GATEWAY V8 ---
            // === LOAD DATA ===
            $akrabXla = DB::table('layanan_khfy')->where('kode_layanan', 'like', 'XLA%')->orderBy('harga_jual', 'asc')->get();
            $akrabXda = DB::table('layanan_kaje')->where(fn($q) => $q->where('kode_layanan', 'like', 'KDA%')->orWhere('kode_layanan', 'like', 'PDA%'))->get()->map(function($item) { preg_match('/(\d+)-/i', $item->nama_layanan, $matches); $item->size = isset($matches[1]) ? (int)$matches[1] : 999; return $item; })->sortBy(function($item) { return sprintf('%03d-%010d', $item->size, $item->harga_jual); })->values();

            $adamXda = DB::table('ppob_products')->select('id', 'product_code as kode_layanan', 'product_name as nama_layanan', 'price_sell as harga_jual', 'description as deskripsi', 'is_active as status')->where('provider_name', 'ADAMMEDIA')->where('product_code', 'like', '%XDA%')->orderBy('price_sell', 'asc')->get();
            $adamXclp = DB::table('ppob_products')->select('id', 'product_code as kode_layanan', 'product_name as nama_layanan', 'price_sell as harga_jual', 'description as deskripsi', 'is_active as status')->where('provider_name', 'ADAMMEDIA')->where('product_code', 'like', '%XCLP%')->orderBy('price_sell', 'asc')->get();
            $adamProducts = $adamXda->concat($adamXclp)->values();   

            $dataDigi = DB::table('layanan')->where(function($q) { $q->where('nama_layanan', 'LIKE', '%edukasi%')->orWhere('nama_layanan', 'LIKE', '%conference%'); })->orderBy('harga_jual', 'asc')->get();
            $aktifDigi = DB::table('layanan')->where('nama_layanan', 'LIKE', '%masa aktif%')->orderBy('harga_jual', 'asc')->get();

            if ($command === 'main_menu') {
                $teks = "*M I L A S T O R E*\n━━━━━━━━━━━━━━━━━━━━━━\n👤 *Akun:* {$user->name}\n💳 *Saldo:* Rp " . number_format($user->saldo, 0, ',', '.') . "\n━━━━━━━━━━━━━━━━━━━━━━\n\n*» KATEGORI PRODUK «*\n*[ 1 ]* ⚡  *AKRAB XL*\n*[ 2 ]* 🚀 *AKRAB V2*\n*[ 3 ]* 🔥 *AKRAB XDA*\n*[ 4 ]* 🌐 *PAKET DATA* (Edu/Conf)\n*[ 5 ]* ⏳  *MASA AKTIF KARTU*\n\n*» PINTASAN CEPAT «*\n*+* `.depo`  ➔ Isi Saldo\n*-* `.batal` ➔ Batal Tiket\n\n_Balas dengan angka *1-5* untuk melihat katalog._";
                return response()->json(['status' => true, 'message' => $teks]);
            }

            if ($command === 'menu_xla') {
                $stockKhfy = []; try { $res = Http::timeout(3)->get('https://panel.khfy-store.com/api_v3/cek_stock_akrab'); if ($res->successful()) { foreach ($res->json()['data'] as $s) { $stockKhfy[$s['type']] = $s['sisa_slot']; } } } catch (\Exception $e) { }
                $teks = "┌──[ 💠 *XL AKRAB (XLA)* ]──\n\n";
                foreach ($akrabXla as $i => $p) { $sisa = $stockKhfy[$p->kode_layanan] ?? '0'; $stIcon = ($sisa > 0) ? '🟢' : '🔴'; $desc = $this->getDesc($p); $teks .= " *[ X".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "* | 📦 $stIcon *$sisa*{$desc}\n\n"; }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡    *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order X1 08123...`\n\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => $teks]);
            }

            if ($command === 'menu_xda') {
                $stockKaje = []; try { $kaje = app(KajeService::class); $resK = $kaje->getStock(); if (isset($resK['success']) && $resK['success'] == true) { foreach ($resK['data'] as $p) { $stockKaje[$p['code'] ?? $p['kode_layanan']] = $p['stock'] ?? $p['stok'] ?? 0; } } } catch (\Exception $e) { }
                $teks = "┌──[ 💠 *AMIFI (KDA/PDA)* ]──\n\n";
                foreach ($akrabXda as $i => $p) { $sisa = $stockKaje[$p->kode_layanan] ?? $p->stok ?? 0; $stIcon = ($sisa > 0) ? '🟢' : '🔴'; $desc = $this->getDesc($p); $teks .= " *[ A".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "* | 📦 $stIcon *$sisa*{$desc}\n\n"; }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡    *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order A1 08123...`\n\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => $teks]);
            }

            // MENU V8 VIP
            if ($command === 'menu_pln') {
                $stockV8 = [];
                try {
                    $key = env('ADAMMEDIA_API_KEY');
                    if (empty($key) && file_exists(base_path('.env'))) {
                        preg_match('/ADAMMEDIA_API_KEY=(.*)/', file_get_contents(base_path('.env')), $matches);
                        $key = trim($matches[1] ?? '');
                    }

                    $reqReg = Http::withHeaders(['x-api-key' => $key])->timeout(10)->get("https://juraganxl.my.id/api/regulers");
                    if ($reqReg->successful() && is_array($reqReg->json())) {
                        foreach ($reqReg->json() as $i) {
                            if (isset($i['config'])) {
                                $isOpen = $i['open'] ?? true;
                                $stockV8[strtoupper($i['config'])] = $isOpen ? (int)($i['count'] ?? 0) : 0;
                            }
                        }
                    }

                    $reqCir = Http::withHeaders(['x-api-key' => $key])->timeout(10)->get("https://juraganxl.my.id/api/circles");
                    if ($reqCir->successful() && is_array($reqCir->json())) {
                        foreach ($reqCir->json() as $i) {
                            if (isset($i['config'])) {
                                $isOpen = $i['open'] ?? true;
                                $stockV8[strtoupper($i['config'])] = $isOpen ? (int)($i['count'] ?? 0) : 0;
                            }
                        }
                    }
                } catch (\Exception $e) { }

                $teks = "*AKRAB XDA*\n━━━━━━━━━━━━━━━━━━━━━━\n\n";   
                foreach ($adamXda as $i => $p) {
                    $sisa = $stockV8[strtoupper($p->kode_layanan)] ?? 0;
                    $stIcon = ($sisa > 0) ? '🟢' : '🔴';
                    $desc = $this->getDesc($p);
                    $teks .= "*[ V".($i+1)." ]* {$p->nama_layanan}\n ↳ 🏷️ *Rp " . number_format($p->harga_jual) . "* | 📦 $stIcon *$sisa*{$desc}\n\n";
                }

                $teks .= "━━━━━━━━━━━━━━━━━━━━━━\n*» CARA ORDER «*\nKetik: `.order [KODE] [NO_HP]`\nContoh: `.order V1 0812345...`\n\n_Ketik *p* untuk kembali ke Menu Utama._";
                return response()->json(['status' => true, 'message' => $teks]);
            }

            if ($command === 'menu_data') {
                $teks = "┌──[ 🌐 *PAKET DATA* ]──\n\n";
                if($dataDigi->isEmpty()) { $teks .= " _(Produk sedang kosong)_\n\n"; }
                else { foreach ($dataDigi as $i => $p) { $desc = $this->getDesc($p); $teks .= " *[ DT".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "*{$desc}\n\n"; } }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡    *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order DT1 0812...`\n\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => $teks]);
            }

            if ($command === 'menu_aktif') {
                $teks = "┌──[ ⏳    *MASA AKTIF KARTU* ]──\n\n";
                if($aktifDigi->isEmpty()) { $teks .= " _(Produk sedang kosong)_\n\n"; }
                else { foreach ($aktifDigi as $i => $p) { $desc = $this->getDesc($p); $teks .= " *[ M".($i+1)." ]* {$p->nama_layanan}\n  └ 🏷️ *Rp " . number_format($p->harga_jual) . "*{$desc}\n\n"; } }
                $teks .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚡    *ORDER:* `.order [KODE] [NO_HP]`\nContoh: `.order M1 0812...`\n\n↪️ _Ketik *p* untuk kembali_";
                return response()->json(['status' => true, 'message' => $teks]);
            }

            if ($command === 'deposit_create') {
                $rawNominal = strtolower(trim($request->nominal ?? ''));
                if (str_ends_with($rawNominal, 'k')) { $nominal = (int)str_replace('k', '', $rawNominal) * 1000; }
                else { $nominal = (int)preg_replace('/[^0-9]/', '', $rawNominal); }

                $metode_idx = (int)$request->metode - 1;
                $all_payments = DB::table('payment_settings')->get();
                $payments = []; foreach($all_payments as $p) { if ($p->metode !== 'QRIS') { $payments[] = $p; } }
                $cek_pending = DB::table('deposits')->where('user_id', $user->id)->where('status', 'Pending')->first();

                if ($cek_pending) {
                    $pay_active = DB::table('payment_settings')->where('metode', $cek_pending->metode)->first();
                    $nominal_pending = $cek_pending->total_bayar;
                    $is_new = false;
                } else {
                    if ($nominal < 1000 || !isset($payments[$metode_idx])) {
                        $msg = "┌──[ 💳 *ISI SALDO MILASTORE* ]──\n\n✨    *CARA CERDAS & CEPAT:*\nCukup ketik salah satu *Kode Metode* di bawah ini, lalu ikuti panduan bot.\n\n🏦 *KODE METODE TERSEDIA:*\n";
                        foreach($payments as $k => $v) { $icon = str_starts_with($v->metode, 'QRIS') ? '📱' : '🏦'; $msg .= " 👉 *D".($k+1)."* ➔ $icon " . str_replace('_', ' ', $v->metode) . "\n"; }
                        $msg .= "\n💬 *Contoh Penggunaan:*\nKetik *D1* lalu kirim, bot akan menanyakan nominal kepada Anda.\n──────────────────────\n🛠️ *Cara Manual Lama:*\n`.depo [NOMINAL] [KODE ANGKA]`\nContoh:\n`.depo 50k 1`\n└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈";
                        return response()->json(['status' => false, 'message' => $msg]);
                    }
                    $pay_active = $payments[$metode_idx];
                    $is_new = true;
                }
                if ($is_new) {
                    do { $kode_unik = rand(10, 999); $total_bayar = $nominal + $kode_unik; $cek_dobel = DB::table("deposits")->where("status", "Pending")->where("total_bayar", $total_bayar)->exists(); } while ($cek_dobel);
                    DB::table("deposits")->insert(["user_id"=>$user->id,"metode"=>$pay_active->metode,"amount"=>$nominal,"kode_unik"=>$kode_unik,"total_bayar"=>$total_bayar,"status"=>"Pending","created_at"=>now(),"updated_at"=>now()]);
                } else { $total_bayar = $nominal_pending; }

                $msg = ($is_new) ? "💳 *TIKET DEPOSIT BERHASIL DIBUAT!*\n" : "⏳    *MOHON SELESAIKAN PEMBAYARAN*\n";
                $msg .= "┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n│ 🏦 Metode: *" . str_replace('_', ' ', $pay_active->metode) . "*\n";
                if ($pay_active) { $msg .= "│ 👤 Nama: *{$pay_active->atas_nama}*\n"; if (!str_starts_with($pay_active->metode, 'QRIS')) { $msg .= "│ 🔢 Rek: *{$pay_active->nomor}*\n"; } }
                $msg .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\nSilakan transfer TEPAT SEBESAR:\n👉 *Rp " . number_format($total_bayar, 0, ',', '.') . "* 👈\n\n⚡    _Sistem deteksi otomatis (1-5 Menit)._\n";
                if ($pay_active->metode === 'SEABANK') { $msg .= "🚨 *PENTING:* Transfer WAJIB dari sesama rekening SeaBank agar otomatis.\n\n"; } else { $msg .= "⚠️ _Wajib transfer hingga 3 digit terakhir._\n\n"; }
                $msg .= "⛔    _Ganti nominal? Ketik: `.batal`_";

                $res_data = ['status' => true];
                if ($pay_active && str_starts_with($pay_active->metode, 'QRIS')) {
                    $dq = $this->makeDynamicQris($pay_active->nomor, $total_bayar);
                    $res_data['image_url'] = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" . urlencode($dq);
                    $msg = str_replace("👉 *Rp", "⚠️ _Scan Barcode di atas! Nominal sudah otomatis._\n\n👉 *Rp", $msg);
                }
                $res_data['message'] = $msg;
                return response()->json($res_data);
            }

            if ($command === 'deposit_cancel') {
                $p = DB::table('deposits')->where('user_id', $user->id)->where('status', 'Pending')->first();
                if (!$p) return response()->json(['status'=>false, 'message'=>"❌    *TIDAK ADA TIKET PENDING.*\nSaldo Anda aman."]);
                DB::table('deposits')->where('id', $p->id)->update(['status'=>'Gagal', 'updated_at'=>now()]);
                return response()->json(['status'=>true, 'message'=>"✅    *TIKET BERHASIL DIBATALKAN.*\n\nTiket sebesar *Rp ".number_format($p->total_bayar, 0, ',', '.')."* telah dibatalkan.\nSilakan ketik `.depo` untuk membuat tiket baru."]);
            }

            // ==========================================
            // 🛡️ ORDER EKSEKUSI
            // ==========================================
            if ($command === 'order_akrab' || $command === 'war_sikat') {
                $kode_input = strtoupper($request->kode ?? '');
                $selected = null;

                if (preg_match('/^X(\d+)$/', $kode_input, $m)) { $selected = $akrabXla->values()->get((int)$m[1] - 1); }
                elseif (preg_match('/^A(\d+)$/', $kode_input, $m)) { $selected = $akrabXda->values()->get((int)$m[1] - 1); }
                elseif (preg_match('/^V(\d+)$/', $kode_input, $m)) { $selected = $adamProducts->get((int)$m[1] - 1); }
                elseif (preg_match('/^DT(\d+)$/', $kode_input, $m)) { $selected = $dataDigi->values()->get((int)$m[1] - 1); }
                elseif (preg_match('/^M(\d+)$/', $kode_input, $m)) { $selected = $aktifDigi->values()->get((int)$m[1] - 1); }

                if (!$selected) return response()->json(['status' => false, 'message' => "❌    *PRODUK TIDAK DITEMUKAN*"]);

                $isKaje = DB::table('layanan_kaje')->where('kode_layanan', $selected->kode_layanan)->exists();
                $isDigi = DB::table('layanan')->where('kode_layanan', $selected->kode_layanan)->exists();
                $isAdam = DB::table('ppob_products')->where('provider_name', 'ADAMMEDIA')->where('product_code', $selected->kode_layanan)->exists();

                $numbers = array_values(array_unique(array_filter(preg_split('/[\r\n, ]+/', $request->target), fn($n) => strlen(preg_replace('/[^0-9]/', '', $n)) >= 5)));
                $qty = count($numbers);
                $total = $selected->harga_jual * $qty;

                DB::beginTransaction();
                try {
                    $dbUser = DB::table('users')->where('id', $user->id)->lockForUpdate()->first();
                    if ($dbUser->saldo < $total) { DB::rollBack(); return response()->json(['status' => false, 'message' => "❌    *SALDO TIDAK MENCUKUPI*\nSilakan isi saldo terlebih dahulu."]); }
                    if ($command === 'war_sikat' && ($isKaje || $isDigi)) { DB::rollBack(); return response()->json(['status' => false, 'message' => "❌    *PRODUK INI HANYA MENDUKUNG .ORDER*"]); }
                    DB::table('users')->where('id', $user->id)->decrement('saldo', $total);
                    DB::commit();
                    $sisa_saldo_realtime = $dbUser->saldo - $total;
                } catch (\Exception $e) { DB::rollBack(); return response()->json(['status' => false, 'message' => '❌    *SYSTEM ERROR LOCKING SALDO*']); }

                if ($command === 'war_sikat') {
                    foreach($numbers as $index => $tjn) {
                        $ref = 'POX-' . time() . '-' . $index;
                        DB::table('antrian_po')->insert(['ref_id'=>$ref,'username'=>$user->name,'kode_produk'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Menunggu','prioritas'=>$this->getPrioritas($selected->kode_layanan),'tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]);
                        DB::table('transaksi')->insert(['username'=>$user->name,'ref_id'=>$ref,'kode_layanan'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Pending','sn'=>'Antrean WAR','tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]);
                    }
                    $msg = "⚔️ *SISTEM WAR DIAKTIFKAN!* ⚔️\n╭━━━━━━━━━━━━━━━━━━━━━━\n│ 📦 Produk: *{$selected->nama_layanan}*\n│ 🎯 Target: *$qty Nomor*\n└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n_Sistem akan menembak secara otomatis saat stok tersedia!_";
                    return response()->json(['status' => true, 'message' => $msg . "\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')]);
                } else {
                    $berhasil = 0; $gagal = 0;
                    foreach($numbers as $tjn) {
                        $refId = ($isKaje ? "INV-" : ($isDigi ? "DIGI-" : "TRX-")) . date("YmdHis") . rand(100,999);
                        $is_success = false; $sn_msg = '';

                        try {
                            if ($isKaje) {
                                $kaje = app(KajeService::class); $res = $kaje->placeOrder($tjn, $selected->kode_layanan, $refId);
                                if (isset($res['success']) && $res['success'] == true) { $is_success = true; $sn_msg = $res['data']['trx_id']??'KAJE'; }
                            } elseif ($isDigi) {
                                $digi = app(DigiflazzService::class); $res = $digi->placeOrder($refId, $tjn, $selected->kode_layanan);
                                if (isset($res['success']) && $res['success'] == true) { $is_success = true; $sn_msg = 'API Digiflazz'; }
                            } elseif ($isAdam) {
                                try {
                                    $adam = app(AdammediaService::class);
                                    $res = $adam->placeOrder($refId, $tjn, $selected->kode_layanan); 

                                    if (isset($res['status']) && in_array($res['status'], ['SUKSES', 'PROSES'])) {
                                        $is_success = true;
                                        $sn_msg = $res['sn'] ?? 'VIP-V8';
                                    } else {
                                        $is_success = false;
                                        $sn_msg = $res['msg'] ?? 'Gagal Server VIP';
                                    }
                                } catch (\Exception $e) {
                                    $is_success = false;
                                    $sn_msg = 'Timeout Server VIP';
                                }
                            } else {
                                $res = Http::timeout(10)->get('https://panel.khfy-store.com/api_v2/trx', ['api_key'=>env('KHFY_API_KEY'), 'produk'=>$selected->kode_layanan, 'tujuan'=>$tjn, 'reff_id'=>$refId]);
                                if (!isset($res->json()['ok']) || $res->json()['ok'] !== false) { $is_success = true; $sn_msg = 'Antrian Khfy'; }
                            }
                        } catch (\Exception $e) { $is_success = true; $sn_msg = 'Proses Latar Belakang (Timeout)'; }

                        if ($is_success) {
                            DB::table('transaksi')->insert(['username'=>$user->name,'ref_id'=>$refId,'kode_layanan'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Proses','sn'=>$sn_msg,'tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]);
                            $berhasil++;
                        } else {
                            DB::table('transaksi')->insert(['username'=>$user->name,'ref_id'=>$refId,'kode_layanan'=>$selected->kode_layanan,'tujuan'=>$tjn,'harga'=>$selected->harga_jual,'status'=>'Gagal','sn'=>$sn_msg,'tanggal'=>now(),'created_at'=>now(),'updated_at'=>now()]);
                            DB::table('users')->where('id', $user->id)->increment('saldo', $selected->harga_jual);
                            $gagal++; $sisa_saldo_realtime += $selected->harga_jual;
                        }
                    }
                    if ($berhasil > 0) {
                        $msg = "🚀 *ORDER BERHASIL DIPROSES!*\n╭━━━━━━━━━━━━━━━━━━━━━━\n│ 📦 Produk: *{$selected->nama_layanan}*\n│ ✅    Berhasil: *$berhasil*\n";
                        if ($gagal > 0) $msg .= "│ ❌    Gagal/Refund: *$gagal*\n";
                        $msg .= "└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n_Mohon tunggu, pesanan sedang dikirim._";
                        return response()->json(['status' => true, 'message' => $msg . "\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')]);
                    } else {
                        return response()->json(['status'=>false, 'message'=>"❌    *GAGAL PROSES SERVER PUSAT*\nSaldo telah dikembalikan sepenuhnya ke akun Anda.\n\n💳 *Sisa Saldo:* Rp " . number_format($sisa_saldo_realtime, 0, ',', '.')]);
                    }
                }
            }
        } catch (\Throwable $e) {
            return response()->json(['status' => false, 'message' => "🚨 *FATAL ERROR MILASTORE*\nError: " . $e->getMessage()]);
        }
    }
}
