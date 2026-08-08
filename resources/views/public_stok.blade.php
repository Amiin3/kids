<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Stok XDA & XLA - {{ $brandName }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
    </style>
</head>
<body class="antialiased min-h-screen text-slate-800 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-purple-50">
    <div class="max-w-5xl mx-auto">
        
        <!-- Header Premium -->
        <div class="text-center mb-8 glass-panel p-6 rounded-2xl shadow-sm border border-purple-100 relative overflow-hidden">
            <div class="absolute top-4 right-4 flex items-center gap-1.5 bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-200 shadow-sm">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></span>
                <span class="w-2 h-2 bg-green-500 rounded-full relative"></span>
                LIVE UPDATE
            </div>
            <h1 class="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
                <span class="text-slate-800">Live Stok</span> 
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">{{ $brandName }}</span>
            </h1>
            <p class="text-slate-500 text-sm font-medium">Auto-Refresh tiap 3 detik &bull; Server Terhubung Langsung</p>
        </div>
        
        <!-- Wadah Utama Produk -->
        <div id="stock-container">
            @foreach($products as $kategori => $items)
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-4">
                    <h2 class="text-lg font-bold text-slate-700">{{ $kategori }}</h2>
                    <div class="h-px bg-purple-100 flex-grow"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    @foreach($items as $p)
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-purple-300 hover:-translate-y-1 transition-all duration-300">
                        <div class="flex justify-between items-center mb-3">
                            <span class="bg-slate-100 text-slate-600 text-xs font-extrabold tracking-wide px-2 py-1 rounded-md">{{ $p->kode_layanan }}</span>
                            @if(is_numeric($p->stok) && $p->stok > 0)
                                <span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Tersedia: {{ $p->stok }}</span>
                            @elseif($p->stok === 'Unlimited')
                                <span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Unlimited</span>
                            @else
                                <span class="bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">Habis (Kosong)</span>
                            @endif
                        </div>
                        <h3 class="font-semibold text-slate-800 text-sm leading-snug mb-3 line-clamp-2">{{ $p->nama_layanan }}</h3>
                        <div class="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Rp {{ number_format($p->harga_jual, 0, ',', '.') }}</div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endforeach
        </div>

        <div class="text-center mt-12 text-xs text-slate-400 font-medium pb-6 flex flex-col items-center gap-1">
            <span id="footer-brand">&copy; {{ date('Y') }} {{ $brandName }}</span>
            <span>Protected by Smart Polling & RAM Cache</span>
        </div>
    </div>

    <!-- 🚀 SCRIPT SMART POLLING -->
    <script>
        function formatRupiah(angka) {
            return new Intl.NumberFormat('id-ID').format(angka);
        }

        function fetchLiveStock() {
            fetch('{{ route("public.stok") }}', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(res => {
                if(res.status === 'success') {
                    let html = '';
                    const data = res.data;
                    const dynamicBrand = res.brand || '{{ $brandName }}';

                    // Update Title & Footer dynamically from Backend
                    document.title = 'Live Stok XDA & XLA - ' + dynamicBrand;
                    document.getElementById('footer-brand').innerHTML = '&copy; ' + new Date().getFullYear() + ' ' + dynamicBrand;

                    for (const [kategori, items] of Object.entries(data)) {
                        html += `
                        <div class="mb-8 fade-in">
                            <div class="flex items-center gap-3 mb-4">
                                <h2 class="text-lg font-bold text-slate-700">${kategori}</h2>
                                <div class="h-px bg-purple-100 flex-grow"></div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;
                        
                        items.forEach(p => {
                            let badge = '';
                            if (p.stok === 'Unlimited') {
                                badge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Unlimited</span>`;
                            } else if (!isNaN(p.stok) && p.stok > 0) {
                                badge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Tersedia: ${p.stok}</span>`;
                            } else {
                                badge = `<span class="bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">Habis (Kosong)</span>`;
                            }

                            html += `
                                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-purple-300 hover:-translate-y-1 transition-all duration-300">
                                    <div class="flex justify-between items-center mb-3">
                                        <span class="bg-slate-100 text-slate-600 text-xs font-extrabold tracking-wide px-2 py-1 rounded-md">${p.kode_layanan}</span>
                                        ${badge}
                                    </div>
                                    <h3 class="font-semibold text-slate-800 text-sm leading-snug mb-3 line-clamp-2">${p.nama_layanan}</h3>
                                    <div class="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Rp ${formatRupiah(p.harga_jual)}</div>
                                </div>
                            `;
                        });
                        html += `</div></div>`;
                    }
                    
                    document.getElementById('stock-container').innerHTML = html;
                }
            })
            .catch(err => console.log('Sistem mencoba menyambung ulang ke satelit...'));
        }

        // EKSEKUSI: Tarik data tiap 3 detik tanpa kedip!
        setInterval(fetchLiveStock, 3000);
    </script>
</body>
</html>
