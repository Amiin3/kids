<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    private function autoSyncIfEmpty() {
        // 🛡️ SUNTIKAN OTOMATIS: Tambah kolom is_active jika belum ada agar tidak crash
        try { DB::statement("ALTER TABLE app_menus ADD COLUMN is_active TINYINT(1) DEFAULT 1"); } catch (\Exception $e) {}
        
        $count = DB::table('app_menus')->count();
        if ($count === 0) {
            $now = now();
            DB::table('app_menus')->insert([
                'type' => 'app', 'name' => 'Pulsa', 'icon' => 'fa-mobile-retro', 'route' => 'order.pulsa', 'bg' => 'bg-gradient-to-br from-cyan-400 to-blue-600', 'is_active' => 1, 'order_num' => 1, 'created_at' => $now, 'updated_at' => $now
            ]);
        }
    }

    public function index() {
        $this->autoSyncIfEmpty();
        $adminMenus = DB::table('app_menus')->where('type', 'admin')->orderBy('order_num', 'asc')->get();
        $appMenus = DB::table('app_menus')->where('type', 'app')->orderBy('order_num', 'asc')->get();
        $resellerMenus = DB::table('app_menus')->where('type', 'reseller')->orderBy('order_num', 'asc')->get();
        $h2hMenus = DB::table('app_menus')->where('type', 'h2h')->orderBy('order_num', 'asc')->get();
        
        $settings = DB::table('settings')->whereIn('key', ['web_name', 'web_logo'])->pluck('value', 'key')->toArray();
        return Inertia::render('Admin/MenuManager', [
            'adminMenus' => $adminMenus,
            'appMenus' => $appMenus,
            'resellerMenus' => $resellerMenus,
            'h2hMenus' => $h2hMenus,
            'webSettings' => [
                'name' => $settings['web_name'] ?? 'MILASTORE',
                'logo' => $settings['web_logo'] ?? ''
            ]
        ]);
    }

    public function apiList() {
        $this->autoSyncIfEmpty();
        return response()->json([
            'status' => 'custom', 
            'data' => [ 
                'admin' => DB::table('app_menus')->where('type', 'admin')->where('is_active', 1)->orderBy('order_num', 'asc')->get(), 
                'app' => DB::table('app_menus')->where('type', 'app')->where('is_active', 1)->orderBy('order_num', 'asc')->get(),
                'reseller' => DB::table('app_menus')->where('type', 'reseller')->where('is_active', 1)->orderBy('order_num', 'asc')->get(),
                'h2h' => DB::table('app_menus')->where('type', 'h2h')->where('is_active', 1)->orderBy('order_num', 'asc')->get()
            ]
        ]);
    }

    public function store(Request $request) {
        $request->validate(['name' => 'required', 'type' => 'required']);
        $icon = $request->icon;
        
        if ($request->hasFile('icon_file')) {
            $file = $request->file('icon_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('storage/menus'), $filename);
            $icon = '/storage/menus/' . $filename;
        }

        $data = [
            'type' => $request->type,
            'name' => $request->name,
            'icon' => $icon,
            'url' => $request->url,
            'route' => $request->route_name,
            'bg' => $request->bg,
            'color' => $request->color ?? 'text-white',
            'isBlade' => $request->is_blade ? 1 : 0,
            'is_active' => $request->is_active !== null ? (int)$request->is_active : 1,
            'order_num' => $request->order_num ?? 0,
            'updated_at' => now()
        ];

        if ($request->id) {
            DB::table('app_menus')->where('id', $request->id)->update($data);
            return response()->json(['status' => true, 'message' => 'Menu berhasil diupdate!']);
        } else {
            if(!$request->order_num || $request->order_num == 0) {
                $data['order_num'] = DB::table('app_menus')->where('type', $request->type)->max('order_num') + 1;
            }
            $data['created_at'] = now();
            DB::table('app_menus')->insert($data);
            return response()->json(['status' => true, 'message' => 'Menu baru ditambahkan!']);
        }
    }

    public function updateOrder(Request $request) {
        foreach ($request->orders as $item) {
            DB::table('app_menus')->where('id', $item['id'])->update(['order_num' => $item['order_num']]);
        }
        return response()->json(['status' => true]);
    }

    public function destroy(Request $request) {
        DB::table('app_menus')->where('id', $request->id)->delete();
        return response()->json(['status' => true]);
    }

    public function saveWebSettings(Request $request) {
        DB::table('settings')->updateOrInsert(['key' => 'web_name'], ['value' => $request->web_name]);
        if ($request->hasFile('web_logo')) {
            $file = $request->file('web_logo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('storage/logo'), $filename);
            DB::table('settings')->updateOrInsert(['key' => 'web_logo'], ['value' => '/storage/logo/' . $filename]);
        }
        return redirect()->back()->with('success', 'Pengaturan Web Berhasil Disimpan!');
    }
}
