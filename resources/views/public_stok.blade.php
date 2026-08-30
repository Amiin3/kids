<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Cek Stok Paket XL - {{ $brandName ?? 'MILASTORE' }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f4f7f6; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0px; }
        .app-container { max-width: 480px; margin: 0 auto; background-color: #f4f7f6; min-height: 100vh; position: relative; padding-bottom: 90px; box-shadow: 0 0 20px rgba(0,0,0,0.05); }
        .nav-active { color: #2563eb; }
        .nav-inactive { color: #94a3b8; }
    </style>
</head>
<body class="text-slate-800" x-data="appData()">

    <div class="app-container border-x border-slate-200/60 bg-white">
        
        <!-- HEADER -->
        <header class="bg-white sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    <i class="fa-solid fa-bolt"></i>
                </div>
                <h1 class="font-bold text-[17px] tracking-tight text-slate-800">{{ $brandName ?? 'MILASTORE' }}</h1>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-[11px] font-semibold text-slate-400" x-text="time"></span>
            </div>
        </header>

        <main class="bg-[#f4f7f6] min-h-screen">
            
            <!-- VIEW 1: STOK -->
            <div x-show="activeTab === 'stok'" x-transition.opacity.duration.300ms class="p-4 space-y-5">
                
                <!-- SUMMARY CARD -->
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h2 class="font-bold text-lg text-slate-800 leading-tight">Cek Stok Paket XL & AXIS</h2>
                    <p class="text-[11px] text-slate-500 mt-1 mb-4">Pantau ketersediaan paket data secara real-time.</p>
                    
                    <div class="flex justify-between items-end border-t border-slate-100 pt-3">
                        <div>
                            <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Stok</p>
                            <p class="text-3xl font-extrabold text-blue-600 mt-0.5">{{ number_format($totalStok ?? 0, 0, ',', '.') }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Terakhir diupdate</p>
                            <p class="text-[11px] font-bold text-slate-700 mt-1 mb-2" x-text="time"></p>
                            <button @click="location.reload()" class="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ml-auto">
                                <i class="fa-solid fa-rotate"></i> Refresh Stok
                            </button>
                        </div>
                    </div>
                </div>

                <!-- LOOPING KATEGORI & PRODUK -->
                @foreach($products as $categoryName => $items)
                <div class="pt-2">
                    <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">{{ $categoryName }}</h2>
                    <div class="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-3 mt-0.5">
                        <span>Produk {{ $categoryName }}</span>
                        <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{{ count($items) }} item</span>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        @foreach($items as $idx => $p)
                        @php
                            $isReady = $p->stok > 0;
                            $cardId = 'prod_' . Str::slug($p->product_code ?? $idx);
                        @endphp
                        <div class="bg-white rounded-[14px] shadow-sm border {{ $isReady ? 'border-green-100' : 'border-slate-100' }} flex flex-col relative overflow-hidden transition-all duration-200" x-data="{ open: false }">
                            
                            <div class="p-3 pb-2">
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="font-bold text-[15px] text-slate-800 tracking-tight leading-none">{{ $p->product_code }}</h3>
                                    @if($isReady)
                                        <span class="bg-green-100 text-green-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> READY
                                        </span>
                                    @else
                                        <span class="bg-slate-100 text-slate-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded">HABIS</span>
                                    @endif
                                </div>
                                
                                <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Sisa Slot</div>
                                <div class="text-2xl font-black {{ $isReady ? 'text-slate-800' : 'text-slate-300' }} leading-none mb-1">
                                    {{ $p->stok }}
                                </div>
                            </div>

                            <!-- MENU AKSI (SLIM GABUNGAN DETAIL & BELI) -->
                            <div class="mt-auto border-t border-slate-100 grid grid-cols-2 text-[10px] font-bold divide-x divide-slate-100">
                                <button @click="open = !open" class="py-2.5 flex items-center justify-center gap-1 hover:bg-slate-50 transition {{ $isReady ? 'text-slate-600' : 'text-slate-400' }}">
                                    <span x-text="open ? 'Tutup' : 'Detail'"></span>
                                </button>
                                <a href="https://milastore.cloud" target="_blank" class="py-2.5 flex items-center justify-center gap-1 transition {{ $isReady ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 bg-slate-50 pointer-events-none' }}">
                                    Beli <i class="fa-solid fa-cart-shopping text-[9px]"></i>
                                </a>
                            </div>

                            <!-- ISI DETAIL AREA -->
                            <div x-show="open" x-collapse class="bg-slate-50 border-t border-slate-100 px-3 py-2.5">
                                @if(count($p->areas) > 0)
                                    <div class="space-y-1">
                                        @foreach($p->areas as $area)
                                        <div class="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                                            <span class="text-slate-500 font-semibold text-[10px]">{{ strtoupper($area['name']) }}</span>
                                            <span class="font-extrabold text-slate-800 text-[11px]">{{ $area['kuota'] }}</span>
                                        </div>
                                        @endforeach
                                    </div>
                                    @if(!empty($p->note))
                                    <div class="mt-2 bg-blue-50/50 border border-blue-100 rounded p-1.5 flex gap-1.5 items-start">
                                        <i class="fa-solid fa-circle-info text-blue-500 text-[10px] mt-0.5"></i>
                                        <p class="text-[9px] text-blue-700 leading-tight font-medium">{{ $p->note }}</p>
                                    </div>
                                    @endif
                                @else
                                    <div class="text-center text-slate-400 italic text-[10px] py-1">Detail tidak tersedia.</div>
                                @endif
                            </div>

                        </div>
                        @endforeach
                    </div>
                </div>
                @endforeach

                <!-- FOOTER ORDER INFO -->
                <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-slate-100 mt-8 mb-4">
                    <h3 class="font-bold text-slate-800 text-sm mb-3">Order Here!!</h3>
                    <div class="flex justify-center gap-2">
                        <a href="https://t.me/Lastcore" target="_blank" class="flex-1 py-2 bg-sky-50 text-sky-600 font-bold text-[11px] rounded-lg border border-sky-100 flex items-center justify-center gap-1.5">
                            <i class="fa-brands fa-telegram text-sm"></i> @Lastcore
                        </a>
                        <a href="https://wa.me/62859106609838" target="_blank" class="flex-1 py-2 bg-green-50 text-green-600 font-bold text-[11px] rounded-lg border border-green-100 flex items-center justify-center gap-1.5">
                            <i class="fa-brands fa-whatsapp text-sm"></i> Admin WA
                        </a>
                    </div>
                    <div class="mt-4 text-[10px] text-slate-400 font-medium">© 2026 {{ $brandName ?? 'MILASTORE' }}. All rights reserved.</div>
                </div>
            </div>

            <!-- VIEW 2: AREA -->
            <div x-show="activeTab === 'area'" x-transition.opacity.duration.300ms class="p-4 space-y-4" style="display: none;">
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h2 class="font-bold text-lg text-slate-800 leading-tight">Cari Area Paket XL</h2>
                    <p class="text-[11px] text-slate-500 mt-1 mb-4">Temukan pembagian wilayah Area 1 - 4.</p>
                    
                    <div class="relative mb-4">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><i class="fa-solid fa-magnifying-glass text-[11px]"></i></span>
                        <input type="text" x-model="searchQuery" placeholder="Cari Nama Kota / Kabupaten..." class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition">
                    </div>

                    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wide text-[9px]">
                                    <th class="p-3">Provinsi / Wilayah</th>
                                    <th class="p-3 text-center w-14">Area</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <template x-for="item in filteredAreas" :key="item.kota">
                                    <tr>
                                        <td class="p-3">
                                            <span class="block font-bold text-slate-800 mb-0.5" x-text="item.prov"></span>
                                            <span class="block text-[10px] text-slate-500 leading-tight" x-text="item.kota"></span>
                                        </td>
                                        <td class="p-3 text-center">
                                            <span :class="'font-bold px-2 py-1 rounded text-[10px] ' + (item.area == '1' ? 'bg-green-50 text-green-600' : (item.area == '2' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'))" x-text="item.area"></span>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </main>

        <!-- BOTTOM NAVBAR -->
        <nav class="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-slate-100 flex justify-around items-center h-[60px] z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] rounded-t-2xl pb-safe">
            <button @click="activeTab = 'stok'; window.scrollTo(0,0)" :class="activeTab === 'stok' ? 'nav-active' : 'nav-inactive'" class="flex flex-col items-center justify-center w-full h-full gap-1 pt-1 transition">
                <i class="fa-solid fa-cube text-[16px]"></i>
                <span class="text-[9px] font-bold">Stok Produk</span>
            </button>
            <a href="https://milastore.cloud/order/cek-kuota" class="nav-inactive flex flex-col items-center justify-center w-full h-full gap-1 pt-1 transition hover:text-blue-600">
                <i class="fa-solid fa-sim-card text-[16px]"></i>
                <span class="text-[9px] font-bold">Cek Kuota</span>
            </a>
            <button @click="activeTab = 'area'; window.scrollTo(0,0)" :class="activeTab === 'area' ? 'nav-active' : 'nav-inactive'" class="flex flex-col items-center justify-center w-full h-full gap-1 pt-1 transition">
                <i class="fa-solid fa-map-location-dot text-[16px]"></i>
                <span class="text-[9px] font-bold">Data Area</span>
            </button>
        </nav>

    </div>

    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('appData', () => ({
                activeTab: 'stok',
                time: '',
                searchQuery: '',
                areas: [
                    { prov: 'Banten', kota: 'Kota Tangerang Selatan, Kota Tangerang, Kab. Tangerang, Kab. Pandeglang, Kab. Lebak, Kab. Serang, Kota Serang, Kota Cilegon', area: '2' },
                    { prov: 'DI Yogyakarta', kota: 'Kab. Kulon Progo, Kota Yogyakarta, Kab. Sleman, Kab. Bantul, Kab. Gunungkidul', area: '1' },
                    { prov: 'DKI Jakarta', kota: 'Kota Jakarta Pusat, Kota Jakarta Selatan, Kota Jakarta Barat, Kota Jakarta Timur, Kota Jakarta Utara', area: '2' },
                    { prov: 'DKI Jakarta', kota: 'Kab. Kepulauan Seribu', area: '3' },
                    { prov: 'Jawa Barat', kota: 'Kab. Bandung, Kab. Kuningan, Kab. Purwakarta, Kota Bandung', area: '1' },
                    { prov: 'Jawa Barat', kota: 'Kab. Bandung Barat, Kota Cimahi, Kab. Cirebon, Kota Cirebon, Kab. Indramayu, Kab. Subang', area: '2' },
                    { prov: 'Jawa Barat', kota: 'Kab. Bogor, Kota Bogor, Kota Depok, Kota Bekasi, Kota Banjar, Kab. Ciamis, Kota Tasikmalaya, Kab. Majalengka, Kab. Sumedang, Kab. Garut', area: '3' },
                    { prov: 'Jawa Tengah', kota: 'Kab. Tegal, Kota Surakarta, Kota Tegal, Kab. Brebes, Kab. Kebumen, Kab. Pemalang, Kota Semarang', area: '2' },
                    { prov: 'Jawa Timur', kota: 'Kota Probolinggo, Kab. Bangkalan, Kab. Sidoarjo, Kab. Banyuwangi, Kota Surabaya, Kab. Sampang, Kab. Pamekasan, Kab. Pacitan', area: '2' },
                    { prov: 'Bali', kota: 'Kab. Jembrana, Kab. Buleleng', area: '1' },
                    { prov: 'Bali', kota: 'Kab. Badung, Kab. Karangasem, Kab. Tabanan, Kab. Bangli, Kab. Gianyar, Kab. Klungkung, Kota Denpasar', area: '2' }
                ],
                init() {
                    setInterval(() => {
                        this.time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
                    }, 1000);
                },
                get filteredAreas() {
                    if (this.searchQuery === '') return this.areas;
                    return this.areas.filter(item => item.kota.toLowerCase().includes(this.searchQuery.toLowerCase()) || item.prov.toLowerCase().includes(this.searchQuery.toLowerCase()));
                }
            }))
        })
    </script>
</body>
</html>
