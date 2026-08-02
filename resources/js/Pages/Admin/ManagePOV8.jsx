import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function ManagePOV8({ auth, antrean, mode }) {
    const [currentMode, setCurrentMode] = useState(mode);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(n);

    const toggleMode = () => {
        Swal.fire({
            title: 'Ubah Mode Sistem?',
            text: currentMode === 'auto' ? "Sistem Sniper akan dihentikan (Manual)." : "Sistem Sniper akan mengeksekusi otomatis di latar belakang.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Ubah Mode!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post('/admin/po-v8/toggle').then(res => {
                    setCurrentMode(currentMode === 'auto' ? 'manual' : 'auto');
                    Swal.fire('Berhasil!', res.data.message, 'success');
                });
            }
        });
    };

    const actionRetry = (id, tujuan) => {
        setIsProcessing(true);
        Swal.fire({title: 'Menembak API...', html: `Mengeksekusi nomor <b>${tujuan}</b>`, allowOutsideClick: false, didOpen: () => Swal.showLoading()});
        axios.post(`/admin/po-v8/retry/${id}`).then(res => {
            setIsProcessing(false);
            if(res.data.success) {
                Swal.fire('Sukses / Refunded', res.data.message, 'success').then(() => router.reload());
            } else {
                Swal.fire('Tertahan', res.data.message, 'warning').then(() => router.reload());
            }
        }).catch(err => {
            setIsProcessing(false);
            Swal.fire('Error', 'Terjadi kesalahan sistem', 'error');
        });
    };

    const actionCancel = (id, tujuan) => {
        Swal.fire({
            title: 'Batalkan & Refund?',
            html: `Yakin ingin membatalkan pesanan untuk <b>${tujuan}</b>? Saldo akan dikembalikan ke user.`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Batalkan!'
        }).then((result) => {
            if (result.isConfirmed) {
                setIsProcessing(true);
                Swal.fire({title: 'Memproses Refund...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
                axios.post(`/admin/po-v8/cancel/${id}`).then(res => {
                    setIsProcessing(false);
                    if(res.data.success) {
                        Swal.fire('Dibatalkan!', res.data.message, 'success').then(() => router.reload());
                    } else {
                        Swal.fire('Gagal', res.data.message, 'error');
                    }
                });
            }
        });
    };

    
    // --- START AUTO WAR ENGINE LOGIC ---
    React.useEffect(() => {
        let interval;
        if (currentMode === 'auto' && antrean.length > 0 && !isProcessing) {
            // Nembak otomatis setiap 3 detik ke antrean pertama
            interval = setInterval(() => {
                const target = antrean[0];
                if (target) {
                    setIsProcessing(true);
                    axios.post(`/admin/po-v8/retry/${target.id}`).then(res => {
                        setIsProcessing(false);
                        // Reload data senyap biar gak jeda
                        router.reload({ preserveScroll: true, preserveState: true });
                    }).catch(err => {
                        setIsProcessing(false);
                    });
                }
            }, 3000); // 3000 = 3 Detik (Kecepatan Brutal)
        }
        return () => clearInterval(interval);
    }, [currentMode, antrean, isProcessing]);
    // --- END AUTO WAR ENGINE LOGIC ---
    
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Admin PO Command Center" />
            {isProcessing && <div className="fixed inset-0 z-[9999] bg-slate-900/20 backdrop-blur-sm"></div>}

            <div className="py-8 bg-slate-50 min-h-screen font-['Outfit']">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header & Saklar Pusat */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-[24px] border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center p-6">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${currentMode === 'auto' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                <i className={`fa-solid ${currentMode === 'auto' ? 'fa-robot animate-bounce' : 'fa-hand-paper'}`}></i>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Command Center PO</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Akrab V8 Autonomous Engine</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest pl-2">Mode Mesin:</span>
                            <button onClick={toggleMode} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${currentMode === 'auto' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${currentMode === 'auto' ? 'translate-x-9' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border ${currentMode === 'auto' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {currentMode === 'auto' ? 'OTOMATIS (ON)' : 'MANUAL (PAUSED)'}
                            </span>
                        </div>
                    </div>

                    {/* Tabel Antrean */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-[24px] border border-slate-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest"><i className="fa-solid fa-list-ol text-blue-500 mr-2"></i> Daftar Antrean Tertahan</h3>
                            <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">Total: {antrean.length} Data</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Tgl</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Reseller</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produk / Target</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Retry</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi Eksekusi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {antrean.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-10 text-center text-slate-400">
                                                <i className="fa-solid fa-box-open text-4xl mb-3 opacity-20"></i>
                                                <p className="text-xs font-black uppercase tracking-widest">Gudang Antrean Kosong</p>
                                            </td>
                                        </tr>
                                    ) : antrean.map((trx) => (
                                        <tr key={trx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="text-xs font-bold text-slate-800">{trx.ref_id}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{new Date(trx.created_at).toLocaleString('id-ID')}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs font-black text-blue-600 uppercase tracking-widest">{trx.username}</div>
                                                <div className="text-[10px] text-slate-500 font-medium">Rp {formatRp(trx.harga)}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mb-1 border border-slate-200">{trx.kode_layanan}</div>
                                                <div className="text-sm font-black text-slate-800 tracking-wider">{trx.tujuan}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded inline-block border border-indigo-100 mb-1">
                                                    <i className="fa-solid fa-clock-rotate-left mr-1"></i> {trx.status}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium line-clamp-1">{trx.sn}</div>
                                                <div className="text-[9px] text-amber-600 font-bold mt-1 uppercase tracking-widest">Telah di-retry: {trx.retry_count}x</div>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => actionRetry(trx.id, trx.tujuan)} className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-md">
                                                    <i className="fa-solid fa-bolt mr-1"></i> Retry
                                                </button>
                                                <button onClick={() => actionCancel(trx.id, trx.tujuan)} className="bg-white border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all">
                                                    <i className="fa-solid fa-xmark mr-1"></i> Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
