<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDepositController extends Controller {

    public function index(Request $request) {
        $query = DB::table("deposits")
            ->join("users", "deposits.user_id", "=", "users.id")
            ->select("deposits.*", "users.name as member_name", "users.email as member_email");

        // 🔥 FIX: LOGIKA SEARCH AKTIF
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('users.name', 'like', "%{$request->search}%")
                  ->orWhere('users.email', 'like', "%{$request->search}%")
                  ->orWhere('deposits.id', 'like', "%{$request->search}%")
                  ->orWhere('deposits.metode', 'like', "%{$request->search}%");
            });
        }

        $deposits = $query->orderBy("deposits.id", "desc")->paginate(30)->withQueryString();
        $settings = DB::table("payment_settings")->get();
        $site = DB::table("site_settings")->first();

        return Inertia::render("Admin/Deposit/Index", [
            "deposits" => $deposits,
            "settings" => $settings,
            "site" => $site,
            "filters" => $request->only(['search'])
        ]);
    }

    public function handleAction($id, Request $request) {
        DB::beginTransaction();
        try {
            // 🔒 GEMBOK TITANIUM
            $deposit = DB::table("deposits")->where("id", $id)->lockForUpdate()->first();
            
            if (!$deposit) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Data tidak ditemukan!']);
            }

            if ($deposit->status !== "Pending") {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Sudah pernah diproses!']);
            }

            DB::table("deposits")->where("id", $id)->update([
                "status" => $request->status,
                "updated_at" => now()
            ]);

            if ($request->status === "Sukses") {
                \App\Services\MilaPayWebhookEngine::fire($id);
                DB::table("users")->where("id", $deposit->user_id)->increment("saldo", $deposit->amount);
                
                $user = DB::table("users")->where("id", $deposit->user_id)->first();
                if ($user && $user->email) {
                    $this->kirimNotifMandiri($user->email, "💰 Saldo Masuk!", "Deposit Rp " . number_format($deposit->total_bayar) . " Berhasil!");
                }
            }

                    // --- AUTO-WA ADMIN DEPO ---
        try {
            $depoUser = \Illuminate\Support\Facades\DB::table('users')->where('id', $deposit->user_id)->first();
            if ($depoUser) {
                $wa = preg_replace('/[^0-9]/', '', $depoUser->whatsapp ?? $depoUser->phone ?? '');
                if ($wa != '') {
                    if (substr($wa, 0, 1) == '0') $wa = '62' . substr($wa, 1);
                    $msg = "💳 *UPDATE DEPOSIT* 💳\n\n";
                    $msg .= "💰 Jumlah: *Rp " . number_format($deposit->amount ?? $deposit->total_bayar ?? 0, 0, ',', '.') . "*\n";
                    $msg .= "📊 Status: *" . strtoupper($request->status) . "*";
                    \Illuminate\Support\Facades\Http::timeout(3)->post('http://127.0.0.1:3003/send-notif', ['target' => $wa, 'message' => $msg, 'key' => 'SULTAN_MILA_2026']);
                }
            }
        } catch (\Exception $e) {}
        // --- END AUTO-WA ---

        DB::commit();
            return response()->json(['success' => true, 'message' => "Update Berhasil!"]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    private function kirimNotifMandiri($email, $judul, $pesan) {
        try {
            $url = "http://localhost:3000/push-notif";
            $data = ['email' => $email, 'judul' => $judul, 'pesan' => $pesan];
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 2);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {}
    }
}
