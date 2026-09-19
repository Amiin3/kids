<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Services\TelegramService;

class WebhookKhfyController extends Controller
{
    public function handle(Request $request)
    {
        $rawInput = file_get_contents('php://input');
        $message  = $_GET['message'] ?? $_POST['message'] ?? $request->input('message') ?? null;

        // 🛡️ VAKSIN ANTI ERROR 500 (PHP 8 Array Offset Fix)
        if (!$message && $rawInput) {
            $json = json_decode($rawInput, true);
            // Pastikan hasil decode adalah array sebelum diakses
            $message = (is_array($json) && isset($json['message'])) ? $json['message'] : $rawInput;
        }

        // Jika dites via BROWSER (Data kosong), beri balasan cantik 200 OK
        if (empty($message)) {
            return response()->json([
                'status' => true, 
                'msg' => '✅ MILASTORE KHFY WEBHOOK AKTIF & MENUNGGU PAYLOAD'
            ], 200);
        }

        // 🚀 REGEX SAKTI KHFY V2 (Struktur Asli Tidak Dirubah)
        $pattern = '~RC=(?P<reffid>[A-Za-z0-9-]+)\s+TrxID=(?P<trxid>\d+)\s+(?P<produk>[A-Z0-9]+)\.(?P<tujuan>\d+)\s+(?P<status_text>[A-Za-z]+)\s*(?P<keterangan>.+?)(?:\s+Saldo[\s\S]*?)?(?:\bresult=(?P<status_code>\d+))?\s*>?$~is';

        if (preg_match($pattern, $message, $m)) {
            $ref_id_lokal = $m['reffid'];
            $status_text  = strtoupper($m['status_text']);
            $keterangan   = trim($m['keterangan']);
            $produk       = $m['produk'];
            $tujuan       = $m['tujuan'];
            $trxid_pusat  = $m['trxid'] ?? '';

            $status_code = null;
            if (isset($m['status_code']) && $m['status_code'] !== '') {
                $status_code = (int)$m['status_code'];
            } else {
                if (strpos($status_text, 'SUKSES') !== false) $status_code = 0;
                elseif (strpos($status_text, 'GAGAL') !== false || strpos($status_text, 'BATAL') !== false) $status_code = 1;
            }

            try {
                DB::beginTransaction();
                $trx = DB::table('transaksi')->where('ref_id', $ref_id_lokal)->lockForUpdate()->first();

                // FALLBACK JIKA REF_ID TIDAK KETEMU (Mencari di antrian)
                if (!$trx) {
                    $trx = DB::table('transaksi')
                        ->where('tujuan', $tujuan)
                        ->where('kode_layanan', $produk)
                        ->whereIn('status', ['Pending', 'Proses', 'Proses_API', 'Menunggu'])
                        ->orderBy('id', 'desc')->lockForUpdate()->first();
                }

                if (!$trx) {
                    DB::rollBack();
                    return response()->json(['status' => false, 'msg' => 'Transaksi tidak ditemukan']);
                }

                $real_ref_id = $trx->ref_id;
                if (in_array($trx->status, ['Sukses', 'Gagal'])) {
                    DB::rollBack();
                    return response()->json(['status' => true, 'msg' => 'Sudah diproses']);
                }

                // ==========================================================
                // 🛡️ SENSOR RAHASIA DAPUR (MASKING PESAN ERROR)
                // ==========================================================
                $safeKeterangan = $keterangan;
                $ket_lower = strtolower($keterangan);

                // 🚀 PERBAIKAN LOGIKA UTAMA V12: Deteksi Stok Habis & HTTP Client Response Error teknis
                $is_stok_habis = (
                    strpos($ket_lower, 'habis') !== false ||
                    strpos($ket_lower, 'kosong') !== false ||
                    strpos($ket_lower, 'gangguan') !== false ||
                    strpos($ket_lower, 'err') !== false ||
                    strpos($ket_lower, 'error') !== false ||
                    strpos($ket_lower, 'client') !== false ||
                    strpos($ket_lower, 'body') !== false ||
                    strpos($ket_lower, 'http') !== false ||
                    strpos($ket_lower, 'timeout') !== false
                );

                if ($status_code === 1) {
                    if (strpos($ket_lower, 'nomor') !== false || strpos($ket_lower, 'tujuan') !== false || strpos($ket_lower, 'salah') !== false) {
                        $safeKeterangan = "Nomor tujuan tidak valid.";
                    } elseif ($is_stok_habis) {
                        $safeKeterangan = "Stok produk sedang limit/kosong.";
                    } else {
                        $safeKeterangan = "Gangguan server pusat, transaksi masuk antrean PO.";
                    }
                }

                // ================== PROSES UPDATE STATUS ==================
                $final_status = "Pending";
                if ($status_code === 0) {
                    // 🟢 SUKSES
                    DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Sukses', 'sn' => $keterangan, 'ref_id_provider' => $trxid_pusat, 'wa_notif' => 0, 'updated_at' => now()]);
                    DB::table('antrian_po')->where('ref_id', $real_ref_id)->update(['status' => 'Sukses', 'updated_at' => now()]);
                    $final_status = "Sukses";
                } elseif ($status_code === 1) {
                    // 🔴 GAGAL / BATAL
                    $is_war_po = DB::table('antrian_po')->where('ref_id', $real_ref_id)->first();

                    if ($is_war_po && $is_stok_habis) {
                        // 🤖 ROBOT SNIPER RETRY LOGIC (Termasuk HTTP_CLIENT_RESPONSE_BODY_ERR masuk sini)
                        $fresh_ref = "WAR-" . date("YmdHis") . "-" . rand(100, 999);
                        DB::table('transaksi')->where('id', $trx->id)->update(['ref_id' => $fresh_ref, 'status' => 'Pending', 'sn' => 'Menunggu Stok (Retry War)', 'updated_at' => now()]);
                        DB::table('antrian_po')->where('id', $is_war_po->id)->update(['ref_id' => $fresh_ref, 'status' => 'Menunggu', 'updated_at' => now()]);
                        $final_status = "Retry";
                    } else {
                        // ⛔ GAGAL NORMAL & REFUND (Hanya jika nomor benar-benar salah/cacat)
                        DB::table('transaksi')->where('id', $trx->id)->update(['status' => 'Gagal', 'sn' => $safeKeterangan, 'ref_id_provider' => $trxid_pusat, 'wa_notif' => 0, 'updated_at' => now()]);
                        DB::table('antrian_po')->where('ref_id', $real_ref_id)->update(['status' => 'Gagal', 'updated_at' => now()]);

                        // Benteng Gembok Refund Real-Time
                        $user = DB::table('users')->where('name', $trx->username)->lockForUpdate()->first();
                        if ($user) {
                             DB::table('users')->where('id', $user->id)->increment('saldo', $trx->harga);
                        }
                    }
                }
                
                DB::commit();
                return response()->json(['status' => true, 'msg' => 'Proses selesai']);
                
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("KHFY DB ERROR: " . $e->getMessage());
                return response()->json(['status' => false, 'msg' => 'System error']);
            }
        }

        return response()->json(['status' => false, 'msg' => 'Format tidak dikenali']);
    }
}
