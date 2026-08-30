<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Services\Telegram\SecurityModule;
use App\Services\Telegram\FinanceModule;
use App\Services\Telegram\SystemModule;
use App\Services\Telegram\OsintModule;

class TelegramManagementController extends Controller
{
    public function index() { return view('telegram_management'); }

    public function getDashboardData()
    {
        try {
            return response()->json([
                'security' => SecurityModule::getStats(),
                'finance'  => FinanceModule::getSummary(),
                'system'   => SystemModule::getDiagnostics(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()]);
        }
    }
    public function runScan(Request $request) { return response()->json(['status' => 'success', 'data' => SecurityModule::performUltraScan($request->input('auto_fix', false))]); }
    public function unblockIp(Request $request) { SecurityModule::unblockIp($request->input('ip')); return response()->json(['status' => 'success']); }
    public function clearCache() { SystemModule::clearCache(); return response()->json(['status' => 'success']); }
    public function osintLookup(Request $request) { return response()->json(OsintModule::lookup($request->input('target'))); }
}
