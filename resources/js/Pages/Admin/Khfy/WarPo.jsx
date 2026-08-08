import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function WarPo({ auth }) {
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [cancelRef, setCancelRef] = useState('');
    const [autoSync, setAutoSync] = useState(true); // 🌟 FITUR BARU: Pause/Resume Tabel
    const terminalEndRef = useRef(null);

    // Auto-scroll log monitor
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // 🌟 AUTO-CLEAN LOGS
    const addLog = (msg, type = 'wait') => {
        const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
        setLogs(prev => {
            const newLogs = [...prev, { time, msg, type }];
            return newLogs.slice(-100);
        });
    };

    // FITUR COPY CEPAT
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tersalin!', showConfirmButton: false, timer: 1500 });
    };

    const fetchTable = () => {
        axios.post(route('admin.khfy.warengine.list'))
            .then(res => setTableData(res.data.data || []))
            .catch(err => console.error('Tabel Sync Error'));
    };

    // ⚙️ MESIN TEMPUR (RADAR & SNIPER)
    useEffect(() => {
        let timer;
        const runEngine = async () => {
            if (!isRunning) return;
            try {
                const res = await axios.post(route('admin.khfy.warengine.execute'));
                addLog(res.data.log, res.data.status);
            } catch (error) {
                addLog('Koneksi satelit terputus. Mencoba ulang...', 'error');
            }
            if (isRunning) timer = setTimeout(runEngine, 1500);
        };

        if (isRunning) {
            addLog('⚡ WAR ENGINE AKTIF! Sistem Radar Polling Berjalan...', 'shoot');
            runEngine();
        } else {
            clearTimeout(timer);
        }
        return () => clearTimeout(timer);
    }, [isRunning]);

    // 🔄 SINKRONISASI TABEL
    useEffect(() => {
        fetchTable();
        let syncTimer;
        if (autoSync) {
            syncTimer = setInterval(fetchTable, 3000);
        }
        return () => clearInterval(syncTimer);
    }, [autoSync]);

    // 🚨 MANAJEMEN DARURAT PREMIUM
    const handleAction = async (actionData, confirmMsg) => {
        const result = await Swal.fire({
            title: '<span class="text-indigo-700 font-black">Konfirmasi Perintah</span>',
            html: `<div class="text-slate-600 text-sm font-bold">${confirmMsg}</div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5', // indigo-600
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Eksekusi!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const res = await axios.post(route('admin.khfy.warengine.action'), actionData);
            addLog(res.data.log, res.data.status);
            fetchTable();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Perintah Berhasil!', showConfirmButton: false, timer: 1500 });
        } catch (error) {
            addLog('Gagal mengeksekusi perintah. Cek koneksi.', 'error');
            Swal.fire('Error', 'Gagal memproses instruksi.', 'error');
        }
    };

    const getLogColor = (type) => {
        if (type === 'shoot' || type === 'success') return 'text-emerald-400 font-bold';
        if (type === 'error' || type === 'warning' || type === 'spamming') return 'text-rose-400 font-bold';
        if (type === 'info') return 'text-sky-400 font-bold';
        return 'text-purple-300 font-medium';
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="PO Command Center - MILASTORE" />
            
            <div className="min-h-screen bg-slate-50 pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
                {/* 🌈 HEADER PREMIUM */}
                <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-8 pb-20 px-4 md:px-8 rounded-b-[2rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 opacity-10 rounded-full filter blur-3xl translate-x-1/3 -translate-y-1/4"></div>
                    <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Link href={route('admin.khfy.index')} className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-md">
                                <i className="fa-solid fa-arrow-left"></i>
                            </Link>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter"><i className="fa-solid fa-crosshairs text-rose-500 mr-2"></i>War Station</h1>
                                <p className="text-[10px] md:text-xs font-black text-purple-300 uppercase tracking-widest mt-1">COMMAND CENTER • GATLING GUN MODE</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                            <button onClick={() => setIsRunning(true)} disabled={isRunning} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed">
                                <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-white animate-pulse' : 'bg-emerald-200'}`}></div>
                                {isRunning ? 'ENGINE AKTIF' : 'MULAI WAR'}
                            </button>
                            <button onClick={() => { setIsRunning(false); addLog('🛑 SISTEM DIHENTIKAN MANUAL VIA PANEL.', 'error'); }} disabled={!isRunning} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-slate-800 border-2 border-rose-500/50 text-rose-400 hover:bg-rose-500 hover:text-white font-black px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:border-slate-700 disabled:text-slate-500">
                                <i className="fa-solid fa-power-off"></i> STOP
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 🛡️ PANEL KIRI: KONTROL DARURAT */}
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><i className="fa-solid fa-shield-halved"></i></span>
                                    Kendali Darurat
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Batalkan TRX Spesifik</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={cancelRef} onChange={e => setCancelRef(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm font-bold focus:ring-indigo-500" placeholder="Ketik Ref ID..." />
                                            <button onClick={() => { if(!cancelRef) return Swal.fire('Oops','Isi Ref ID Dulu!','warning'); handleAction({ action: 'cancel_ref', ref_id: cancelRef }, `Batalkan transaksi <b>${cancelRef}</b> dan refund?`); setCancelRef(''); }} className="bg-rose-500 hover:bg-rose-600 px-4 rounded-xl font-black text-white text-xs shadow-md transition-all">BATAL</button>
                                        </div>
                                    </div>
                                    <hr className="border-slate-100" />
                                    <button onClick={() => handleAction({ action: 'kalibrasi' }, 'Mulai Sapu Jagat (Kalibrasi)? Sistem akan memaksa cek ulang seluruh transaksi nyangkut ke pusat.')} className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white py-3 rounded-xl text-xs font-black transition-all border border-indigo-100 shadow-sm flex justify-center items-center gap-2">
                                        <i className="fa-solid fa-satellite-dish"></i> Kalibrasi (Sapu Jagat)
                                    </button>
                                    <button onClick={() => handleAction({ action: 'cancel_all' }, 'DARURAT! Anda yakin ingin MENGOSONGKAN SELURUH ANTREAN dan me-refund saldo semua antrean PO yang tersisa?')} className="w-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white py-3 rounded-xl text-xs font-black transition-all border border-rose-100 shadow-sm flex justify-center items-center gap-2">
                                        <i className="fa-solid fa-skull-crossbones"></i> Kosongkan Seluruh Antrean
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><i className="fa-solid fa-forward-fast"></i></span>
                                    Skip Produk Masal
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {['XLA89', 'XLA14', 'XLA39', 'XLA32', 'XLA51', 'XLA65'].map(kode => (
                                        <button key={kode} onClick={() => handleAction({ action: 'skip', kode }, `Lewati semua antrean <b class="text-rose-500">${kode}</b> dan refund saldo user?`)} className="bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white text-[10px] py-2.5 rounded-lg font-black transition-all shadow-sm">
                                            Skip {kode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 🖥️ PANEL KANAN: SYSTEM TERMINAL LOGS */}
                        <div className="lg:col-span-2 h-full">
                            <div className="bg-[#0f172a] rounded-[1.5rem] shadow-xl border border-slate-800 flex flex-col h-full min-h-[450px] overflow-hidden relative">
                                <div className="bg-slate-900/80 backdrop-blur-sm px-5 py-3.5 border-b border-slate-800 flex justify-between items-center z-10">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <i className="fa-solid fa-terminal text-purple-500"></i> SYSTEM MONITOR LOGS
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setLogs([])} className="text-[10px] text-slate-500 hover:text-rose-400 font-bold uppercase transition-colors"><i className="fa-solid fa-broom mr-1"></i> Clear</button>
                                        <span className="flex h-2.5 w-2.5 relative" title={isRunning ? 'Radar Aktif' : 'Standby'}>
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-purple-400' : 'bg-slate-600'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-purple-500' : 'bg-slate-500'}`}></span>
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 h-[400px] overflow-y-auto font-mono text-[12px] leading-relaxed relative z-0 hide-scrollbar">
                                    <div className="text-slate-600 mb-3 select-none">root@milastore-engine:~# ./start_radar.sh</div>
                                    <div className="text-purple-400/50 mb-4 select-none">Menunggu instruksi komandan...</div>
                                    {logs.map((log, i) => (
                                        <div key={i} className={`mb-1.5 ${getLogColor(log.type)} animate-in fade-in slide-in-from-bottom-1`}>
                                            <span className="text-slate-600 mr-2 select-none">[{log.time}]</span> 
                                            <span dangerouslySetInnerHTML={{ __html: log.msg.replace(/SUKSES/g, '<span class="text-emerald-400 bg-emerald-900/30 px-1 rounded">SUKSES</span>').replace(/DOR!/g, '<span class="text-rose-400 bg-rose-900/30 px-1 rounded font-black">DOR!</span>') }}></span>
                                        </div>
                                    ))}
                                    <div ref={terminalEndRef} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 📋 TABEL ANTREAN PO LIVE */}
                    <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest"><i className="fa-solid fa-list-ul text-indigo-500 mr-2"></i>Antrean PO Live</h3>
                            <button onClick={() => setAutoSync(!autoSync)} className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-all shadow-sm ${autoSync ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>
                                <i className={`fa-solid ${autoSync ? 'fa-rotate animate-spin-slow' : 'fa-pause'} mr-1`}></i>
                                {autoSync ? 'AUTO-SYNC 3s (ON)' : 'SYNC PAUSED (OFF)'}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Masuk</th>
                                        <th className="px-6 py-4">Ref ID</th>
                                        <th className="px-6 py-4">Username</th>
                                        <th className="px-6 py-4">Layanan</th>
                                        <th className="px-6 py-4">Tujuan</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Aksi Cepat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-700">
                                    {tableData.length > 0 ? tableData.map((row, i) => (
                                        <tr key={i} className="hover:bg-purple-50/30 transition-colors group">
                                            <td className="px-6 py-3.5 text-slate-500 text-xs font-bold">{row.waktu}</td>
                                            <td className="px-6 py-3.5 font-black text-indigo-600 cursor-pointer hover:text-indigo-800" onClick={() => copyToClipboard(row.ref)} title="Copy ID">{row.ref}</td>
                                            <td className="px-6 py-3.5 text-xs font-bold"><i className="fa-solid fa-user text-slate-300 mr-1"></i>{row.user}</td>
                                            <td className="px-6 py-3.5 text-xs font-black">{row.produk}</td>
                                            <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2 rounded cursor-pointer hover:bg-slate-200" onClick={() => copyToClipboard(row.tujuan)} title="Copy Nomor">{row.tujuan}</td>
                                            <td className="px-6 py-3.5">
                                                <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase ${
                                                    row.status === 'Sukses' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    row.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    row.status === 'Proses_API' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                    'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-center flex justify-center items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                {!['Sukses', 'Dibatalkan'].includes(row.status) && (
                                                    <button onClick={() => handleAction({ action: 'cancel_ref', ref_id: row.ref }, `Yakin batalkan TRX <b class="text-rose-500">${row.ref}</b> dan kembalikan saldo user?`)} className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white w-8 h-8 rounded-lg text-xs transition-colors border border-rose-100 shadow-sm" title="Batalkan & Refund">
                                                        <i className="fa-solid fa-xmark"></i>
                                                    </button>
                                                )}
                                                {['Proses_API', 'Butuh_Review', 'Gagal'].includes(row.status) && (
                                                    <button onClick={() => handleAction({ action: 'refresh_ref', ref_id: row.ref }, `Paksa TRX <b class="text-indigo-500">${row.ref}</b> kembali ke status Menunggu?`)} className="bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white w-8 h-8 rounded-lg text-xs transition-colors border border-sky-100 shadow-sm" title="Refresh / Paksa Antre">
                                                        <i className="fa-solid fa-rotate-right"></i>
                                                    </button>
                                                )}
                                                {['Sukses', 'Dibatalkan'].includes(row.status) && (
                                                    <span className="text-slate-300 text-xs italic">Selesai</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="7" className="text-center py-12 text-slate-400 font-bold text-xs"><i className="fa-solid fa-mug-hot text-2xl block mb-3 text-slate-200"></i> Radar Bersih. Tidak ada target...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Custom CSS untuk hide scrollbar di terminal */}
            <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-spin-slow { animation: spin 2s linear infinite; }
            `}} />
        </AuthenticatedLayout>
    );
}
