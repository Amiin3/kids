<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Stok XDA & XLA - CY STORE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; }
    </style>
</head>
<body class="antialiased min-h-screen text-slate-800 p-4 md:p-6">
    <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div class="absolute top-4 right-4 flex items-center gap-1.5 bg-green-50 text-green-600 px-2 py-1 rounded-full text-[10px] font-bold border border-green-200">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></span>
                <span class="w-2 h-2 bg-green-500 rounded-full relative"></span>
                LIVE UPDATE
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-blue-600 tracking-tight">Live Stok Provider</h1>
            <p class="text-slate-500 text-sm mt-1 font-medium">Auto-Refresh tiap 3 detik tanpa kedip.</p>
        </div>

        <!-- Wadah Utama Produk -->
        <div id="stock-container">
            @foreach($products as $kategori => $items)
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-4">
                    <h2 class="text-lg font-bold text-slate-700">{{ $kategori }}</h2>
                    <div class="h-px bg-slate-200 flex-grow"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    @foreach($items as $p)
                    <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200">
                        <div class="flex justify-between items-center mb-2.5">
                            <span class="bg-slate-100 text-slate-600 text-xs font-extrabold tracking-wide px-2 py-1 rounded-md">{{ $p->kode_layanan }}</span>
                            @if(is_numeric($p->stok) && $p->stok > 0)
                                <span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Tersedia: {{ $p->stok }}</span>
                            @elseif($p->stok === 'Unlimited')
                                <span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Unlimited</span>
                            @else
                                <span class="bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">Habis (Kosong)</span>
                            @endif
                        </div>
                        <h3 class="font-semibold text-slate-800 text-sm leading-snug mb-2.5 line-clamp-2">{{ $p->nama_layanan }}</h3>
                        <div class="text-lg font-extrabold text-blue-600">Rp {{ number_format($p->harga_jual, 0, ',', '.') }}</div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endforeach
        </div>
        
        <div class="text-center mt-10 text-xs text-slate-400 font-medium pb-4">
            &copy; {{ date('Y') }} CY STORE &bull; Protected by Smart Polling & RAM Cache
        </div>
    </div>

    <!-- 🚀 SCRIPT SMART POLLING -->
    <script>
        function formatRupiah(angka) {
            return new Intl.NumberFormat('id-ID').format(angka);
        }

        function fetchLiveStock() {
            // Tarik data secara latar belakang tanpa me-reload HTML (AJAX)
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

                    for (const [kategori, items] of Object.entries(data)) {
                        html += `
                        <div class="mb-8 fade-in">
                            <div class="flex items-center gap-3 mb-4">
                                <h2 class="text-lg font-bold text-slate-700">${kategori}</h2>
                                <div class="h-px bg-slate-200 flex-grow"></div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">`;
                        
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
                                <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200">
                                    <div class="flex justify-between items-center mb-2.5">
                                        <span class="bg-slate-100 text-slate-600 text-xs font-extrabold tracking-wide px-2 py-1 rounded-md">${p.kode_layanan}</span>
                                        ${badge}
                                    </div>
                                    <h3 class="font-semibold text-slate-800 text-sm leading-snug mb-2.5 line-clamp-2">${p.nama_layanan}</h3>
                                    <div class="text-lg font-extrabold text-blue-600">Rp ${formatRupiah(p.harga_jual)}</div>
                                </div>
                            `;
                        });

                        html += `</div></div>`;
                    }

                    // Terapkan hasil ke layar pengguna secara instan
                    document.getElementById('stock-container').innerHTML = html;
                }
            })
            .catch(err => console.log('Gagal menarik data live, sistem akan mencoba lagi...'));
        }

        // EKSEKUSI: Jalankan penarikan data tiap 3 Detik (3000 ms)
        setInterval(fetchLiveStock, 3000);
    </script>
</body>
</html>
