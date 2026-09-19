<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class WarEngineController extends Controller
{
    public function warExecute(Request $request) {
        if (Cache::get('khfy_sniper_mode', 'on') === 'off') {
            return response()->json(["status" => "idle", "log" => "💤 RADAR NONAKTIF."]);
        }

        set_time_limit(30);
        $db = DB::connection();
        $khfy_url = rtrim(env("KHFY_URL", "https://panel.khfy-store.com/api_v2"), '/');
        $api_key = trim(env("KHFY_API_KEY"));
        $logs = [];

        $antrean_tunggu = $db->table("antrian_po")->where("status", "Menunggu")->orderBy("prioritas", "asc")->orderBy("id", "asc")->get();

        if ($antrean_tunggu->isEmpty()) {
            return response()->json(["status" => "idle", "log" => "📡 RADAR BERSIH. Tidak ada antrean PO."]);
        }

        $kode_dicari = $antrean_tunggu->pluck('kode_produk')->unique()->toArray();
        
        $produk_ready = Cache::remember('khfy_ready_stock_cache', 3, function () use ($kode_dicari) {
            $ready = [];
            try {
                $res_v3 = Http::withoutVerifying()->withUserAgent('Mozilla/5.0')->connectTimeout(3)->timeout(5)
                    ->get("https://panel.khfy-store.com/api_v3/cek_stock_akrab");
                if ($res_v3->successful()) {
                    $data = $res_v3->json()['data'] ?? [];
                    foreach ($data as $p) {
                        $k = $p['type'] ?? '';
                        $stok = (int)($p['sisa_slot'] ?? 0);
                        if (in_array($k, $kode_dicari) && $stok > 0) {
                            $ready[] = $k;
                        }
                    }
                }
            } catch (\Exception $e) {}
            return $ready;
        });

        if (empty($produk_ready)) {
            return response()->json(["status" => "info", "log" => "💤 [RADAR] Stok pusat kosong. Standby..."]);
        }

        $pending_trx = $db->table("antrian_po")->where("status", "Proses_API")->limit(2)->get();
        $active_count = $pending_trx->count();

        foreach ($pending_trx as $item) {
            try {
                $res_cek = Http::withoutVerifying()->connectTimeout(3)->timeout(5)
                    ->get("{$khfy_url}/history", ['api_key' => $api_key, 'refid' => $item->ref_id]);

                if ($res_cek->successful()) {
                    $dt = $res_cek->json();
                    if (isset($dt["ok"]) && $dt["ok"] == true && isset($dt["data"][0])) {
                        $status_api = strtoupper($dt["data"][0]["status_text"] ?? '');
                        $sn = $dt["data"][0]["sn"] ?: ($dt["data"][0]["keterangan"] ?? "OK");

                        if ($status_api == 'SUKSES') {
                            $db->table("antrian_po")->where("id", $item->id)->update(["status" => "Sukses", "updated_at" => now()]);
                            $db->table("transaksi")->where("ref_id", $item->ref_id)->update(["status" => "Sukses", "sn" => $sn]);
                            $active_count--;
                            $logs[] = "✅ [SCANNER] {$item->tujuan} SUKSES!";
                        } elseif ($status_api == 'GAGAL' || $status_api == 'BATAL') {
                            $fresh_ref = "WAR-" . date("YmdHis") . "-" . rand(100, 999);
                            $db->table("transaksi")->where("ref_id", $item->ref_id)->update(["ref_id" => $fresh_ref, "status" => "Pending"]);
                            $db->table("antrian_po")->where("id", $item->id)->update(["ref_id" => $fresh_ref, "status" => "Menunggu", "updated_at" => now()]);
                            $active_count--;
                            $logs[] = "🎯 [STANDBY] {$item->tujuan} Gagal/Batal, kembali ke antrean.";
                        }
                    }
                }
            } catch (\Exception $e) {}
        }

        $slot_tersedia = 2 - $active_count;
        if ($slot_tersedia <= 0) {
            return response()->json(["status" => "warning", "log" => "⏳ LIMIT 2/2 PENUH! Memantau proses..."]);
        }

        DB::beginTransaction();
        try {
            $antrean_target = $db->table("antrian_po")->where("status", "Menunggu")->whereIn("kode_produk", $produk_ready)
                ->orderBy("prioritas", "asc")->orderBy("id", "asc")->limit($slot_tersedia)->lockForUpdate()->get();

            if ($antrean_target->isEmpty()) {
                DB::rollBack();
                return response()->json(["status" => "info", "log" => "Mencari target ready..."]);
            }

            $db->table("antrian_po")->whereIn("id", $antrean_target->pluck('id'))->update(["status" => "Proses_API", "updated_at" => now()]);
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(["status" => "warning", "log" => "Sistem sibuk (Lock DB)."]);
        }

        foreach ($antrean_target as $target) {
            try {
                $response = Http::withoutVerifying()->connectTimeout(5)->timeout(10)
                    ->get("{$khfy_url}/trx", ['produk' => $target->kode_produk, 'tujuan' => $target->tujuan, 'reff_id' => $target->ref_id, 'api_key' => $api_key]);

                $res = $response->json();
                if ((isset($res["status"]) && $res["status"] == true) || (isset($res["ok"]) && $res["ok"] == true) || isset($res["trxid"])) {
                    $logs[] = "🚀 [SHOOTER] {$target->kode_produk} -> {$target->tujuan} DITEMBAKKAN!";
                } else {
                    $fresh_ref = "WAR-" . date("YmdHis") . "-" . rand(100, 999);
                    $db->table("transaksi")->where("ref_id", $target->ref_id)->update(["ref_id" => $fresh_ref]);
                    $db->table("antrian_po")->where("id", $target->id)->update(["ref_id" => $fresh_ref, "status" => "Menunggu", "updated_at" => now()]);
                    $logs[] = "⚠️ [API] {$target->kode_produk} API Sibuk/Ditolak. Siaga ulang.";
                }
            } catch (\Exception $e) {
                $db->table("antrian_po")->where("id", $target->id)->update(["status" => "Menunggu", "updated_at" => now()]);
                $logs[] = "🔌 [KONEKSI] {$target->kode_produk} Timeout. Coba lagi nanti.";
            }
        }

        return response()->json(["status" => "success", "log" => implode(" | ", $logs)]);
    }
}
