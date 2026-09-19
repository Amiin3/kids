import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

// 🛡️ KALKULATOR CRC16 DINAMIS QRIS
const generateDynamicQRIS = (qrisStatic, nominal) => {
    if (!qrisStatic) return "";
    let rawQris = qrisStatic.trim();
    const idx = rawQris.lastIndexOf("6304");
    if (idx !== -1) { 
        rawQris = rawQris.substring(0, idx); 
    } else { 
        rawQris = rawQris.substring(0, rawQris.length - 4); 
    }
    const nomStr = nominal.toString();
    const nomLen = nomStr.length.toString().padStart(2, '0');
    const qrisNominal = `${rawQris}54${nomLen}${nomStr}6304`;
    let crc = 0xFFFF;
    for (let i = 0; i < qrisNominal.length; i++) {
        crc ^= qrisNominal.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
            else crc = crc << 1;
        }
    }
    return qrisNominal + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

// 🏛️ LOGO RESMI QRIS NASIONAL (SVG VECTOR)
const OfficialQrisHeader = () => (
    <div className="flex items-center gap-2">
        <svg viewBox="0 0 110 38" className="h-7 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4h18v18H4V4zm4 4v10h10V8H8z" fill="#0f172a"/>
            <path d="M10 10h6v6h-6v-6zM32 4h16v6H38v6h10v6H32V4zm22 0h14v18h-6v-6h-8V4zm8 6h-2V8h2v2zm12-6h6v18h-6V4zm12 0h16v6h-10v6h10v6h-16V4z" fill="#0f172a"/>
            <path d="M4 28h18v6H4v-6zm28 0h6v6h-6v-6zm12 0h6v6h-6v-6zm12 0h18v6H56v-6z" fill="#0f172a"/>
            <path d="M2 2h22v22H2V2z" stroke="#0f172a" strokeWidth="2.5" fill="none"/>
        </svg>
        <div className="border-l border-slate-400 pl-2 leading-tight text-left">
            <span className="block text-[11px] font-black text-slate-900 tracking-tight">QR Code Standar</span>
            <span className="block text-[10px] font-black text-slate-900 tracking-tight">Pembayaran Nasional</span>
        </div>
    </div>
);

// 🦅 LOGO RESMI GPN MERAH (SVG VECTOR)
const OfficialGpnLogo = () => (
    <div className="flex flex-col items-center">
        <svg viewBox="0 0 70 50" className="h-7 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 28C22 16 38 10 58 4C48 14 42 22 40 30C36 24 30 20 22 22C18 23 14 26 12 28Z" fill="#e11d48"/>
            <path d="M8 32C18 24 28 20 42 18C34 26 30 32 28 38C22 34 16 33 8 32Z" fill="#be123c"/>
            <path d="M4 38C14 32 24 30 32 30C26 38 22 44 20 48C14 44 8 42 4 38Z" fill="#9f1239"/>
        </svg>
        <span className="text-[11px] font-black text-[#1e293b] tracking-wider mt-0.5">GPN</span>
    </div>
);

