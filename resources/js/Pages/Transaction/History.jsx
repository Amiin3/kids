import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';

// 🎨 DESIGN SYSTEM: GLASSMORPHISM & SLIM SCROLLBAR
const modernStyles = `
    .modern-bg {
        background-color: #f8fafc;
        background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.05) 0px, transparent 50%);
        min-height: 100vh;
    }
    .modern-card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(226, 232, 240, 0.8);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .modern-card:hover {
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.08);
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
`;

export default function History({ auth, transactions, filters }) {
    // 🔄 SMART POLLING UNTUK TRANSAKSI PENDING
    useEffect(() => {
        const hasPending = transactions?.data?.some(t => ["Proses", "Wait", "Pending", "Proses_API"].includes(t.status));
        if (hasPending) {
            const interval = setInterval(() => {
                router.reload({ only: ["transactions"], preserveScroll: true });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [transactions]);

    const [search, setSearch] = useState(filters?.search || '');
    const [filterStatus, setFilterStatus] = useState(filters?.status || 'Semua');
    const [showModal, setShowModal] = useState(false);
    const [activeTrx, setActiveTrx] = useState(null);
    const [tokoName, setTokoName] = useState(auth.user.username || auth.user.name || 'Milastore Konter');
    const [hargaJual, setHargaJual] = useState(0);
    const receiptRef = useRef(null);

    const applyFilters = (newSearch, newStatus) => {
        router.get('/riwayat', { search: newSearch, status: newStatus }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters(search, filterStatus);
    };

    const handleFilterChange = (statusName) => {
        setFilterStatus(statusName);
        applyFilters(search, statusName);
    };

    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(n);
    
    const maskSN = (sn) => {
        if (!sn || sn === '-' || String(sn).toLowerCase() === 'null') return '';
        return String(sn).replace(/kaje|kj|khfy/gi, 'MS');
    };

    const copyToClipboard = (text) => {
        if (!text || text === '-') return Swal.fire({icon: 'error', title: 'Kosong', text: 'Tidak ada data untuk disalin.', customClass: {popup: 'rounded-[20px]'}});
        navigator.clipboard.writeText(text);
        Swal.fire({ title: 'Tersalin! 📋', text: 'Data berhasil disalin ke clipboard', icon: 'success', timer: 1200, showConfirmButton: false, customClass: {popup: 'rounded-[20px]'} });
    };

    const openPrintModal = (trx) => {
        setActiveTrx(trx);
        setHargaJual(Number(trx.harga) + 2000);
        setShowModal(true);
    };

    const handlePrint = () => window.print();

    const handleDownloadImage = async () => {
        if (!receiptRef.current) return;
        Swal.fire({ title: 'Memproses Struk...', text: 'Mencetak HD Image', allowOutsideClick: false, customClass: {popup: 'rounded-[20px]'}, didOpen: () => { Swal.showLoading(); } });
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: null });
            const fileName = `STRUK_${tokoName.replace(/\s+/g, '_')}_${activeTrx.tujuan}.png`;
            const base64Image = canvas.toDataURL('image/png');
            if (window.AndroidBridge) {
                window.AndroidBridge.downloadBase64Image(base64Image, fileName);
                Swal.fire({ title: 'Berhasil! 🎉', text: 'Struk disimpan ke Galeri HP!', icon: 'success', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-[20px]'} });
            } else {
                const link = document.createElement('a');
                link.download = fileName; link.href = base64Image; link.click();
                Swal.fire({ title: 'Berhasil! 🎉', text: 'Struk berhasil didownload!', icon: 'success', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-[20px]'} });
            }
        } catch (error) {
            Swal.fire({icon: 'error', title: 'Gagal', text: 'Kesalahan sistem saat membuat gambar.', customClass: {popup: 'rounded-[20px]'}});
        }
    };

    const StatusBadge = ({ status }) => {
        const s = String(status).toLowerCase();
        if (s.includes('sukses') || s.includes('success') || s.includes('berhasil')) return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Sukses</span>;
        if (s.includes('gagal') || s.includes('error') || s.includes('batal')) return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Gagal</span>;
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Proses</span>;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Riwayat Transaksi - Milastore" />
            <style>{modernStyles}</style>
            
            <div className="modern-bg font-['Outfit'] print:hidden pb-[140px] md:pb-32">
                {/* 🌟 MODERN SLIM HEADER */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 pt-8 pb-20 px-6 rounded-b-[36px] shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none"></div>
                    <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-5">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Link href="/dashboard" className="w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 shadow-inner">
                                <i className="fa-solid fa-arrow-left text-sm"></i>
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-white tracking-wide uppercase">Riwayat Transaksi</h1>
                                <p className="text-indigo-200 text-[11px] font-medium tracking-wider mt-0.5">Pusat monitoring & cetak struk digital</p>
                            </div>
                        </div>

                        {/* SEARCH INPUT */}
                        <form onSubmit={handleSearch} className="w-full md:w-72 relative group">
                            <input
                                type="text"
                                placeholder="Cari No. Tujuan / Ref ID / SN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-black/25 border border-white/15 text-white placeholder-white/40 text-xs rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-400 focus:bg-black/40 outline-none transition-all shadow-inner"
                            />
                            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors"></i>
                        </form>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-25">
                    {/* 🎛️ SLIM FILTER PILLS */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
                        {['Semua', 'Berhasil', 'Pending', 'Gagal'].map(status => (
                            <button
                                key={status}
                                onClick={() => handleFilterChange(status)}
                                className={`shrink-0 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                                    filterStatus === status
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                                    : 'bg-white/90 backdrop-blur-md text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-white'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* 📋 TRANSACTION LIST CARDS */}
                    <div className="space-y-3.5 mb-8">
                        {transactions?.data?.length > 0 ? transactions.data.map((trx) => {
                            const isSukses = String(trx.status).toLowerCase().includes('sukses') || String(trx.status).toLowerCase().includes('berhasil');
                            const maskedSN = maskSN(trx.sn);
                            const textKeterangan = String(trx.keterangan || '').trim();
                            const displayMessage = maskedSN ? maskedSN : (textKeterangan && textKeterangan !== '-' ? textKeterangan : 'Menunggu Respon Provider...');

                            return (
                                <div key={trx.id} className="modern-card rounded-[24px] p-5 flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden group">
                                    <div className="flex items-start gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100/60 flex flex-col items-center justify-center shrink-0 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <i className="fa-solid fa-receipt text-base"></i>
                                            <span className="text-[7px] font-black mt-0.5 opacity-80">{new Date(trx.created_at).getDate()}/{new Date(trx.created_at).getMonth()+1}</span>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <div className="flex justify-between md:block items-center mb-1">
                                                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">{trx.nama_produk || trx.kode_layanan}</p>
                                                <span className="md:hidden"><StatusBadge status={trx.status} /></span>
                                            </div>
                                            <h3 className="font-black text-slate-900 text-base tracking-tight">{trx.tujuan}</h3>
                                            
                                            {/* SN / KETERANGAN CONTAINER */}
                                            <div className="mt-2.5 w-full pr-1">
                                                <div className="bg-slate-100/80 border border-slate-200/70 rounded-xl p-2.5 text-[11px] font-mono text-slate-700 break-words w-full relative pr-10 shadow-inner">
                                                    {displayMessage}
                                                    <button onClick={() => copyToClipboard(displayMessage)} className="absolute top-2 right-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 p-1.5 rounded-lg shadow-sm border border-slate-200/60 transition-all active:scale-90" title="Salin Teks">
                                                        <i className="fa-regular fa-copy"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex flex-col justify-between items-end min-w-[130px]">
                                        <StatusBadge status={trx.status} />
                                        <div className="text-right mt-2">
                                            <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">Harga Modal</p>
                                            <p className="font-black text-slate-900 text-sm">Rp {formatRp(trx.harga)}</p>
                                        </div>
                                    </div>

                                    {/* MOBILE BOTTOM PRICE & PRINT */}
                                    <div className="md:hidden flex justify-between items-center pt-3 border-t border-slate-100 mt-1">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">Harga Modal</p>
                                            <p className="font-black text-slate-900 text-sm">Rp {formatRp(trx.harga)}</p>
                                        </div>
                                        {isSukses && (
                                            <button onClick={() => openPrintModal(trx)} className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100 active:scale-95 transition-all shadow-sm"><i className="fa-solid fa-print mr-1.5"></i> Struk</button>
                                        )}
                                    </div>
                                    
                                    {/* DESKTOP PRINT BUTTON */}
                                    {isSukses && (
                                        <div className="hidden md:flex items-center">
                                            <button onClick={() => openPrintModal(trx)} className="w-12 h-12 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-2xl transition-all border border-indigo-100 flex items-center justify-center active:scale-95 shadow-sm hover:shadow-md" title="Cetak Struk"><i className="fa-solid fa-print text-base"></i></button>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-200/80 shadow-sm">
                                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">
                                    <i className="fa-solid fa-folder-open"></i>
                                </div>
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Tidak Ada Riwayat</h3>
                                <p className="text-slate-400 text-xs font-medium mt-1">Belum ada transaksi yang sesuai dengan filter Anda.</p>
                            </div>
                        )}
                    </div>

                    {/* 🧭 MODERN PAGINATION */}
                    {transactions?.links && transactions.data.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1.5 pb-12">
                            {transactions.links.map((link, index) => {
                                if (!link.url && !link.active) return null;
                                return (
                                    <Link
                                        key={index} href={link.url || '#'} preserveScroll
                                        dangerouslySetInnerHTML={{ __html: link.label.replace('Previous', '<i class="fa-solid fa-angle-left"></i>').replace('Next', '<i class="fa-solid fa-angle-right"></i>') }}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${link.active ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' : !link.url ? 'bg-transparent text-slate-300 border-transparent cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 🖨️ MODAL CETAK STRUK */}
            {showModal && activeTrx && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 print:hidden animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-100">
                        <div className="p-6 flex justify-between items-center border-b border-slate-100">
                            <div>
                                <h2 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i className="fa-solid fa-receipt text-xs"></i></span>
                                    Cetak Struk
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center active:scale-90"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="p-6 space-y-4 bg-slate-50/50">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Nama Konter / Toko</label>
                                <input type="text" value={tokoName} onChange={(e) => setTokoName(e.target.value)} className="w-full border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Harga Jual (Rp)</label>
                                <input type="number" value={hargaJual} onChange={(e) => setHargaJual(e.target.value)} className="w-full border border-slate-200 rounded-2xl p-3 text-sm font-black text-indigo-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" />
                                <p className="text-[10px] text-slate-400 mt-1.5 font-bold">Harga modal asli: Rp {formatRp(activeTrx.harga)}</p>
                            </div>
                        </div>
                        <div className="p-5 bg-white flex gap-3 border-t border-slate-100">
                            <button onClick={handlePrint} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3.5 rounded-2xl transition-all uppercase tracking-wider text-[10px] flex justify-center items-center gap-2 active:scale-95"><i className="fa-solid fa-print"></i> Thermal</button>
                            <button onClick={handleDownloadImage} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all uppercase tracking-wider text-[10px] flex justify-center items-center gap-2 active:scale-95"><i className="fa-solid fa-download"></i> Unduh HD</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AREA CETAK THERMAL PRINT */}
            {showModal && activeTrx && (
                <div className="hidden print:block font-mono text-black bg-white w-[80mm] mx-auto text-sm p-4 leading-relaxed border-none">
                    <div className="text-center mb-4">
                        <h1 className="font-bold text-xl uppercase tracking-widest m-0 p-0 border-b-2 border-dashed border-black pb-2 mb-2">{tokoName}</h1>
                        <p className="text-xs m-0">Struk Pembelian Elektrik</p>
                    </div>
                    <div className="text-xs mb-4">
                        <div className="flex justify-between"><span className="w-20">Tanggal</span><span>: {new Date(activeTrx.created_at).toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between"><span className="w-20">No. Ref</span><span>: {activeTrx.ref_id}</span></div>
                    </div>
                    <div className="border-t border-b border-dashed border-black py-2 mb-4 text-xs">
                        <div className="font-bold mb-1">{activeTrx.nama_produk || activeTrx.kode_layanan}</div>
                        <div className="flex justify-between mb-2"><span>Tujuan:</span><span className="font-bold">{activeTrx.tujuan}</span></div>
                        <div className="mt-2"><span className="block mb-1">SN / Token:</span><span className="block font-bold break-all bg-gray-100 p-1">{maskSN(activeTrx.sn) || activeTrx.keterangan || '-'}</span></div>
                    </div>
                    <div className="flex justify-between text-base font-bold mb-6"><span>TOTAL BAYAR</span><span>Rp {formatRp(hargaJual)}</span></div>
                    <div className="text-center text-xs border-t-2 border-dashed border-black pt-4">
                        <p className="m-0">Terima Kasih</p>
                        <p className="mt-2 text-[10px]">Powered by {tokoName}</p>
                    </div>
                </div>
            )}

            {/* AREA RENDER GAMBAR HD (HIDDEN CANVAS) */}
            {showModal && activeTrx && (
                <div className="fixed top-[-9999px] left-[-9999px] z-[-50] print:hidden">
                    <div ref={receiptRef} className="w-[420px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 rounded-[32px] text-white shadow-2xl relative font-sans border border-indigo-500/30">
                        <div className="text-center border-b border-white/15 pb-4 mb-5">
                            <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 uppercase drop-shadow">{tokoName}</h1>
                            <p className="text-[9px] text-indigo-200 font-black uppercase tracking-[0.25em] mt-1">Bukti Pembayaran Digital Resmi</p>
                        </div>
                        <div className="space-y-3 relative z-10 text-xs">
                            <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-indigo-300 font-medium">Waktu Transaksi</span><span className="font-bold">{new Date(activeTrx.created_at).toLocaleString('id-ID')}</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-indigo-300 font-medium">No. Referensi</span><span className="font-mono">{activeTrx.ref_id}</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-indigo-300 font-medium">Produk</span><span className="font-bold max-w-[220px] text-right">{activeTrx.nama_produk || activeTrx.kode_layanan}</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-indigo-300 font-medium">Tujuan / Nomor</span><span className="font-black text-base tracking-wider">{activeTrx.tujuan}</span></div>
                        </div>
                        <div className="mt-4 bg-white/5 rounded-2xl p-3.5 border border-white/10 shadow-inner">
                            <p className="text-[9px] text-indigo-300 uppercase tracking-wider font-black mb-1">SN / Token / Pesan</p>
                            <p className="font-mono text-xs font-bold text-white break-all">{maskSN(activeTrx.sn) || activeTrx.keterangan || '-'}</p>
                        </div>
                        <div className="mt-6 pt-5 border-t-2 border-dashed border-white/20 text-center">
                            <p className="text-[9px] text-indigo-300 uppercase tracking-widest font-black mb-1">TOTAL PEMBAYARAN</p>
                            <h2 className="text-3xl font-black text-emerald-400 drop-shadow">Rp {formatRp(hargaJual)}</h2>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
