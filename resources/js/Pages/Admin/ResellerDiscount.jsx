import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

export default function ResellerDiscount({ khfy = 0, adam = 0, kaje = 0, flash = {} }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        khfy: khfy,
        adam: adam,
        kaje: kaje,
    });

    const [simulasiHarga, setSimulasiHarga] = useState(50000);
    const [simulasiModal, setSimulasiModal] = useState(48000);
    const [selectedProv, setSelectedProv] = useState('khfy');

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const handlePreset = (provider, amount) => {
        const current = parseInt(data[provider]) || 0;
        setData(provider, Math.max(0, current + amount));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.reseller.discounts.update'), {
            preserveScroll: true,
        });
    };

    // Kalkulasi Live Simulasi
    const diskonAktif = parseInt(data[selectedProv]) || 0;
    const hargaSetelahDiskon = Math.max(simulasiHarga - diskonAktif, simulasiModal > 0 ? simulasiModal : 1);
    const profit = hargaSetelahDiskon - simulasiModal;

    const providerList = [
        {
            key: 'khfy',
            name: 'KHFY PAYWAY',
            badge: 'Fast Route',
            icon: '⚡',
            color: 'from-blue-600 to-cyan-500',
            border: 'border-cyan-500/30',
            bgGlow: 'hover:shadow-cyan-500/10',
            desc: 'Jalur instan transaksi XL, Axis, & Khfy Engine'
        },
        {
            key: 'adam',
            name: 'ADAM SERVER',
            badge: 'Backup Gateway',
            icon: '🛡️',
            color: 'from-purple-600 to-indigo-500',
            border: 'border-purple-500/30',
            bgGlow: 'hover:shadow-purple-500/10',
            desc: 'Jalur cadangan failover & multi-payment'
        },
        {
            key: 'kaje',
            name: 'KAJE DIRECT (KJ)',
            badge: 'Direct Host',
            icon: '👑',
            color: 'from-amber-600 to-yellow-500',
            border: 'border-amber-500/30',
            bgGlow: 'hover:shadow-amber-500/10',
            desc: 'Jalur Host-to-Host kuota murah & dor akrab'
        }
    ];

    return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8 font-sans antialiased selection:bg-cyan-500 selection:text-black">
            <Head title="Reseller Discount Management - MILASTORE" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* TOP BAR / HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
                            🏷️
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg md:text-xl font-black tracking-tight text-white uppercase">
                                    Reseller Discount Matrix
                                </h1>
                                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    V2 Smart Cache
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Atur margin potongan harga otomatis khusus akun level Reseller & Admin.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin"
                            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700/60 transition"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* ALERT NOTIFICATION */}
                {recentlySuccessful && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/20 animate-fade">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            ✅ Potongan harga reseller berhasil diperbarui & cache server telah disegarkan!
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* FORM SETTING DISKON */}
                    <div className="lg:col-span-2 space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {providerList.map((item) => (
                                <div
                                    key={item.key}
                                    className={`bg-slate-900/50 backdrop-blur-xl border ${item.border} p-5 rounded-3xl transition-all duration-300 ${item.bgGlow} relative overflow-hidden`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-sm font-bold text-white tracking-wide">
                                                        {item.name}
                                                    </h2>
                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                                        {item.badge}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400">{item.desc}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Potongan Aktif</span>
                                            <span className="text-sm font-extrabold text-cyan-400 font-mono">
                                                - {formatRupiah(data[item.key])}
                                            </span>
                                        </div>
                                    </div>

                                    {/* INPUT & PRESET BUTTONS */}
                                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={data[item.key]}
                                                onChange={(e) => setData(item.key, e.target.value)}
                                                className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                                placeholder="0"
                                            />
                                        </div>

                                        {errors[item.key] && (
                                            <p className="text-[11px] text-rose-400 font-medium">
                                                {errors[item.key]}
                                            </p>
                                        )}

                                        {/* QUICK PRESET PILLS */}
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            <span className="text-[10px] text-slate-500 font-semibold mr-1">Preset Cepat:</span>
                                            {[50, 100, 200, 500, 1000].map((amt) => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    onClick={() => handlePreset(item.key, amt)}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold font-mono border border-slate-700/60 transition active:scale-95"
                                                >
                                                    +{amt}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setData(item.key, 0)}
                                                className="px-2.5 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 text-[10px] font-bold border border-rose-800/30 transition active:scale-95 ml-auto"
                                            >
                                                Reset (0)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all duration-300 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        <span>Menyimpan & Reset Cache...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>💾 Terapkan Diskon Reseller</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* LIVE SIMULATOR & SAFETY NET PREVIEW */}
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl space-y-4 sticky top-6">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🧮</span>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                    Simulator Safety Net
                                </h3>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Uji kalkulasi pemotongan harga secara langsung untuk memastikan diskon tidak membuat harga jual minus atau berada di bawah harga modal.
                            </p>

                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Provider Target</label>
                                    <select
                                        value={selectedProv}
                                        onChange={(e) => setSelectedProv(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 mt-1"
                                    >
                                        <option value="khfy">KHFY PAYWAY</option>
                                        <option value="adam">ADAM SERVER</option>
                                        <option value="kaje">KAJE DIRECT</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Harga Katalog Normal</label>
                                    <input
                                        type="number"
                                        step="500"
                                        value={simulasiHarga}
                                        onChange={(e) => setSimulasiHarga(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Harga Modal H2H</label>
                                    <input
                                        type="number"
                                        step="500"
                                        value={simulasiModal}
                                        onChange={(e) => setSimulasiModal(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 mt-1"
                                    />
                                </div>
                            </div>

                            {/* PREVIEW BOX */}
                            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2 mt-4 font-mono text-xs">
                                <div className="flex justify-between text-slate-400">
                                    <span>Harga Awal:</span>
                                    <span>{formatRupiah(simulasiHarga)}</span>
                                </div>
                                <div className="flex justify-between text-cyan-400">
                                    <span>Diskon ({selectedProv.toUpperCase()}):</span>
                                    <span>- {formatRupiah(diskonAktif)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Batas Modal:</span>
                                    <span>{formatRupiah(simulasiModal)}</span>
                                </div>
                                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white">
                                    <span>Harga Reseller:</span>
                                    <span className="text-emerald-400">{formatRupiah(hargaSetelahDiskon)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] pt-1">
                                    <span className="text-slate-500">Margin Profit:</span>
                                    <span className={profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                        {formatRupiah(profit)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[10px] text-cyan-300/80 leading-relaxed">
                                💡 <strong>Fitur Anti-Rugi Aktif:</strong> Sistem secara otomatis membatasi harga reseller agar tidak tembus lebih murah dari harga modal produk.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