export default function Deposit({ auth, history, paymentSettings = [] }) {
    const [amount, setAmount] = useState('');
    const [metode, setMetode] = useState('QRIS_GOPAY');
    const [isLoading, setIsLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);
    const [isDownloading, setIsDownloading] = useState(false);

    const nominalOptions = [10000, 25000, 50000, 100000, 200000, 499000];
    const formatRp = (angka) => angka ? new Intl.NumberFormat('id-ID').format(angka) : '';
    const formatTime = (s) => `${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
    const handleAmountChange = (e) => setAmount(e.target.value.replace(/\D/g, ''));
    const isQris = metode.includes('QRIS');
    const isOverLimit = isQris && parseInt(amount) >= 500000;

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: `${label} berhasil disalin`,
            timer: 1500,
            showConfirmButton: false,
            background: '#ffffff',
            color: '#0f172a'
        });
    };

    const pendingTicket = (history || []).find(t => t.status === 'Pending');

    useEffect(() => {
        if (!pendingTicket) return;
        const expireTime = new Date(pendingTicket.created_at).getTime() + (24 * 60 * 60 * 1000);
        const timerId = setInterval(() => setTimeLeft(Math.max(0, Math.floor((expireTime - new Date().getTime()) / 1000))), 1000);
        return () => clearInterval(timerId);
    }, [pendingTicket]);

    useEffect(() => {
        if (!pendingTicket?.id) return;
        const pollingId = setInterval(async () => {
            try {
                const res = await axios.get(`/deposit/${pendingTicket.id}/status?_t=${new Date().getTime()}`);
                const status = res.data?.status?.toLowerCase();
                if (status === 'sukses') {
                    clearInterval(pollingId);
                    Swal.fire({
                        title: 'Pembayaran Diterima!',
                        text: `Saldo Rp ${formatRp(pendingTicket.total_bayar)} berhasil ditambahkan.`,
                        icon: 'success',
                        background: '#ffffff',
                        color: '#0f172a',
                        confirmButtonColor: '#2563eb'
                    }).then(() => router.reload({ only: ['history'] }));
                } else if (status === 'dibatalkan' || status === 'gagal') {
                    clearInterval(pollingId);
                    Swal.fire({
                        title: 'Tiket Dibatalkan',
                        text: 'Tagihan deposit telah dibatalkan.',
                        icon: 'info',
                        background: '#ffffff',
                        color: '#0f172a',
                        confirmButtonColor: '#64748b'
                    }).then(() => router.reload({ only: ['history'] }));
                }
            } catch (e) {}
        }, 3000);
        return () => clearInterval(pollingId);
    }, [pendingTicket?.id]);

    const handleDeposit = async (e) => {
        e.preventDefault();
        if (isOverLimit) return;
        if (!amount || parseInt(amount) < 1000) {
            return Swal.fire({
                title: 'Perhatian',
                text: 'Minimal deposit Rp 1.000',
                icon: 'warning',
                background: '#ffffff',
                color: '#0f172a',
                confirmButtonColor: '#2563eb'
            });
        }

        setIsLoading(true);
        try {
            const res = await axios.post('/deposit', { jumlah: amount, metode });
            setIsLoading(false);
            if (res.data.status === 'success') {
                Swal.fire({
                    title: 'Tiket Dibuat',
                    text: res.data.message,
                    icon: 'success',
                    background: '#ffffff',
                    color: '#0f172a',
                    confirmButtonColor: '#2563eb'
                }).then(() => { 
                    router.reload({ only: ['history'] }); 
                    setAmount(''); 
                });
            } else {
                Swal.fire({
                    title: 'Gagal',
                    text: res.data.message,
                    icon: 'error',
                    background: '#ffffff',
                    color: '#0f172a'
                });
            }
        } catch (error) {
            setIsLoading(false);
            Swal.fire({
                title: 'Kendala Sistem',
                text: 'Terjadi kendala saat memproses deposit.',
                icon: 'error',
                background: '#ffffff',
                color: '#0f172a'
            });
        }
    };

    const handleCancel = async (id) => {
        const confirm = await Swal.fire({
            title: 'Batalkan Tiket?',
            text: 'Tiket pembayaran ini akan dihapus dari antrean.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText: 'Kembali',
            background: '#ffffff',
            color: '#0f172a'
        });
        if (confirm.isConfirmed) {
            try { 
                await axios.post('/deposit/cancel', { id }); 
                router.reload({ only: ['history'] }); 
            } catch(e) { 
                Swal.fire({
                    title: 'Gagal',
                    text: 'Gagal membatalkan tiket.',
                    icon: 'error',
                    background: '#ffffff',
                    color: '#0f172a'
                }); 
            }
        }
    };

    const getBankData = (m) => paymentSettings.find(s => s.metode === m) || {};
    const pendingBankData = pendingTicket ? getBankData(pendingTicket.metode) : {};
    let finalQrisUrl = '';

    if (pendingTicket?.metode?.includes('QRIS') && pendingBankData.nomor) {
        const str = generateDynamicQRIS(pendingBankData.nomor, pendingTicket.total_bayar);
        finalQrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(str)}&margin=10`;
    }

    // 🎨 RENDER POSTER QRIS NASIONAL 1:1 RESOLUSI HD CANVAS
    const downloadNationalQrisPoster = async () => {
        if (!finalQrisUrl) return;
        setIsDownloading(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 1200;
            const ctx = canvas.getContext('2d');

            // 1. Background Dasar Putih
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Motif Geometris Halus (Watermark Batik)
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1.5;
            for (let x = 0; x < canvas.width; x += 50) {
                for (let y = 0; y < canvas.height; y += 50) {
                    ctx.strokeRect(x, y, 35, 35);
                }
            }

            // 3. Poligon Merah di Sisi Kiri
            ctx.fillStyle = '#f3f4f6';
            ctx.beginPath();
            ctx.moveTo(0, 240);
            ctx.lineTo(190, 390);
            ctx.lineTo(0, 540);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.moveTo(0, 270);
            ctx.lineTo(170, 390);
            ctx.lineTo(0, 510);
            ctx.closePath();
            ctx.fill();

            // 4. Poligon Merah di Pojok Kanan Bawah (Footer Curve)
            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.moveTo(canvas.width, 820);
            ctx.lineTo(440, 1200);
            ctx.lineTo(canvas.width, 1200);
            ctx.closePath();
            ctx.fill();

            // 5. Header QRIS & GPN
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 36px sans-serif';
            ctx.fillText('QRIS', 50, 75);

            ctx.font = 'bold 15px sans-serif';
            ctx.fillText('QR Code Standar', 160, 62);
            ctx.fillText('Pembayaran Nasional', 160, 82);

            ctx.fillStyle = '#be123c';
            ctx.font = '900 24px sans-serif';
            ctx.fillText('GPN', canvas.width - 110, 80);

            // 6. Nama Merchant & NMID
            const merchantName = pendingBankData.atas_nama || 'AMIFI STORE, KMB, TLGSR';
            const nmid = pendingBankData.nomor ? pendingBankData.nomor.slice(0, 19) : 'ID1024334136412';

            ctx.textAlign = 'center';
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 28px sans-serif';
            ctx.fillText(merchantName.toUpperCase(), canvas.width / 2, 190);

            ctx.fillStyle = '#334155';
            ctx.font = '600 19px sans-serif';
            ctx.fillText(`NMID: ${nmid}`, canvas.width / 2, 230);

            ctx.font = 'bold 18px sans-serif';
            ctx.fillText('A01', canvas.width / 2, 265);

            // 7. Render Gambar QR Code
            const qrImg = new Image();
            qrImg.crossOrigin = "anonymous";
            qrImg.src = finalQrisUrl;

            await new Promise((resolve, reject) => {
                qrImg.onload = resolve;
                qrImg.onerror = reject;
            });

            const qrSize = 390;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 300;
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            // 8. Keterangan Bawah QR
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText('SATU QRIS UNTUK SEMUA', canvas.width / 2, 730);

            ctx.fillStyle = '#475569';
            ctx.font = '500 15px sans-serif';
            ctx.fillText('Cek aplikasi penyelenggara', canvas.width / 2, 755);
            ctx.fillText('di: www.aspi-qris.id', canvas.width / 2, 775);

            // 9. Nominal Pas Strip Bar
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.fillRect(80, 810, canvas.width - 160, 60);
            ctx.strokeRect(80, 810, canvas.width - 160, 60);

            ctx.fillStyle = '#e11d48';
            ctx.font = '900 24px sans-serif';
            ctx.fillText(`TOTAL BAYAR: Rp ${formatRp(pendingTicket.total_bayar)}`, canvas.width / 2, 850);

            // 10. Footer Kiri (Metadata Cetak)
            ctx.textAlign = 'left';
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('Dicetak oleh: 93600914', 50, 1020);
            ctx.fillText('Versi cetak: V1.0.2024.12.16', 50, 1055);

            // 11. Footer Kanan (Petunjuk Pembayaran)
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('Cara pembayaran QRIS', canvas.width - 40, 990);

            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Buka Aplikasi • Scan dan cek • Bayar', canvas.width - 40, 1060);

            const dataUrl = canvas.toDataURL('image/png');

            if (window.AndroidBridge) {
                window.AndroidBridge.downloadBase64Image(dataUrl, `QRIS-Milastore-Rp${pendingTicket.total_bayar}.png`);
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `QRIS-Milastore-Rp${pendingTicket.total_bayar}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            Swal.fire({
                toast: true,
                position: 'top',
                icon: 'success',
                title: 'Poster QRIS berhasil diunduh',
                timer: 1500,
                showConfirmButton: false,
                background: '#ffffff',
                color: '#0f172a'
            });
        } catch (error) {
            Swal.fire({
                title: 'Gagal',
                text: 'Gagal merender poster QRIS.',
                icon: 'error',
                background: '#ffffff',
                color: '#0f172a'
            });
        }
        setIsDownloading(false);
    };

    const paymentOptions = [
        { 
            id: 'QRIS_GOPAY', 
            name: 'QRIS Instan 1 (All Payment)', 
            desc: 'DANA, OVO, GoPay, BCA Mobile, dll', 
            isQrisBadge: true,
            tag: '⚡ Otomatis',
            tagClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
        },
        { 
            id: 'QRIS_SHOPEE', 
            name: 'QRIS Instan 2 (All Payment)', 
            desc: 'ShopeePay, Livin Mandiri, BRImo, dll', 
            isQrisBadge: true,
            tag: '⚡ Otomatis',
            tagClass: 'bg-rose-50 text-rose-600 border border-rose-200' 
        },
        { 
            id: 'SEABANK', 
            name: 'SeaBank Virtual Transfer', 
            desc: 'Bebas biaya admin antar bank', 
            isTextLogo: true, 
            textLogo: 'SeaBank', 
            textClass: 'font-black text-orange-500 text-sm tracking-tight', 
            tag: 'Manual/Auto',
            tagClass: 'bg-orange-50 text-orange-600 border border-orange-200' 
        },
        { 
            id: 'JAGO', 
            name: 'Bank Jago Transfer', 
            desc: 'Transfer sesama & antar bank 24 jam', 
            isTextLogo: true, 
            textLogo: 'jago', 
            textClass: 'font-black text-amber-500 text-lg tracking-tighter lowercase', 
            tag: '24 Jam',
            tagClass: 'bg-amber-50 text-amber-700 border border-amber-200' 
        }
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Isi Saldo" />

            <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28">
                {/* 🧭 Top Navigation */}
                <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
                    <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                        <Link 
                            href="/dashboard" 
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center transition-colors text-slate-600"
                        >
                            <i className="fa-solid fa-arrow-left text-xs"></i>
                        </Link>
                        <h1 className="text-sm font-bold tracking-tight text-slate-900">Isi Saldo Akun</h1>
                        <div className="w-8"></div>
                    </div>
                </div>

                <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
                    {!pendingTicket ? (
                        <div className="space-y-4">
                            {/* 💳 Form Card */}
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                                <form onSubmit={handleDeposit} className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-semibold text-slate-600">Nominal Pengisian</label>
                                            <span className="text-[11px] text-slate-400 font-medium">Min. Rp 1.000</span>
                                        </div>
                                        <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:bg-white transition-all px-3.5 py-2.5">
                                            <span className="text-sm font-bold text-slate-400 mr-2 select-none">Rp</span>
                                            <input 
                                                type="tel" 
                                                value={formatRp(amount)} 
                                                onChange={handleAmountChange} 
                                                placeholder="0" 
                                                className="w-full bg-transparent border-0 p-0 text-2xl font-black text-slate-900 focus:ring-0 focus:outline-none placeholder:text-slate-300 tracking-tight" 
                                            />
                                            {amount && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setAmount('')}
                                                    className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] hover:bg-slate-300"
                                                >
                                                    <i className="fa-solid fa-xmark"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Preset Chips */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {nominalOptions.map(nom => (
                                            <button 
                                                type="button" 
                                                key={nom} 
                                                onClick={() => setAmount(nom.toString())} 
                                                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border ${
                                                    amount === nom.toString() 
                                                        ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-xs' 
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                Rp {formatRp(nom)}
                                            </button>
                                        ))}
                                    </div>

                                    {isOverLimit && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                                            <p className="text-xs text-red-600 font-semibold leading-relaxed">
                                                Maksimal transaksi QRIS Rp 499.000. Untuk nominal lebih besar, silakan gunakan transfer bank.
                                            </p>
                                        </div>
                                    )}

                                    {/* Methods List */}
                                    <div className="pt-2">
                                        <label className="text-xs font-semibold text-slate-600 block mb-2">Metode Pembayaran</label>
                                        <div className="space-y-2">
                                            {paymentOptions.map(opt => {
                                                const isSelected = metode === opt.id;
                                                return (
                                                    <div 
                                                        key={opt.id} 
                                                        onClick={() => setMetode(opt.id)} 
                                                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                                            isSelected 
                                                                ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500 shadow-xs' 
                                                                : 'border-slate-200/90 bg-white hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-14 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 shrink-0">
                                                                {opt.isQrisBadge ? (
                                                                    <div className="bg-[#e11d48] text-white text-[11px] font-black tracking-widest px-2 py-0.5 rounded">
                                                                        QRIS
                                                                    </div>
                                                                ) : opt.isTextLogo ? (
                                                                    <span className={opt.textClass}>{opt.textLogo}</span>
                                                                ) : (
                                                                    <img src={opt.logo} alt={opt.name} className="max-h-full max-w-full object-contain" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs font-bold text-slate-800">{opt.name}</span>
                                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${opt.tagClass}`}>
                                                                        {opt.tag}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-400 font-normal mt-0.5">{opt.desc}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                                                        }`}>
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isLoading || !amount || parseInt(amount) < 1000 || isOverLimit} 
                                        className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-wide shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                                            isOverLimit || !amount || parseInt(amount) < 1000
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                                                <span>Membuat Tiket...</span>
                                            </>
                                        ) : (
                                            <span>Lanjutkan Pembayaran</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* ⏳ KARTU POSTER RESMI QRIS STANDAR PEMBAYARAN NASIONAL */
                        <div className="space-y-4">
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-slate-800">Menunggu Pembayaran</span>
                                </div>
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    Sisa waktu {formatTime(timeLeft)}
                                </span>
                            </div>

                            {pendingTicket.metode.includes('QRIS') ? (
                                <div className="space-y-3">
                                    {/* 📜 REPLIKA POSTER STANDAR ASPI QRIS 1:1 */}
                                    <div className="relative bg-white border border-slate-300/80 rounded-2xl p-6 shadow-sm overflow-hidden text-center max-w-[340px] mx-auto">
                                        {/* Aksen Poligon Merah di Sisi Kiri */}
                                        <div className="absolute top-1/3 -left-12 w-24 h-32 bg-slate-100 rotate-45 pointer-events-none"></div>
                                        <div className="absolute top-1/3 -left-14 w-24 h-28 bg-[#e11d48] rotate-45 pointer-events-none"></div>

                                        {/* Aksen Poligon Merah di Pojok Kanan Bawah */}
                                        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#e11d48] rotate-45 pointer-events-none"></div>

                                        {/* Header Atas: Logo QRIS + GPN */}
                                        <div className="flex items-center justify-between relative z-10 mb-4 pb-2">
                                            <OfficialQrisHeader />
                                            <OfficialGpnLogo />
                                        </div>

                                        {/* Informasi Merchant */}
                                        <div className="relative z-10 mb-3">
                                            <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
                                                {pendingBankData.atas_nama || 'AMIFI STORE, KMB, TLGSR'}
                                            </h3>
                                            <p className="text-[10px] font-semibold text-slate-600 mt-0.5">
                                                NMID: {pendingBankData.nomor ? pendingBankData.nomor.slice(0, 19) : 'ID1024334136412'}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">A01</p>
                                        </div>

                                        {/* Frame QR Code Murni */}
                                        <div className="relative z-10 inline-block bg-white p-2 rounded-lg shadow-2xs border border-slate-200">
                                            {finalQrisUrl ? (
                                                <img src={finalQrisUrl} className="w-56 h-56 object-contain mx-auto" alt="QRIS Nasional" />
                                            ) : (
                                                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                                                    Memuat QR...
                                                </div>
                                            )}
                                        </div>

                                        {/* Slogan Resmi */}
                                        <div className="relative z-10 mt-3">
                                            <h5 className="text-[11px] font-extrabold text-slate-900 tracking-tight">SATU QRIS UNTUK SEMUA</h5>
                                            <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                                                Cek aplikasi penyelenggara<br/>di: www.aspi-qris.id
                                            </p>
                                        </div>

                                        {/* Strip Nominal */}
                                        <div className="relative z-10 mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between px-3">
                                            <span className="text-[10px] font-bold text-slate-500">TOTAL BAYAR:</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-black text-[#e11d48]">
                                                    Rp {formatRp(pendingTicket.total_bayar)}
                                                </span>
                                                <button 
                                                    onClick={() => copyToClipboard(pendingTicket.total_bayar, 'Nominal')}
                                                    className="text-slate-400 hover:text-blue-600 p-1"
                                                >
                                                    <i className="fa-regular fa-copy text-xs"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Footer Metadata */}
                                        <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-end justify-between text-left">
                                            <div>
                                                <p className="text-[8px] font-semibold text-slate-600">Dicetak oleh: 93600914</p>
                                                <p className="text-[8px] font-semibold text-slate-600">Versi cetak: V1.0.2024.12.16</p>
                                            </div>
                                            <div className="text-right text-white">
                                                <p className="text-[8px] font-bold opacity-95">Cara bayar QRIS</p>
                                                <p className="text-[7px] font-medium opacity-90">Buka • Scan • Bayar</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tombol Unduh Poster HD */}
                                    <button 
                                        onClick={downloadNationalQrisPoster} 
                                        disabled={isDownloading} 
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                                    >
                                        <i className={`fa-solid ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'} text-sm`}></i>
                                        <span>{isDownloading ? 'Menyiapkan Gambar HD...' : 'Simpan Poster QRIS ke HP'}</span>
                                    </button>
                                </div>
                            ) : (
                                /* Transfer Bank View */
                                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 text-xs shadow-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Metode Transfer</span>
                                        <span className="font-bold text-slate-800">{pendingTicket.metode}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Nomor Rekening Tujuan</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-slate-900 text-sm tracking-wide">{pendingBankData.nomor || '-'}</span>
                                            <button 
                                                onClick={() => copyToClipboard(pendingBankData.nomor, 'Nomor Rekening')}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <i className="fa-regular fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Atas Nama</span>
                                        <span className="font-bold text-slate-800">{pendingBankData.atas_nama || '-'}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Nominal Pas</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-black text-red-600 text-base">Rp {formatRp(pendingTicket.total_bayar)}</span>
                                            <button 
                                                onClick={() => copyToClipboard(pendingTicket.total_bayar, 'Nominal')}
                                                className="text-slate-400 hover:text-blue-600"
                                            >
                                                <i className="fa-regular fa-copy text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tombol Batal & Bantuan */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button 
                                    onClick={() => handleCancel(pendingTicket.id)} 
                                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
                                >
                                    Batalkan Tiket
                                </button>
                                <a 
                                    href={`https://wa.me/6287760390507?text=Halo%20Admin,%20saya%20sudah%20transfer%20deposit%20ID%20${pendingTicket.id}%20via%20${pendingTicket.metode}%20sebesar%20Rp%20${formatRp(pendingTicket.total_bayar)}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <i className="fa-brands fa-whatsapp text-emerald-400"></i>
                                    <span>Bantuan CS</span>
                                </a>
                            </div>
                        </div>
                    )}

                    {/* 📜 Riwayat Transaksi */}
                    <div className="space-y-2 pt-2">
                        <h2 className="text-xs font-bold text-slate-500 tracking-tight px-1">Riwayat Deposit Terakhir</h2>
                        <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                            {history.filter(h => h.status !== 'Pending').length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400 font-medium">Belum ada riwayat transaksi</div>
                            ) : (
                                history.filter(h => h.status !== 'Pending').slice(0, 10).map((r) => {
                                    const st = r.status.toLowerCase();
                                    const isSuccess = st === 'sukses';
                                    const isFailed = st === 'gagal' || st === 'dibatalkan';
                                    const dateObj = new Date(r.created_at);
                                    const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

                                    let displayMetode = r.metode;
                                    if(r.metode === 'QRIS_GOPAY') displayMetode = 'QRIS 1';
                                    if(r.metode === 'QRIS_SHOPEE') displayMetode = 'QRIS 2';

                                    return (
                                        <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                                                    isSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : isFailed ? 'bg-rose-50 text-rose-500 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                }`}>
                                                    <i className={`fa-solid ${isSuccess ? 'fa-arrow-down-left' : isFailed ? 'fa-xmark' : 'fa-clock'}`}></i>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">Rp {formatRp(r.total_bayar)}</div>
                                                    <div className="text-[11px] text-slate-400 font-medium">{displayMetode} • {formattedDate}</div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                isSuccess 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                    : isFailed 
                                                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
