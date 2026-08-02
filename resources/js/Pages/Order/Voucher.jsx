import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import '@/../../resources/css/mila-loading.css';

// 🎨 LOGO & WARNA PROVIDER
const BrandIcon = ({ brand }) => {
    const logos = {
        'Telkomsel': { bg: 'bg-red-600', icon: 'fa-signal' },
        'Indosat': { bg: 'bg-yellow-400 text-slate-900', icon: 'fa-tower-cell' },
        'Tri': { bg: 'bg-slate-900', icon: 'fa-3' },
        'XL': { bg: 'bg-blue-600', icon: 'fa-bolt' },
        'Axis': { bg: 'bg-purple-600', icon: 'fa-a' },
        'Smartfren': { bg: 'bg-pink-600', icon: 'fa-wifi' },
        'Game': { bg: 'bg-indigo-600', icon: 'fa-gamepad' },
        'Lainnya': { bg: 'bg-teal-500', icon: 'fa-ticket' }
    };
    const l = logos[brand] || logos['Lainnya'];
    return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-md shrink-0 ${l.bg} ${brand !== 'Indosat' ? 'text-white' : ''}`}>
            <i className={`fa-solid ${l.icon}`}></i>
        </div>
    );
};

export default function Voucher({ auth, groupedProducts, userBalance }) {
    const { flash } = usePage().props;
    const categories = Object.keys(groupedProducts || {});
    const [activeCat, setActiveCat] = useState(categories.length > 0 ? categories[0] : 'Lainnya');
    const [tujuan, setTujuan] = useState('');
    const [selected, setSelected] = useState(null);

    const { transform, post, processing } = useForm({ tujuan: '', kode_layanan: '', server: '' });
    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

    const currentList = groupedProducts[activeCat] || [];

    // 🧹 PEMBERSIH NAMA OKECONNECT/DIGIFLAZZ
    const cleanProductName = (name) => {
        if (!name) return '';
        return name
            .replace(/\(OKECONNECT\)/gi, '')
            .replace(/\(DIGIFLAZZ\)/gi, '')
            .replace(/OKECONNECT/gi, '')
            .replace(/DIGIFLAZZ/gi, '')
            .trim();
    };

    const handleOrder = () => {
        const cleanNo = tujuan.replace(/[^0-9A-Za-z]/g, '');
        if (!selected || cleanNo.length < 4) return;

        if (Number(userBalance) < Number(selected.harga_jual)) {
            return Swal.fire({ icon: 'error', title: 'Saldo Kurang', text: 'Top up dompet dulu ya!', confirmButtonColor: '#6366f1', customClass: {popup: 'rounded-[20px]'} });
        }

        Swal.fire({
            title: `<div class="text-xl font-black text-slate-800 mt-2">Konfirmasi Order</div>`,
            html: `
                <div class="text-left mt-3 space-y-3">
                    <div class="bg-slate-50 p-4 flex justify-between items-center rounded-[16px] border border-slate-100 shadow-sm">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">No. Tujuan / ID</span>
                        <span class="text-sm font-black text-slate-800 font-mono tracking-widest">${cleanNo}</span>
                    </div>
                    <div class="bg-slate-50 p-4 flex justify-between items-center rounded-[16px] border border-slate-100 shadow-sm">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Produk</span>
                        <span class="text-xs font-black text-purple-700 text-right w-2/3 leading-tight">${cleanProductName(selected.nama_layanan)}</span>
                    </div>
                    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 flex justify-between items-center rounded-[16px] shadow-lg shadow-purple-500/30 mt-4">
                        <span class="text-xs font-black text-white/80 uppercase tracking-widest">Total Bayar</span>
                        <span class="text-xl font-black text-white drop-shadow-md">Rp ${formatRp(selected.harga_jual)}</span>
                    </div>
                </div>
            `,
            showCancelButton: true, cancelButtonText: 'BATAL', confirmButtonText: 'BELI SEKARANG',
            buttonsStyling: false, reverseButtons: true,
            customClass: {
                confirmButton: 'w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-xs uppercase shadow-xl',
                cancelButton: 'w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-xs uppercase',
                popup: 'rounded-[28px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl'
            }
        }).then((res) => {
            if (res.isConfirmed) {
                transform((data) => ({ ...data, tujuan: cleanNo, kode_layanan: selected.kode_layanan, server: selected.server }));
                
                post('/order/voucher', {
                    preserveScroll: true, preserveState: true,
                    onStart: () => {
                        Swal.fire({
                            html: `
                                <div class="mt-4 flex flex-col items-center">
                                    <div class="w-16 h-16 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg shadow-purple-500/20"></div>
                                    <p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-6">Memproses...</p>
                                </div>
                            `,
                            allowOutsideClick: false, showConfirmButton: false, buttonsStyling: false,
                            customClass: { popup: 'rounded-[32px] p-8 w-full max-w-[250px] shadow-2xl' }
                        });
                    },
                    onSuccess: (page) => {
                        const flashMessage = page.props.flash || {};
                        if (flashMessage.error) {
                            Swal.fire({ icon: 'error', title: 'Gagal', text: flashMessage.error, confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-[24px]' } });
                        } else {
                            Swal.fire({ icon: 'success', title: '<div class="text-xl font-black text-slate-800">Berhasil!</div>', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[28px] p-6 shadow-2xl' } })
                            .then(() => router.visit('/riwayat'));
                        }
                    },
                    onError: (err) => {
                        Swal.fire({ icon: 'error', title: 'Error', text: Object.values(err)[0] || 'Kesalahan internal.', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-[24px]' } });
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Voucher Data & Game" />
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            
            <div className="min-h-screen bg-slate-50 font-['Outfit'] pb-32">
                
                {/* 🚀 HEADER UNGU PREMIUM */}
                <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-5 pt-8 pb-20 rounded-b-[40px] shadow-lg shadow-purple-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                    
                    <div className="flex justify-between items-center relative z-10">
                        <button onClick={() => router.visit('/dashboard')} className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/30 active:scale-95 transition-all">
                            <i className="fa-solid fa-arrow-left-long"></i>
                        </button>
                        <div className="text-center">
                            <h1 className="text-xl font-black text-white tracking-widest uppercase drop-shadow-md">Voucher</h1>
                            <div className="mt-1 inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-inner">
                                <i className="fa-solid fa-wallet text-fuchsia-300 text-[10px]"></i>
                                <span className="text-[10px] font-bold text-white tracking-widest">Rp {formatRp(userBalance)}</span>
                            </div>
                        </div>
                        <div className="w-10"></div>
                    </div>
                </div>

                <div className="max-w-md mx-auto px-4 -mt-10 relative z-20">
                    
                    {/* 🎛️ TAB PROVIDER / MEREK HORIZONTAL */}
                    {categories.length > 0 && (
                        <div className="flex overflow-x-auto gap-2.5 mb-5 no-scrollbar pb-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => { setActiveCat(cat); setSelected(null); }}
                                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[11px] font-black tracking-wide transition-all border shadow-sm ${activeCat === cat ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <BrandIcon brand={cat} />
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 📱 INPUT NO HP / ID GAME */}
                    <div className="bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-5">
                        <div className="flex justify-between items-center mb-2.5 px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {activeCat === 'Game' ? 'Masukkan ID / Username Game' : 'Masukkan Nomor HP Penerima'}
                            </label>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-[16px] p-2 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-50 transition-all">
                            <input
                                type={activeCat === 'Game' ? "text" : "tel"}
                                className="flex-1 border-none bg-transparent focus:ring-0 font-mono text-lg font-black text-slate-800 px-3 tracking-widest placeholder-slate-300"
                                placeholder={activeCat === 'Game' ? "IDGame12345" : "08xxxxxxxxxx"} 
                                value={tujuan} 
                                onChange={(e) => setTujuan(e.target.value.replace(/[^0-9A-Za-z]/g, ''))} 
                                maxLength="25"
                            />
                        </div>
                    </div>

                    {/* 📦 LIST PRODUK (KARTU) */}
                    <div className="flex flex-col gap-3">
                        {currentList.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 shadow-sm animate-in zoom-in">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 text-2xl">
                                    <i className="fa-solid fa-box-open"></i>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Produk Tidak Tersedia</p>
                            </div>
                        ) : (
                            currentList.map((p) => {
                                const isSelected = selected?.kode_layanan === p.kode_layanan;
                                
                                return (
                                    <div 
                                        key={p.kode_layanan} 
                                        onClick={() => setSelected(p)} 
                                        className={`p-4 rounded-[20px] transition-all cursor-pointer border relative flex flex-col gap-2.5 bg-white ${isSelected ? 'border-purple-500 bg-purple-50/40 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500 scale-[1.02] z-10' : 'border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3.5 items-start">
                                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                                                    <i className="fa-solid fa-ticket"></i>
                                                </div>
                                                <div>
                                                    <div className={`font-black text-[13px] leading-tight pr-2 ${isSelected ? 'text-purple-800' : 'text-slate-800'}`}>
                                                        {cleanProductName(p.nama_layanan)}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{p.kode_layanan}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-center pt-2 border-t border-slate-50">
                                            <span className={`text-[16px] font-black tracking-tight ${isSelected ? 'text-purple-600' : 'text-slate-800'}`}>
                                                Rp {formatRp(p.harga_jual)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* 💳 CHECKOUT BAR BAWAH */}
                {selected && tujuan.length >= 4 && (
                    <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-5">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[24px] p-2 pl-6 pr-2 shadow-2xl flex justify-between items-center border border-slate-700">
                            <div className="flex flex-col justify-center py-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Bayar</span>
                                <span className="text-lg font-black text-white leading-none drop-shadow-md">Rp {formatRp(selected.harga_jual)}</span>
                            </div>
                            <button onClick={handleOrder} disabled={processing} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/40 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 border border-white/10">
                                {processing ? 'PROSES...' : 'BELI'} <i className="fa-solid fa-fingerprint"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
