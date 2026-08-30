import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';
import '@/../../resources/css/mila-loading.css';

export default function DigiflazzManager({ auth, products, stats, categories = [], brands = [] }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedBrand, setSelectedBrand] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    
    const [markupPersen, setMarkupPersen] = useState(2);
    const [markupFlat, setMarkupFlat] = useState(500);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

    const handleSync = async () => {
        Swal.fire({
            title: `<span class="text-xl font-black text-slate-800">Sapu Jagat Data Pusat</span>`,
            html: `
                <div class="text-left mt-3 space-y-3">
                    <div class="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-600 text-xs font-bold leading-relaxed">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i> Seluruh data lama akan <b>dihapus bersih</b> dan diganti data baru dari pusat agar terhindar dari produk mati/zombie.
                    </div>
                    <div class="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs space-y-1">
                        <div class="flex justify-between font-bold text-slate-700"><span>Keuntungan Persen:</span><span class="text-indigo-600 font-black">${markupPersen}%</span></div>
                        <div class="flex justify-between font-bold text-slate-700"><span>Keuntungan Flat:</span><span class="text-indigo-600 font-black">Rp ${formatRp(markupFlat)}</span></div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'BERSIHKAN & UPDATE HARGA',
            cancelButtonText: 'BATAL',
            buttonsStyling: false,
            reverseButtons: true,
            customClass: {
                confirmButton: 'w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-[11px] uppercase shadow-xl',
                cancelButton: 'w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-[11px] uppercase',
                popup: 'rounded-[28px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsSyncing(true);
                Swal.fire({
                    html: `
                        <div class="mt-4 flex flex-col items-center">
                            <div class="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-lg shadow-indigo-500/20"></div>
                            <p class="text-sm font-black tracking-widest uppercase text-slate-700 mt-6">Menyelaraskan Sistem...</p>
                            <p class="text-[11px] font-bold text-slate-400 mt-1">Sistem sedang membersihkan data lama.</p>
                        </div>
                    `,
                    allowOutsideClick: false, showConfirmButton: false, buttonsStyling: false,
                    customClass: { popup: 'rounded-[32px] p-8 w-full max-w-xs shadow-2xl' }
                });
                
                try {
                    const response = await axios.post('/admin/digiflazz/sync', { markup_persen: markupPersen, markup_flat: markupFlat });
                    if (response.data.success) {
                        Swal.fire({ icon: 'success', title: 'Selesai!', text: response.data.message, confirmButtonColor: '#4f46e5', customClass: { popup: 'rounded-[28px]' } }).then(() => router.reload());
                    }
                } catch (error) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Sistem Sibuk.', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-[24px]' } });
                } finally {
                    setIsSyncing(false);
                }
            }
        });
    };

    const handleToggleStatus = (sku) => {
        router.post(`/admin/digiflazz/toggle/${sku}`, {}, { preserveScroll: true });
    };

    const handleEditPrice = (item) => {
        Swal.fire({
            title: `<span class="text-lg font-black text-slate-800">Ubah Harga Khusus</span>`,
            html: `<p class="text-xs text-slate-500 mb-4">${item.product_name}</p>`,
            input: 'number',
            inputValue: item.price,
            showCancelButton: true,
            confirmButtonText: 'SIMPAN',
            cancelButtonText: 'BATAL',
            buttonsStyling: false,
            reverseButtons: true,
            inputValidator: (value) => {
                if (!value || value <= 0) return 'Harga tidak boleh kosong!';
            },
            customClass: {
                confirmButton: 'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-xs uppercase shadow-xl shadow-indigo-500/30',
                cancelButton: 'w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-xs uppercase',
                popup: 'rounded-[28px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl',
                input: 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-black text-slate-800 text-lg focus:ring-indigo-500 focus:border-indigo-500 text-center'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(`/admin/digiflazz/update-price/${item.sku}`, { harga_jual: result.value }, {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const flash = page.props.flash || {};
                        Swal.fire({ icon: 'success', title: 'Tersimpan!', text: flash.success || 'Harga diperbarui.', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[24px]' } });
                    }
                });
            }
        });
    };

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const term = searchTerm.toLowerCase();
        
        return products.filter((item) => {
            const matchSearch = (item.product_name && item.product_name.toLowerCase().includes(term)) ||
                                (item.sku && item.sku.toLowerCase().includes(term));
            const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            const matchBrand = selectedBrand === 'ALL' || item.brand === selectedBrand;
            const matchStatus = selectedStatus === 'ALL' || 
                                (selectedStatus === 'active' && (item.status === 'active' || item.status === 'Aktif')) ||
                                (selectedStatus === 'inactive' && (item.status === 'inactive' || item.status === 'Nonaktif'));

            return matchSearch && matchCategory && matchBrand && matchStatus;
        });
    }, [products, searchTerm, selectedCategory, selectedBrand, selectedStatus]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Manajemen Digiflazz H2H" />
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            
            <div className="min-h-screen bg-slate-50/60 font-['Outfit'] pb-32">
                
                {/* 🚀 HEADER DASHBOARD SULTAN */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 pt-10 pb-28 rounded-b-[44px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
                    <div className="max-w-7xl mx-auto relative z-10 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-2xl shadow-inner backdrop-blur-md">
                                <i className="fa-solid fa-server"></i>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">H2H Provider Center</span>
                                <h1 className="text-2xl font-black text-white tracking-wide uppercase drop-shadow-md">Digiflazz Manager</h1>
                            </div>
                        </div>
                        <button onClick={handleSync} disabled={isSyncing} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 border border-white/10">
                            <i className="fa-solid fa-rotate-right"></i> {isSyncing ? 'MEMPROSES...' : 'TARIK & SINKRON HARGA'}
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 space-y-6">
                    
                    {/* 📊 4 KARTU STATISTIK METRIK */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-boxes-stacked"></i></div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Produk</span>
                                <h3 className="text-xl font-black text-slate-800 font-mono">{stats.total.toLocaleString('id-ID')}</h3>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-circle-check"></i></div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Produk Aktif</span>
                                <h3 className="text-xl font-black text-emerald-600 font-mono">{stats.active.toLocaleString('id-ID')}</h3>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-circle-xmark"></i></div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nonaktif</span>
                                <h3 className="text-xl font-black text-rose-600 font-mono">{stats.inactive.toLocaleString('id-ID')}</h3>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-tags"></i></div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kategori</span>
                                <h3 className="text-xl font-black text-purple-600 font-mono">{stats.categories} Jenis</h3>
                            </div>
                        </div>
                    </div>

                    {/* ⚙️ KALKULATOR PROFIT AUTOMATION */}
                    <div className="bg-white p-6 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-sliders text-indigo-600"></i>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pengaturan Margin Keuntungan Massal</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Keuntungan Persen (%)</label>
                                <div className="relative">
                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono" value={markupPersen} onChange={(e) => setMarkupPersen(e.target.value)} />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Keuntungan Flat (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">Rp</span>
                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-black text-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono" value={markupFlat} onChange={(e) => setMarkupFlat(e.target.value)} />
                                </div>
                            </div>
                            <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100/80 flex flex-col justify-center">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Kalkulasi Simulasi</span>
                                <span className="text-xs font-black text-indigo-900 mt-0.5">Modal Rp 10.000 <i className="fa-solid fa-arrow-right mx-1 text-[10px]"></i> Jual Rp {formatRp(10000 + (10000 * (markupPersen/100)) + Number(markupFlat))}</span>
                            </div>
                        </div>
                    </div>

                    {/* 📋 CONTROL PANEL & TABEL PRODUK */}
                    <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        
                        {/* BARIS FILTER & SEARCH */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="w-full md:w-72 relative">
                                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input type="text" placeholder="Cari nama atau SKU..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                            </div>

                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                                    <option value="ALL">Semua Kategori</option>
                                    {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                </select>

                                <select value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                                    <option value="ALL">Semua Brand</option>
                                    {brands.map((b, i) => <option key={i} value={b}>{b}</option>)}
                                </select>

                                <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                                    <option value="ALL">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>
                        </div>

                        {/* TABEL DATA */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="p-4 pl-6">Detail Produk</th>
                                        <th className="p-4">SKU Code</th>
                                        <th className="p-4">Harga Jual</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 pr-6 text-center">Aksi Management</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                    {paginatedProducts.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-16 text-slate-400 uppercase tracking-widest text-[11px] font-black">Data tidak ditemukan.</td></tr>
                                    ) : (
                                        paginatedProducts.map((item) => (
                                            <tr key={item.sku} className="hover:bg-slate-50/80 transition-all">
                                                <td className="p-4 pl-6">
                                                    <div className="font-black text-slate-800 text-[13px] leading-tight mb-1 max-w-[200px] truncate" title={item.product_name}>{item.product_name}</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider">{item.category}</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-wider">{item.brand}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono text-[11px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">{item.sku}</span>
                                                </td>
                                                <td className="p-4 font-mono font-black text-slate-900 text-sm">
                                                    Rp {formatRp(item.price)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${item.status === 'active' || item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' || item.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleEditPrice(item)} title="Edit Harga Satuan" className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm border border-slate-200 flex items-center justify-center">
                                                            <i className="fa-solid fa-pen text-xs"></i>
                                                        </button>
                                                        <button onClick={() => handleToggleStatus(item.sku)} title="Aktif/Nonaktifkan" className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm border ${item.status === 'active' || item.status === 'Aktif' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>
                                                            <i className={`fa-solid ${item.status === 'active' || item.status === 'Aktif' ? 'fa-power-off' : 'fa-check'} text-xs`}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white flex-wrap gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Halaman {currentPage} dari {totalPages} ({filteredProducts.length} Data)
                                </span>
                                <div className="flex gap-1.5">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider hover:bg-slate-200 disabled:opacity-50 transition-all">Prev</button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider hover:bg-slate-200 disabled:opacity-50 transition-all">Next</button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
