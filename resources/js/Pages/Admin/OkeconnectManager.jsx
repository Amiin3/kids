import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function OkeconnectManager({ auth, products }) {
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

    const { data: markupData, setData: setMarkupData, post: postMarkup, processing: markupProcessing } = useForm({
        provider: 'ALL',
        type: 'nominal',
        amount: 1500
    });

    const handleSync = () => {
        setSyncing(true);
        Swal.fire({
            html: `
                <div class="mt-4 flex flex-col items-center">
                    <div class="w-14 h-14 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg"></div>
                    <p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-4">Sinkronisasi Pricelist Okeconnect...</p>
                </div>
            `,
            allowOutsideClick: false, showConfirmButton: false, customClass: { popup: 'rounded-[28px] p-6' }
        });

        router.post('/admin/okeconnect/sync', {}, {
            onSuccess: (page) => {
                setSyncing(false);
                const flash = page.props.flash || {};
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: flash.success || 'Pricelist diperbarui.', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-[28px]' } });
            },
            onError: () => {
                setSyncing(false);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat sinkronisasi.', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-[28px]' } });
            }
        });
    };

    const handleBulkMarkup = (e) => {
        e.preventDefault();
        postMarkup('/admin/okeconnect/markup', {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Markup Berhasil!', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[28px]' } });
            }
        });
    };

    const handleToggle = (id) => {
        router.post(`/admin/okeconnect/toggle/${id}`, {}, { preserveScroll: true });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Hapus Produk?',
            text: 'Data produk ini akan dihapus dari database.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'HAPUS',
            cancelButtonText: 'BATAL',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-[28px]' }
        }).then((res) => {
            if (res.isConfirmed) {
                router.delete(`/admin/okeconnect/destroy/${id}`, { preserveScroll: true });
            }
        });
    };

    const filteredProducts = products.filter(p => 
        p.nama_layanan.toLowerCase().includes(search.toLowerCase()) || 
        p.kode_layanan.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Manajemen Okeconnect H2H" />
            
            <div className="min-h-screen bg-slate-50 font-['Outfit'] pb-32">
                
                {/* 🚀 HEADER UNGU PREMIUM */}
                <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-6 pt-10 pb-24 rounded-b-[40px] shadow-lg shadow-purple-900/25 relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10 flex-wrap gap-4">
                        <div>
                            <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest">Admin Control Center</span>
                            <h1 className="text-xl font-black text-white tracking-wider uppercase drop-shadow-md">Kelola Server Okeconnect</h1>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSync} disabled={syncing} className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2.5 rounded-2xl border border-white/20 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 shadow-inner">
                                <i className="fa-solid fa-cloud-arrow-down"></i> Tarik Pricelist API
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 space-y-6">
                    
                    {/* 📊 PANEL MARKUP MASSAL & STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold shadow-inner">
                                <i className="fa-solid fa-box-archive"></i>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Produk H2H</span>
                                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{products.length} Item</h3>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-white p-6 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Markup Harga Massal Otomatis</h3>
                            <form onSubmit={handleBulkMarkup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <select 
                                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700"
                                    value={markupData.provider} onChange={e => setMarkupData('provider', e.target.value)}
                                >
                                    <option value="ALL">Semua Provider</option>
                                    <option value="TELKOMSEL">Telkomsel</option>
                                    <option value="INDOSAT">Indosat</option>
                                    <option value="XL">XL</option>
                                    <option value="AXIS">Axis</option>
                                    <option value="TRI">Tri</option>
                                    <option value="SMARTFREN">Smartfren</option>
                                    <option value="PLN">PLN</option>
                                </select>
                                <div className="flex gap-2">
                                    <select 
                                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 w-1/2"
                                        value={markupData.type} onChange={e => setMarkupData('type', e.target.value)}
                                    >
                                        <option value="nominal">Rp (Nominal)</option>
                                        <option value="persen">% (Persen)</option>
                                    </select>
                                    <input 
                                        type="number" placeholder="Jumlah" 
                                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 w-1/2 font-mono"
                                        value={markupData.amount} onChange={e => setMarkupData('amount', e.target.value)}
                                    />
                                </div>
                                <button type="submit" disabled={markupProcessing} className="bg-slate-900 hover:bg-black text-white rounded-xl p-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md">
                                    Terapkan Markup
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 📋 TABEL DAFTAR PRODUK */}
                    <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
                            <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">Database Produk Okeconnect</h3>
                            <div className="w-full sm:w-72">
                                <input 
                                    type="text" placeholder="Cari nama atau kode..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:ring-purple-500 focus:border-purple-500"
                                    value={search} onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="p-4">Kode</th>
                                        <th className="p-4">Nama Layanan</th>
                                        <th className="p-4">Provider / Tipe</th>
                                        <th className="p-4">Harga Modal</th>
                                        <th className="p-4">Harga Jual</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12 text-slate-400 uppercase tracking-widest text-[11px]">Belum ada produk atau hasil pencarian tidak ditemukan.</td>
                                        </tr>
                                    ) : (
                                        filteredProducts.slice(0, 100).map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                                                <td className="p-4 font-mono font-black text-purple-600">{p.kode_layanan}</td>
                                                <td className="p-4 max-w-xs truncate">{p.nama_layanan}</td>
                                                <td className="p-4">
                                                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase mr-1">{p.provider}</span>
                                                    <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">{p.tipe}</span>
                                                </td>
                                                <td className="p-4 font-mono text-slate-500">Rp {formatRp(p.harga_modal)}</td>
                                                <td className="p-4 font-mono font-black text-slate-900">Rp {formatRp(p.harga_jual)}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleToggle(p.id)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}>
                                                        {p.status}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto shadow-sm">
                                                        <i className="fa-solid fa-trash text-xs"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
