import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function TransactionManagement({ auth, transactions, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [localFilter, setLocalFilter] = useState('All');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(parseFloat(n) || 0);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.transaksi.index'), { search }, { preserveState: true });
    };

    const reloadData = () => router.reload({ only: ['transactions'] });

    // 🚀 FITUR BARU: COPY CEPAT UNTUK ADMIN
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tersalin ke Clipboard!', showConfirmButton: false, timer: 1500 });
    };

    // 🚀 FITUR EKSEKUSI & KEAMANAN SULTAN
    const handleAction = async (trx) => {
        if (isProcessing) return; // Anti Spam Klik

        // 🛡️ KEAMANAN: Deteksi status saat ini untuk mengunci opsi (Mencegah Double Refund)
        const isAlreadyFailed = trx.status === 'Gagal';
        const isAlreadySuccess = trx.status === 'Sukses';

        const { value: formValues } = await Swal.fire({
            title: '<span class="text-purple-700 font-black text-xl">🛠️ Eksekusi Transaksi</span>',
            html: `
                <div class="text-left mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Trx (Klik untuk Copy):</div>
                <div class="bg-purple-50 p-3 rounded-xl border border-purple-100 mb-4 text-left text-xs text-purple-900 shadow-inner">
                    <b>ID:</b> <span class="text-purple-600 font-bold cursor-pointer" onclick="navigator.clipboard.writeText('${trx.ref_id}')">${trx.ref_id} <i class="fa-regular fa-copy"></i></span><br/>
                    <b>User:</b> @${trx.username}<br/>
                    <b>Tujuan:</b> <span class="font-bold bg-purple-200 px-1 rounded cursor-pointer" onclick="navigator.clipboard.writeText('${trx.tujuan}')">${trx.tujuan} <i class="fa-regular fa-copy"></i></span><br/>
                    <b>Harga:</b> Rp ${formatRp(trx.harga)}
                </div>
                <div class="text-left mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubah Status:</div>
                <select id="swal-status" class="w-full border border-slate-200 focus:border-purple-500 rounded-xl mb-3 font-bold text-slate-700 py-2.5 text-sm transition-all shadow-sm outline-none">
                    <option value="Pending" ${trx.status === 'Pending' ? 'selected' : ''}>⏳ Pending (Menunggu)</option>
                    ${!isAlreadySuccess ? `<option value="Sukses">✅ Sukses (Transaksi Berhasil)</option>` : `<option value="Sukses" selected>✅ Sukses (Selesai)</option>`}
                    ${!isAlreadyFailed ? `<option value="Gagal">❌ Gagal (Otomatis Refund Saldo)</option>` : `<option value="Gagal" selected disabled>🔒 Gagal (Sudah di-Refund)</option>`}
                </select>
                ${isAlreadyFailed ? `<div class="text-[10px] text-rose-500 font-bold mb-4 bg-rose-50 p-2 rounded-lg text-left"><i class="fa-solid fa-shield-halved"></i> Sistem mengunci opsi Gagal untuk mencegah Double Refund.</div>` : '<div class="mb-4"></div>'}
                
                <div class="text-left mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Input/Edit SN (Serial Number):</div>
                <input type="text" id="swal-sn" class="w-full border border-slate-200 focus:border-purple-500 rounded-xl p-3 text-sm font-mono text-slate-700 shadow-sm outline-none" value="${trx.sn || ''}" placeholder="Ketik SN atau Catatan di sini...">
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-check"></i> Simpan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#7e22ce',
            cancelButtonColor: '#64748b',
            preConfirm: () => {
                return {
                    status: document.getElementById('swal-status').value,
                    sn: document.getElementById('swal-sn').value
                };
            }
        });

        if (formValues) {
            // Jika tidak ada perubahan, batalkan eksekusi untuk hemat resource server
            if (formValues.status === trx.status && formValues.sn === (trx.sn || '')) {
                return Swal.fire({toast: true, position: 'top-end', icon: 'info', title: 'Tidak ada perubahan', showConfirmButton: false, timer: 1500});
            }

            setIsProcessing(true);
            Swal.fire({ title: 'Mengeksekusi...', html: 'Mengamankan saldo & memproses data...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            try {
                const res = await axios.post(`/admin/transaksi/${trx.id}/status`, formValues);
                Swal.fire({ title: 'Berhasil!', text: res.data.message || 'Transaksi terupdate.', icon: 'success', confirmButtonColor: '#7e22ce' });
                reloadData();
            } catch (e) {
                Swal.fire('Error', e.response?.data?.message || 'Gagal memproses transaksi. Cek koneksi.', 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const pageStats = useMemo(() => {
        let totalTrx = transactions.data.length;
        let totalRp = 0;
        let success = 0, pending = 0, failed = 0;
        transactions.data.forEach(trx => {
            totalRp += parseFloat(trx.harga || 0);
            if (trx.status === 'Sukses') success++;
            else if (trx.status === 'Pending') pending++;
            else if (trx.status === 'Gagal') failed++;
        });
        return { totalTrx, totalRp, success, pending, failed };
    }, [transactions.data]);

    const displayedTransactions = useMemo(() => {
        if (localFilter === 'All') return transactions.data;
        return transactions.data.filter(trx => trx.status === localFilter);
    }, [transactions.data, localFilter]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Pusat Kendali Transaksi - MILASTORE" />
            <div className="min-h-screen bg-slate-50 pb-32 font-['Plus_Jakarta_Sans',sans-serif]">
                {/* 🌈 HEADER PREMIUM MILASTORE */}
                <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 pt-8 pb-20 px-4 md:px-8 rounded-b-[2rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-5 rounded-full filter blur-3xl translate-x-1/2 -translate-y-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500 opacity-10 rounded-full filter blur-2xl -translate-x-1/2 translate-y-1/4"></div>
                    
                    <div className="max-w-7xl mx-auto relative z-10 flex items-center gap-4">
                        <Link href={route('dashboard')} className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 transition-all shadow-md">
                            <i className="fa-solid fa-arrow-left"></i>
                        </Link>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">📡 Pusat Transaksi</h2>
                            <p className="text-[10px] md:text-xs font-bold text-purple-200 uppercase tracking-widest mt-1">Eksekusi Delay & Keamanan Saldo</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20">
                    {/* 📊 REKAP STATISTIK SLIM */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vol Halaman Ini</p>
                            <h3 className="text-base md:text-lg font-black text-slate-800">Rp {formatRp(pageStats.totalRp)}</h3>
                        </div>
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500">
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Sukses</p>
                            <h3 className="text-xl font-black text-emerald-600">{pageStats.success} <span className="text-[10px] text-slate-400">Trx</span></h3>
                        </div>
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-amber-100 border-l-4 border-l-amber-500">
                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Nyangkut (Pending)</p>
                            <h3 className="text-xl font-black text-amber-500">{pageStats.pending} <span className="text-[10px] text-slate-400">Trx</span></h3>
                        </div>
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-rose-100 border-l-4 border-l-rose-500">
                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Gagal / Refund</p>
                            <h3 className="text-xl font-black text-rose-500">{pageStats.failed} <span className="text-[10px] text-slate-400">Trx</span></h3>
                        </div>
                    </div>

                    {/* 🔍 SEARCH & FILTER SLIM */}
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-2.5 mb-5">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 bg-slate-50/50 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                                    placeholder="Cari ID Ref, User, Tujuan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400"></i>
                            </div>
                            <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm">
                                CARI
                            </button>
                        </form>
                        <div className="w-full md:w-56">
                            <select
                                value={localFilter}
                                onChange={(e) => setLocalFilter(e.target.value)}
                                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                            >
                                <option value="All">🌈 Semua Status</option>
                                <option value="Pending">⏳ Hanya Pending</option>
                                <option value="Sukses">✅ Hanya Sukses</option>
                                <option value="Gagal">❌ Hanya Gagal</option>
                            </select>
                        </div>
                    </div>

                    {/* 📊 TABEL TRANSAKSI SLIM & MODERN */}
                    <div className="bg-white rounded-[1rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                        <th className="p-3 pl-5 whitespace-nowrap">Detail Trx</th>
                                        <th className="p-3 whitespace-nowrap">Tujuan & Harga</th>
                                        <th className="p-3 whitespace-nowrap">SN / Catatan</th>
                                        <th className="p-3 whitespace-nowrap text-center">Status</th>
                                        <th className="p-3 pr-5 whitespace-nowrap text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedTransactions.length > 0 ? displayedTransactions.map(trx => (
                                        <tr key={trx.id} className="border-b border-slate-50 hover:bg-purple-50/30 transition-colors group">
                                            <td className="p-3 pl-5 whitespace-nowrap">
                                                <div className="font-extrabold text-xs text-purple-700 cursor-pointer hover:text-purple-900 inline-flex items-center gap-1" onClick={() => copyToClipboard(trx.ref_id)} title="Klik Copy ID">
                                                    {trx.ref_id}
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-600 mt-0.5"><i className="fa-solid fa-user-astronaut text-purple-400 mr-1"></i> {trx.username}</div>
                                                <div className="text-[9px] font-medium text-slate-400 mt-1">{trx.tanggal}</div>
                                            </td>
                                            <td className="p-3 whitespace-nowrap">
                                                <div className="font-bold text-slate-800 text-xs mb-1 cursor-pointer hover:text-purple-600 inline-flex items-center gap-1" onClick={() => copyToClipboard(trx.tujuan)} title="Klik Copy Tujuan">
                                                    {trx.tujuan}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded shadow-sm">Rp {formatRp(trx.harga)}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 min-w-[180px] max-w-[250px]">
                                                <div className="text-[10px] font-mono bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg text-slate-600 break-all cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-colors" onClick={() => trx.sn && copyToClipboard(trx.sn)} title="Klik Copy SN">
                                                    {trx.sn ? (
                                                        <><i className="fa-solid fa-barcode text-purple-400 mr-1"></i> {trx.sn}</>
                                                    ) : (
                                                        <span className="italic text-slate-300">Menunggu SN...</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 whitespace-nowrap text-center">
                                                {trx.status === 'Sukses' && <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-full"><i className="fa-solid fa-check-circle mr-1"></i> Sukses</span>}
                                                {trx.status === 'Pending' && <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse"><i className="fa-solid fa-hourglass-half mr-1"></i> Pending</span>}
                                                {trx.status === 'Gagal' && <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-full"><i className="fa-solid fa-xmark-circle mr-1"></i> Refund</span>}
                                            </td>
                                            <td className="p-3 pr-5 whitespace-nowrap text-right">
                                                <button onClick={() => handleAction(trx)} disabled={isProcessing} className="bg-slate-100 hover:bg-purple-600 text-slate-600 hover:text-white border border-slate-200 hover:border-purple-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50 group-hover:bg-purple-50 group-hover:border-purple-200 group-hover:text-purple-700">
                                                    <i className="fa-solid fa-pen-to-square"></i> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="p-10 text-center">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3 border border-slate-100">
                                                    <i className="fa-solid fa-inbox text-purple-300 text-lg"></i>
                                                </div>
                                                <p className="text-slate-500 font-bold text-xs tracking-wide">Data transaksi tidak ditemukan.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 📄 PAGINASI */}
                    <div className="mt-5 flex justify-center gap-1.5 pb-10 flex-wrap">
                        {transactions.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${link.active ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent' : 'bg-white text-slate-500 hover:bg-purple-50 border border-slate-200'} ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            ></Link>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
