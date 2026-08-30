import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function WhatsAppIndex(props) {
    const [loginMethod, setLoginMethod] = useState('pairing'); // 'pairing' | 'qr'
    const [botState, setBotState] = useState({
        status: 'OFFLINE',
        number: null,
        queue_count: 0,
        uptime: 0,
        memory: '0 MB',
        qr: null
    });
    const [logs, setLogs] = useState([]);
    const [phone, setPhone] = useState('');
    const [pairingCode, setPairingCode] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('⚡ Tes Notifikasi WhatsApp MilaStore Berhasil!');
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);
    const logContainerRef = useRef(null);

    const fetchStatusAndLogs = async () => {
        try {
            const [resStatus, resLogs] = await Promise.all([
                axios.get('/admin/whatsapp/status'),
                axios.get('/admin/whatsapp/logs')
            ]);
            if (resStatus.data) setBotState(resStatus.data);
            if (resLogs.data && resLogs.data.logs) setLogs(resLogs.data.logs);
        } catch (e) {}
    };

    useEffect(() => {
        fetchStatusAndLogs();
        const interval = setInterval(fetchStatusAndLogs, 2500);
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}j ${m}m ${s}d`;
    };

    const handleRequestPairing = async (e) => {
        e.preventDefault();
        setLoading(true);
        setActionMsg(null);
        setPairingCode('');
        try {
            const res = await axios.post('/admin/whatsapp/pairing', { phone });
            if (res.data.status && res.data.code) {
                setPairingCode(res.data.code);
                setActionMsg({ type: 'success', text: `Kode Pairing Berhasil Dibuat: ${res.data.code}` });
            } else {
                setActionMsg({ type: 'error', text: res.data.message || 'Gagal membuat kode pairing.' });
            }
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Koneksi ke gateway bot gagal.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendTest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setActionMsg(null);
        try {
            const res = await axios.post('/admin/whatsapp/send-test', {
                phone: testPhone,
                message: testMessage
            });
            if (res.data.status) {
                setActionMsg({ type: 'success', text: res.data.message });
            } else {
                setActionMsg({ type: 'error', text: res.data.message });
            }
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengirim pesan.' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetSession = async () => {
        if (!confirm('Apakah Anda yakin ingin MERESET TOTAL sesi WhatsApp? Sesi akan diputus dan data login dibersihkan.')) return;
        setLoading(true);
        setActionMsg(null);
        setPairingCode('');
        try {
            const res = await axios.post('/admin/whatsapp/logout');
            setActionMsg({ type: 'success', text: res.data.message || 'Sesi berhasil direset total!' });
            fetchStatusAndLogs();
        } catch (err) {
            setActionMsg({ type: 'error', text: 'Gagal mereset sesi.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout auth={props.auth} errors={props.errors}>
            <Head title="WhatsApp Command Center" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* HEADER INFO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">📱</span>
                            WhatsApp Command Center
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Live Monitor Sesi, Antrean Transaksi, dan Gateway Notifikasi</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                        <button 
                            onClick={handleResetSession}
                            disabled={loading}
                            className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold rounded-xl text-sm transition flex items-center gap-2"
                        >
                            🔄 Reset Sesi
                        </button>
                    </div>
                </div>

                {actionMsg && (
                    <div className={`p-4 rounded-xl text-sm font-medium border ${actionMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-red-950/40 border-red-500/30 text-red-400'}`}>
                        {actionMsg.text}
                    </div>
                )}

                {/* METRICS CARD */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status Sesi</span>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${botState.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : (botState.status === 'SCAN_QR' ? 'bg-amber-400 animate-ping' : 'bg-red-500')}`}></span>
                            <span className={`text-lg font-bold ${botState.status === 'ONLINE' ? 'text-emerald-400' : (botState.status === 'SCAN_QR' ? 'text-amber-400' : 'text-red-400')}`}>
                                {botState.status}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">{botState.number ? `+${botState.number}` : 'Belum Login'}</span>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Antrean Notif</span>
                        <div className="mt-2 text-xl font-black text-white">{botState.queue_count} <span className="text-xs font-normal text-gray-400">Pesan</span></div>
                        <span className="text-xs text-gray-500 mt-1 block">Otomatis Eksekusi</span>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">RAM Gateway</span>
                        <div className="mt-2 text-xl font-black text-cyan-400">{botState.memory}</div>
                        <span className="text-xs text-gray-500 mt-1 block">Memory RSS Node.js</span>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Uptime Bot</span>
                        <div className="mt-2 text-xl font-black text-amber-400">{formatUptime(botState.uptime)}</div>
                        <span className="text-xs text-gray-500 mt-1 block">Waktu Berjalan</span>
                    </div>
                </div>

                {/* LOGIN & TEST SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SAMBUNGKAN PERANGKAT (PAIRING CODE & QR CODE) */}
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                🔑 Sambungkan Perangkat
                            </h2>

                            {botState.status === 'ONLINE' ? (
                                <div className="p-8 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center space-y-2">
                                    <div className="text-5xl">✅</div>
                                    <div className="text-emerald-400 font-bold text-lg">WhatsApp Terhubung Aktif</div>
                                    <div className="text-gray-400 text-sm">Nomor Bot: <b className="text-white">+{botState.number}</b></div>
                                    <p className="text-xs text-gray-500 pt-2">Gateway siap menembak notifikasi transaksi dan broadcast.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* TAB SELECTOR */}
                                    <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('pairing')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginMethod === 'pairing' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            🔢 Opsi 1: Kode Pairing
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('qr')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginMethod === 'qr' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            📷 Opsi 2: Scan QR Barcode
                                        </button>
                                    </div>

                                    {/* TAB 1: PAIRING CODE */}
                                    {loginMethod === 'pairing' && (
                                        <div className="space-y-3 pt-2">
                                            <form onSubmit={handleRequestPairing} className="space-y-3">
                                                <label className="block text-xs font-medium text-gray-300">
                                                    Masukkan Nomor WhatsApp yang Ingin Dijadikan Bot:
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Contoh: 081234567890 / 6281234567890"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                                        required
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
                                                    >
                                                        {loading ? 'Proses...' : 'Minta Kode'}
                                                    </button>
                                                </div>
                                            </form>

                                            {pairingCode && (
                                                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-1 mt-3">
                                                    <span className="text-xs text-gray-400 block">Masukkan 8 Digit Kode Ini di WhatsApp HP Anda:</span>
                                                    <span className="text-3xl font-mono font-black text-emerald-400 tracking-widest selection:bg-emerald-500 selection:text-black">
                                                        {pairingCode}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500 block pt-1">Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan dengan Nomor Telepon Saja</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: SCAN QR CODE */}
                                    {loginMethod === 'qr' && (
                                        <div className="flex flex-col items-center justify-center p-6 bg-gray-950 rounded-xl border border-gray-800 text-center space-y-3">
                                            {botState.qr ? (
                                                <>
                                                    <img src={botState.qr} alt="Scan QR WhatsApp" className="w-52 h-52 rounded-xl bg-white p-2 shadow-lg" />
                                                    <div className="text-xs text-gray-400">
                                                        Buka WhatsApp &gt; Titik 3 di kanan atas &gt; <b>Perangkat Tertaut</b> &gt; <b>Tautkan Perangkat</b>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="py-12 space-y-2">
                                                    <div className="text-3xl animate-spin">⏳</div>
                                                    <div className="text-sm font-semibold text-gray-300">Menyiapkan QR Code Baru...</div>
                                                    <div className="text-xs text-gray-500">Jika tidak muncul dalam beberapa detik, klik tombol Reset Sesi.</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TEST KIRIM PESAN */}
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                ✉️ Uji Coba Kirim Pesan
                            </h2>
                            <form onSubmit={handleSendTest} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1">Nomor Tujuan Uji Coba</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 081234567890"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1">Isi Pesan</label>
                                    <textarea
                                        rows="3"
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || botState.status !== 'ONLINE'}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition ${botState.status === 'ONLINE' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                >
                                    {botState.status === 'ONLINE' ? 'Kirim Pesan Uji Coba' : 'WhatsApp Belum Terhubung'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* LIVE STREAM CONSOLE LOGS */}
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            📟 Live Console Logs (Real-time)
                        </h2>
                        <span className="text-xs bg-gray-800 text-emerald-400 px-3 py-1 rounded-full font-mono flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Polling
                        </span>
                    </div>

                    <div ref={logContainerRef} className="bg-black border border-gray-800 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-1.5">
                        {logs.length === 0 ? (
                            <div className="text-gray-600 text-center py-10">Menunggu stream aktivitas log bot...</div>
                        ) : (
                            logs.map((log, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <span className="text-gray-500">[{log.time}]</span>
                                    <span className={`font-bold ${log.type === 'error' ? 'text-red-400' : (log.type === 'warn' ? 'text-amber-400' : 'text-emerald-400')}`}>
                                        [{log.type.toUpperCase()}]
                                    </span>
                                    <span className="text-gray-300">{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
