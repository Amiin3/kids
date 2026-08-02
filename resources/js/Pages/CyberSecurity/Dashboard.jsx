import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ auth, stats, recent_logs, banned_list }) {
    const [osintTarget, setOsintTarget] = useState('');
    const [osintResult, setOsintResult] = useState(null);
    const [osintType, setOsintType] = useState('');
    const [osintError, setOsintError] = useState('');
    const [isOsintRunning, setIsOsintRunning] = useState(false);

    const [malwareResult, setMalwareResult] = useState(null);
    const [scannedCount, setScannedCount] = useState(0);
    const [isMalwareRunning, setIsMalwareRunning] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    const runOsint = async () => {
        if(!osintTarget) return;
        setIsOsintRunning(true); setOsintResult(null); setOsintError(''); setOsintType('');
        try {
            const response = await axios.post('/admin/cyber-security/osint', { target: osintTarget });
            if (response.data.status === 'success') {
                setOsintResult(response.data.data);
                setOsintType(response.data.type);
                showToast("Pelacakan selesai!");
            } else {
                setOsintError(response.data.message);
            }
        } catch (error) { setOsintError("Terjadi kesalahan jaringan OSINT."); }
        setIsOsintRunning(false);
    };

    const runMalwareScan = async () => {
        setIsMalwareRunning(true); setMalwareResult(null);
        try {
            const response = await axios.post('/admin/cyber-security/malware-scan');
            setMalwareResult(response.data.infected_files);
            setScannedCount(response.data.scanned_count);
            showToast("Pemindaian mendalam selesai!");
        } catch (error) { alert("Gagal menjalankan pemindaian Malware!"); }
        setIsMalwareRunning(false);
    };

    const deleteFile = async (path) => {
        if(!confirm("Yakin ingin memusnahkan file berbahaya ini dari server?")) return;
        try {
            const res = await axios.post('/admin/cyber-security/malware-delete', { path });
            if(res.data.status === 'success') {
                showToast("File berhasil dimusnahkan!");
                setMalwareResult(malwareResult.filter(f => f.path !== path));
            }
        } catch (e) { alert("Gagal menghapus file."); }
    };

    const unblockIp = async (id) => {
        try {
            await axios.post('/admin/cyber-security/unblock', { id });
            showToast("IP berhasil di-unblock!");
            router.reload();
        } catch(e) { alert("Gagal unblock IP."); }
    };

    const clearLogs = async () => {
        if(!confirm("Hapus seluruh log riwayat serangan?")) return;
        try {
            await axios.post('/admin/cyber-security/clear-logs');
            showToast("Log berhasil dibersihkan!");
            router.reload();
        } catch(e) { alert("Gagal membersihkan log."); }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Pusat Keamanan Siber - CY STORE" />

            <div className="min-h-screen bg-[#07090e] text-slate-200 p-4 md:p-8 font-mono pb-24">
                
                {toastMessage && (
                    <div className="fixed bottom-5 right-5 z-50 bg-emerald-500 text-slate-950 px-6 py-3 rounded-xl font-bold shadow-2xl border border-emerald-400 animate-bounce">
                        ⚡ {toastMessage}
                    </div>
                )}

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-[#111620] border border-slate-800 p-6 rounded-2xl shadow-2xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                            <h1 className="text-2xl md:text-3xl font-black text-emerald-400 tracking-wider">CYBER COMMAND CENTER</h1>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">NASA-Grade WAF, OSINT Tracker & Malware Hunter Active</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-4">
                        <div className="bg-[#181f2d] border border-rose-500/30 px-5 py-3 rounded-xl text-center shadow-inner">
                            <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Serangan Dicegat</span>
                            <span className="text-2xl font-black text-rose-500">{stats?.total_attacks || 0}</span>
                        </div>
                        <div className="bg-[#181f2d] border border-amber-500/30 px-5 py-3 rounded-xl text-center shadow-inner">
                            <span className="block text-[10px] text-slate-400 uppercase tracking-widest">IP Banned Active</span>
                            <span className="text-2xl font-black text-amber-400">{stats?.banned_ips || 0}</span>
                        </div>
                    </div>
                </div>

                {/* TOOLS GRID: OSINT & MALWARE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    
                    {/* OSINT TOOL */}
                    <div className="bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-satellite-dish"></i> OSINT / Digital Footprint Tracker
                            </h2>
                            <p className="text-xs text-slate-400 mb-4">Lacak jejak IP, bedah nomor HP penipu, atau cek reputasi Email di Dark Web.</p>
                            
                            <div className="flex gap-2 mb-4">
                                <input 
                                    value={osintTarget} 
                                    onChange={(e) => setOsintTarget(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && runOsint()}
                                    type="text" 
                                    placeholder="Ketik IP / No HP (0812...) / Email..." 
                                    className="w-full bg-[#181f2d] border border-slate-700 rounded-xl px-4 py-2.5 text-emerald-400 text-sm focus:border-blue-500 outline-none"
                                />
                                <button 
                                    onClick={runOsint} 
                                    disabled={isOsintRunning} 
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase transition disabled:opacity-50"
                                >
                                    {isOsintRunning ? 'Melacak...' : 'Lacak'}
                                </button>
                            </div>
                            
                            {osintError && <div className="text-rose-400 text-xs mb-4 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{osintError}</div>}

                            {osintResult && (
                                <div className="bg-[#181f2d] border border-blue-500/30 p-4 rounded-xl text-xs text-slate-300">
                                    {osintType === 'phone' && (
                                        <div className="grid grid-cols-2 gap-y-3">
                                            <div className="text-slate-500">Nomor Target</div><div className="font-bold text-amber-400 text-sm">{osintResult.phone}</div>
                                            <div className="text-slate-500">Negara Asal</div><div>{osintResult.country}</div>
                                            <div className="text-slate-500">Jaringan / Operator</div><div className="font-bold text-blue-400">{osintResult.provider}</div>
                                            <div className="text-slate-500">Status Keamanan</div>
                                            <div>
                                                {osintResult.is_virtual 
                                                    ? <span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded">⚠️ Virtual Number / Scam</span>
                                                    : <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">✅ Nomor Registrasi Nasional</span>
                                                }
                                            </div>
                                            <div className="text-slate-500 mt-2">Lacak Nama Asli</div>
                                            <div className="mt-2">
                                                <a href={osintResult.getcontact_link} target="_blank" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
                                                    🔍 Cek Tag GetContact
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {osintType === 'email' && (
                                        <div className="grid grid-cols-2 gap-y-3">
                                            <div className="text-slate-500">Target Email</div><div className="font-bold text-blue-400">{osintResult.email}</div>
                                            <div className="text-slate-500">Reputasi</div>
                                            <div>
                                                {osintResult.suspicious 
                                                    ? <span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded font-bold">⚠️ MENCURIGAKAN</span>
                                                    : <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold">✅ BAIK</span>
                                                }
                                            </div>
                                            <div className="text-slate-500">Pernah Bocor?</div>
                                            <div>{osintResult.credentials_leaked ? '🔴 YA (Di Darkweb)' : '🟢 TIDAK'}</div>
                                            <div className="text-slate-500">Akun Terhubung</div>
                                            <div className="flex flex-wrap gap-1">
                                                {osintResult.profiles && osintResult.profiles.length > 0 
                                                    ? osintResult.profiles.map(p => <span key={p} className="bg-slate-700 px-2 py-0.5 rounded text-[10px]">{p}</span>)
                                                    : '-'
                                                }
                                            </div>
                                        </div>
                                    )}

                                    {osintType === 'ip' && (
                                        <div className="grid grid-cols-2 gap-y-2">
                                            <div className="text-slate-500">Target IP</div><div className="font-bold text-white font-mono">{osintResult.query}</div>
                                            <div className="text-slate-500">Lokasi</div><div>{osintResult.city}, {osintResult.country}</div>
                                            <div className="text-slate-500">ISP / Jaringan</div><div className="truncate">{osintResult.isp}</div>
                                            <div className="text-slate-500">Status Node</div>
                                            <div>
                                                {(osintResult.proxy || osintResult.hosting) 
                                                    ? <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 text-[10px] font-bold">⚠️ DATACENTER / VPN</span>
                                                    : <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px] font-bold">✅ RESIDENTIAL (AMAN)</span>
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MALWARE SCANNER */}
                    <div className="bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-virus-covid-slash"></i> Deep Malware & Shell Hunter
                            </h2>
                            <p className="text-xs text-slate-400 mb-4">Pindai folder publik dan direktori upload dari script backdoor, trojan, dan gambar beracun.</p>
                            
                            <button 
                                onClick={runMalwareScan} 
                                disabled={isMalwareRunning} 
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 shadow-lg shadow-purple-600/20 mb-4"
                            >
                                {isMalwareRunning ? 'Menganalisis Direktori Server...' : 'Mulai Pemindaian Mendalam'}
                            </button>

                            {malwareResult && (
                                <div>
                                    {malwareResult.length === 0 ? (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-center text-xs font-bold">
                                            ✅ Sistem Bersih! {scannedCount} file telah dipindai tanpa ancaman.
                                        </div>
                                    ) : (
                                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl max-h-40 overflow-y-auto">
                                            <strong className="text-xs">⚠️ Ditemukan {malwareResult.length} Ancaman:</strong>
                                            <ul className="mt-2 space-y-2 text-xs">
                                                {malwareResult.map((file, i) => (
                                                    <li key={i} className="flex justify-between items-center bg-[#181f2d] p-2 rounded-lg border border-rose-500/30">
                                                        <div>
                                                            <span className="font-bold text-white">{file.file}</span><br/>
                                                            <span className="text-rose-400 text-[10px]">{file.threat}</span>
                                                        </div>
                                                        <button onClick={() => deleteFile(file.path)} className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase">
                                                            Hapus
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* LOGS & BANNED IPS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LIVE WAF LOGS */}
                    <div className="lg:col-span-2 bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-black text-rose-400 uppercase tracking-widest border-l-4 border-rose-500 pl-3">
                                Live WAF Intercept Logs
                            </h2>
                            {recent_logs?.length > 0 && (
                                <button onClick={clearLogs} className="px-3 py-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition border border-slate-700">
                                    Bersihkan Log
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#181f2d] text-slate-400 uppercase">
                                    <tr>
                                        <th className="p-3">Waktu</th>
                                        <th className="p-3">IP Penyerang</th>
                                        <th className="p-3">Pola Ancaman & Target</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {recent_logs?.length > 0 ? recent_logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-[#181f2d]/40">
                                            <td className="p-3 whitespace-nowrap text-slate-400">{new Date(log.created_at).toLocaleTimeString('id-ID')}</td>
                                            <td className="p-3 font-bold text-rose-400 font-mono">{log.ip}</td>
                                            <td className="p-3">
                                                <div className="text-amber-400 font-bold">{log.pattern}</div>
                                                <div className="text-slate-500 truncate max-w-xs md:max-w-md">{log.url}</div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="p-8 text-center text-slate-500 font-bold uppercase">Belum ada serangan terekam.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* BANNED IPS */}
                    <div className="bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest border-l-4 border-amber-400 pl-3 mb-4">
                            Active Banned IPs ({banned_list?.length || 0})
                        </h2>
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {banned_list?.length > 0 ? banned_list.map((banned) => (
                                <div key={banned.id} className="bg-[#181f2d] border border-slate-800 p-3.5 rounded-xl flex justify-between items-center">
                                    <div>
                                        <div className="font-mono font-bold text-rose-400 text-xs">{banned.ip}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">{banned.reason}</div>
                                    </div>
                                    <button 
                                        onClick={() => unblockIp(banned.id)}
                                        className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition border border-emerald-500/30"
                                    >
                                        Unblock
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center text-slate-500 text-xs py-10 uppercase font-bold">Tidak ada IP terblokir</div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
