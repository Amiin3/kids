<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OkeconnectService
{
    protected $memberId;
    protected $pin;
    protected $password;

    public function __construct() {
        // Mengambil kredensial dari brankas .env
        $this->memberId = env('OKECONNECT_MEMBER_ID');
        $this->pin = env('OKECONNECT_PIN');
        $this->password = env('OKECONNECT_PASSWORD');
    }

    public function placeOrder($refId, $tujuan, $kodeLayanan) {
        try {
            // URL Tembakan Transaksi H2H Resmi Okeconnect
            $url = "https://h2h.okeconnect.com/trx";
            
            // Parameter disesuaikan 100% dengan dokumentasi
            $response = Http::timeout(60)->get($url, [
                'memberID' => $this->memberId,
                'pin'      => $this->pin,
                'password' => $this->password,
                'product'  => $kodeLayanan,
                'dest'     => $tujuan,
                'refID'    => $refId,
            ]);
            
            $body = $response->body();
            Log::info('[OKECONNECT TRX]', ['ref' => $refId, 'url' => $url, 'response' => $body]);
            
            // 1. Cek jika suatu saat mereka mengembalikan format JSON
            $result = json_decode($body, true);
            if (is_array($result)) {
                $status = strtolower($result['status'] ?? 'pending');
                if (in_array($status, ['gagal', 'failed', 'error', '3', '4'])) {
                    return ['success' => false, 'message' => $result['note'] ?? $result['message'] ?? 'Ditolak Pusat', 'data' => ['status' => 'Gagal']];
                }
                return ['success' => true, 'message' => 'Pesanan diterima', 'data' => ['status' => $status === 'sukses' ? 'Sukses' : 'Pending', 'sn' => $result['sn'] ?? '-']];
            }
            
            // 2. Mesin Pembaca Teks Asli (Parsing HTML/Plain Text dari Dokumen)
            $bodyLower = strtolower($body);
            
            // Deteksi Kunci Sukses / Diproses (Contoh: "akan diproses. Saldo 279.655")
            if (str_contains($bodyLower, 'akan diproses') || str_contains($bodyLower, 'berhasil') || str_contains($bodyLower, 'sukses')) {
                // Berusaha menangkap ID Transaksi dari teks balasan (Contoh: T#210286229)
                $sn = '-';
                if (preg_match('/T#(\d+)/i', $body, $matches)) {
                    $sn = 'T#' . $matches[1];
                }
                return ['success' => true, 'message' => substr($body, 0, 100), 'data' => ['status' => 'Pending', 'sn' => $sn]];
            }
            
            // Deteksi Kunci Gagal (Saldo kurang, format salah, gangguan)
            if (str_contains($bodyLower, 'gagal') || str_contains($bodyLower, 'ditolak') || str_contains($bodyLower, 'saldo tidak cukup') || str_contains($bodyLower, 'salah') || str_contains($bodyLower, 'tidak terdaftar')) {
                return ['success' => false, 'message' => substr($body, 0, 150), 'data' => ['status' => 'Gagal']];
            }
            
            // Fallback (Anggap pending jika balasan tidak diketahui polanya, agar saldo member aman)
            return ['success' => true, 'message' => 'Pesanan dikirim ke pusat', 'data' => ['status' => 'Pending', 'sn' => '-']];

        } catch (\Exception $e) {
            Log::error('[OKECONNECT ERROR] ' . $e->getMessage());
            // Jika koneksi RTO / Timeout, kita anggap Pending
            return ['success' => true, 'message' => 'Timeout, pesanan diproses di latar belakang', 'data' => ['status' => 'Pending', 'sn' => '-']];
        }
    }
}
