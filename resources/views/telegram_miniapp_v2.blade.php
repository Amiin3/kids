<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>CY STORE Command Hub</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #090d16; color: #f1f5f9; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        .glass-card { background: rgba(17, 24, 39, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .glass-glow-blue { box-shadow: 0 0 25px -5px rgba(37, 99, 235, 0.25); }
        .nav-item.active { color: #38bdf8; position: relative; }
        .nav-item.active::after { content: ''; position: absolute; bottom: 4px; width: 16px; height: 3px; background: #38bdf8; border-radius: 99px; }
    </style>
</head>
<body class="antialiased min-h-screen pb-24" x-data="miniapp()">

    <header class="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-base font-extrabold shadow-lg shadow-blue-500/20">
                <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div>
                <h1 class="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    CY STORE <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">VVIP HUB</span>
                </h1>
                <p class="text-[10px] text-slate-400 font-medium" x-text="userName"></p>
            </div>
        </div>
        <button @click="fetchData()" class="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-slate-300 hover:text-white transition">
            <i class="fa-solid fa-rotate text-xs" :class="loading ? 'animate-spin text-blue-400' : ''"></i>
        </button>
    </header>

    <main class="p-4 max-w-md mx-auto space-y-4">
        <!-- TAB 1: DASHBOARD -->
        <div x-show="activeTab === 'dashboard'" x-transition.opacity.duration.300ms class="space-y-4">
            <div class="glass-card rounded-2xl p-4.5 relative overflow-hidden glass-glow-blue">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Server Health</span>
                    </div>
                    <span class="text-[10px] font-mono text-slate-400">Load: <strong class="text-slate-200" x-text="data.system.cpu_load"></strong></span>
                </div>
                <div class="grid grid-cols-2 gap-3 mt-4">
                    <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>RAM</span>
                            <span class="font-bold text-white" x-text="data.system.ram_perc + '%'"></span>
                        </div>
                        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500" :style="`width: ${data.system.ram_perc}%`"></div>
                        </div>
                        <p class="text-[9px] text-slate-500 mt-1 font-mono" x-text="`${data.system.ram_used} / ${data.system.ram_total} MB`"></p>
                    </div>
                    <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>Disk</span>
                            <span class="font-bold text-white" x-text="data.system.disk_perc + '%'"></span>
                        </div>
                        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" :style="`width: ${data.system.disk_perc}%`"></div>
                        </div>
                        <p class="text-[9px] text-slate-500 mt-1 font-mono" x-text="data.system.disk_usage"></p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="glass-card rounded-2xl p-4">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs mb-2">
                        <i class="fa-solid fa-wallet"></i>
                    </div>
                    <p class="text-[10px] uppercase font-bold text-slate-400">Saldo Member</p>
                    <p class="text-sm font-extrabold text-white mt-0.5" x-text="data.finance.saldo_formatted"></p>
                </div>
                <div class="glass-card rounded-2xl p-4">
                    <div class="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs mb-2">
                        <i class="fa-solid fa-chart-line"></i>
                    </div>
                    <p class="text-[10px] uppercase font-bold text-slate-400">Trx Hari Ini</p>
                    <p class="text-sm font-extrabold text-white mt-0.5" x-text="`${data.finance.trx_today} Trx`"></p>
                </div>
            </div>

            <div class="glass-card rounded-2xl p-4 space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Tindakan Keamanan</h3>
                <div class="grid grid-cols-2 gap-2.5">
                    <button @click="runScanAction(false)" class="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95">
                        <i class="fa-solid fa-magnifying-glass"></i> Deep Scan
                    </button>
                    <button @click="runScanAction(true)" class="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Fix
                    </button>
                </div>
            </div>
        </div>

        <!-- TAB 2: SECURITY -->
        <div x-show="activeTab === 'security'" x-transition.opacity.duration.300ms class="space-y-4" style="display: none;">
            <div class="grid grid-cols-2 gap-3">
                <div class="glass-card rounded-2xl p-4">
                    <p class="text-[10px] uppercase font-bold text-slate-400">Total Ancaman</p>
                    <p class="text-2xl font-black text-rose-500 mt-0.5" x-text="data.security.total_attacks"></p>
                </div>
                <div class="glass-card rounded-2xl p-4">
                    <p class="text-[10px] uppercase font-bold text-slate-400">IP Terblokir</p>
                    <p class="text-2xl font-black text-amber-400 mt-0.5" x-text="data.security.banned_count"></p>
                </div>
            </div>

            <div x-show="scanResult" class="glass-card rounded-2xl p-4 border border-blue-500/40">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-check text-emerald-400"></i> Laporan Scanner
                    </h4>
                    <button @click="scanResult = null" class="text-slate-400 hover:text-white text-xs"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="space-y-1.5 mt-2">
                    <template x-for="item in scanResult.details" :key="item.text">
                        <div class="text-[11px] p-2 rounded-lg bg-slate-900/60 flex items-start gap-2 border border-slate-800">
                            <span x-text="item.type === 'fixed' ? '✅' : '❌'"></span>
                            <span class="text-slate-300" x-text="item.text"></span>
                        </div>
                    </template>
                </div>
            </div>

            <div class="glass-card rounded-2xl p-4">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Firewall Banned List</h3>
                    <span class="text-[10px] text-slate-500" x-text="`${data.security.banned_list.length} IP`"></span>
                </div>
                <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <template x-for="item in data.security.banned_list" :key="item.ip">
                        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                            <div>
                                <p class="text-xs font-mono font-bold text-white" x-text="item.ip"></p>
                                <p class="text-[9px] text-slate-400" x-text="item.reason || 'Sistem Terdeteksi Ancaman'"></p>
                            </div>
                            <button @click="unblock(item.ip)" class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition">
                                Unblock
                            </button>
                        </div>
                    </template>
                    <template x-if="data.security.banned_list.length === 0">
                        <p class="text-center text-xs text-slate-500 py-3">Server Bersih dari ancaman.</p>
                    </template>
                </div>
            </div>
        </div>

        <!-- TAB 3: TOOLS & OSINT -->
        <div x-show="activeTab === 'tools'" x-transition.opacity.duration.300ms class="space-y-4" style="display: none;">
            <div class="glass-card rounded-2xl p-4 space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Intelligence (OSINT)</h3>
                <div class="flex gap-2">
                    <input type="text" x-model="osintTarget" placeholder="Lacak IP / No HP (0859...)" class="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono">
                    <button @click="runOsint()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5">
                        <i class="fa-solid fa-crosshairs"></i> Lacak
                    </button>
                </div>
                <div x-show="osintResult" class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <template x-if="osintResult && osintResult.type === 'ip'">
                        <div>
                            <p class="font-bold text-blue-400" x-text="`IP: ${osintResult.data.query}`"></p>
                            <p class="text-slate-300" x-text="`Lokasi: ${osintResult.data.city}, ${osintResult.data.country}`"></p>
                            <p class="text-slate-400 text-[10px]" x-text="`ISP: ${osintResult.data.isp}`"></p>
                        </div>
                    </template>
                    <template x-if="osintResult && osintResult.type === 'phone'">
                        <div>
                            <p class="font-bold text-emerald-400" x-text="`Target: ${osintResult.data.number}`"></p>
                            <p class="text-slate-300" x-text="`Provider: ${osintResult.data.provider}`"></p>
                            <a :href="osintResult.data.getcontact" target="_blank" class="text-blue-400 underline text-[10px] mt-1 block">Buka di GetContact</a>
                        </div>
                    </template>
                </div>
            </div>

            <div class="glass-card rounded-2xl p-4 space-y-2.5">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Pemeliharaan Server</h3>
                <button @click="clearCacheAction()" class="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-bold flex items-center justify-between transition">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-broom text-amber-400"></i> Bersihkan Cache Framework</span>
                    <i class="fa-solid fa-chevron-right text-[10px] text-slate-500"></i>
                </button>
            </div>
        </div>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/80 flex justify-around items-center h-[65px] z-50">
        <button @click="switchTab('dashboard')" class="nav-item flex flex-col items-center justify-center w-full h-full text-slate-400 transition" :class="activeTab === 'dashboard' ? 'active' : ''">
            <i class="fa-solid fa-gauge-high text-base mb-1"></i>
            <span class="text-[9px] font-bold mt-0.5">Beranda</span>
        </button>
        <button @click="switchTab('security')" class="nav-item flex flex-col items-center justify-center w-full h-full text-slate-400 transition" :class="activeTab === 'security' ? 'active' : ''">
            <i class="fa-solid fa-shield-cat text-base mb-1"></i>
            <span class="text-[9px] font-bold mt-0.5">Firewall</span>
        </button>
        <button @click="switchTab('tools')" class="nav-item flex flex-col items-center justify-center w-full h-full text-slate-400 transition" :class="activeTab === 'tools' ? 'active' : ''">
            <i class="fa-solid fa-sliders text-base mb-1"></i>
            <span class="text-[9px] font-bold mt-0.5">Sistem</span>
        </button>
    </nav>

    <script>
        function miniapp() {
            return {
                activeTab: 'dashboard',
                userName: '@LatsCore',
                loading: false,
                osintTarget: '',
                osintResult: null,
                scanResult: null,
                csrf: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                data: {
                    security: { total_attacks: 0, banned_count: 0, banned_list: [] },
                    finance: { saldo_formatted: 'Rp 0', trx_today: 0 },
                    system: { cpu_load: '0.00', ram_perc: 0, ram_used: 0, ram_total: 0, disk_usage: '0 GB', disk_perc: 0 }
                },
                init() {
                    const tg = window.Telegram?.WebApp;
                    if (tg) {
                        tg.ready(); tg.expand();
                        if (tg.initDataUnsafe?.user) {
                            const u = tg.initDataUnsafe.user;
                            this.userName = u.username ? '@' + u.username : u.first_name;
                        }
                    }
                    this.fetchData();
                },
                switchTab(tab) {
                    this.activeTab = tab;
                    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                },
                async fetchData() {
                    this.loading = true;
                    try {
                        const res = await fetch('/telegram/miniapp/data');
                        this.data = await res.json();
                    } catch (e) {} finally { this.loading = false; }
                },
                async runScanAction(autoFix) {
                    this.loading = true;
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
                    try {
                        const res = await fetch('/telegram/miniapp/scan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': this.csrf },
                            body: JSON.stringify({ auto_fix: autoFix })
                        });
                        const json = await res.json();
                        this.scanResult = json.data;
                        this.activeTab = 'security';
                        this.fetchData();
                    } catch (e) { alert('Gagal menjalankan scan keamanan.'); } 
                    finally { this.loading = false; }
                },
                async unblock(ip) {
                    if (!confirm(`Lepaskan pemblokiran untuk IP ${ip}?`)) return;
                    try {
                        await fetch('/telegram/miniapp/unblock', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': this.csrf },
                            body: JSON.stringify({ ip: ip })
                        });
                        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
                        this.fetchData();
                    } catch (e) { alert('Gagal memproses unblock.'); }
                },
                async clearCacheAction() {
                    this.loading = true;
                    try {
                        await fetch('/telegram/miniapp/clear-cache', { 
                            method: 'POST',
                            headers: { 'X-CSRF-TOKEN': this.csrf }
                        });
                        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
                        alert('Cache server telah berhasil dibersihkan!');
                        this.fetchData();
                    } catch (e) { alert('Sistem gagal menghapus cache.'); } 
                    finally { this.loading = false; }
                },
                async runOsint() {
                    if (!this.osintTarget) return;
                    this.loading = true;
                    try {
                        const res = await fetch('/telegram/miniapp/osint', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': this.csrf },
                            body: JSON.stringify({ target: this.osintTarget })
                        });
                        this.osintResult = await res.json();
                        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
                    } catch (e) { alert('Kegagalan dalam melacak target (OSINT).'); } 
                    finally { this.loading = false; }
                }
            }
        }
    </script>
</body>
</html>
