import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import '@/../../resources/css/mila-loading.css';

const ProviderBadge = ({ provider }) => {
    const brands = {
        'TELKOMSEL': { bg: 'bg-red-600 text-white', label: 'TSEL' },
        'INDOSAT': { bg: 'bg-yellow-400 text-slate-900', label: 'ISAT' },
        'XL': { bg: 'bg-blue-600 text-white', label: 'XL' },
        'AXIS': { bg: 'bg-purple-600 text-white', label: 'AXIS' },
        'TRI': { bg: 'bg-slate-900 text-white', label: 'TRI' },
        'SMARTFREN': { bg: 'bg-pink-600 text-white', label: 'SF' }
    };
    const b = brands[provider] || { bg: 'bg-indigo-600 text-white', label: 'MA' };
    return (
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black shadow-md shrink-0 ${b.bg}`}>
            {b.label}
        </div>
    );
};

export default function MasaAktif({ auth, products, userBalance }) {
    const { flash } = usePage().props;
    const [variant, setVariant] = useState('DIGIFLAZZ'); // DIGIFLAZZ / OKECONNECT
    const [phone, setPhone] = useState('');
    const [provider, setProvider] = useState(null);
    const [selected, setSelected] = useState(null);
    const [activeTab, setActiveTab] = useState('Semua');

    const { transform, post, processing } = useForm({ tujuan: '', kode_layanan: '', server: '' });
    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

    // 📡 RADAR DETEKSI OPERATOR DARI NOMOR HP
    useEffect(() => {
        if (phone.length >= 4) {
            const p4 = phone.substring(0, 4);
            const p5 = phone.substring(0, 5);

            if (['08515', '08516', '08517'].includes(p5) || ['0811','0812','0813','0821','0822','0823','0851','0852','0853'].includes(p4)) {
                setProvider('TELKOMSEL');
            } else if (['0814','0815','0816','0855','0856','0857','0858'].includes(p4)) {
                setProvider('INDOSAT');
            } else if (['0817','0818','0819','0859','0877','0878','0879'].includes(p4)) {
                setProvider('XL');
            } else if (['0831','0832','0833','0838'].includes(p4)) {
                setProvider('AXIS');
            } else if (['0895','0896','0897','0898','0899'].includes(p4)) {
                setProvider('TRI');
            } else if (['0881','0882','0883','0884','0885','0886','0887','0888','0889'].includes(p4)) {
                setProvider('SMARTFREN');
            } else {
                setProvider(null);
            }
        } else {
            setProvider(null);
            setSelected(null);
        }
    }, [phone]);

    const cleanProductName = (name) => {
        if (!name) return '';
        return name.replace(/\(OKECONNECT\)/gi, '').replace(/\(DIGIFLAZZ\)/gi, '').replace(/OKECONNECT/gi, '').replace(/DIGIFLAZZ/gi, '').trim();
    };

    // 🧠 FILTER PRODUK BERDASARKAN SERVER & PROVIDER
    const activeProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => p.server === variant);
    }, [products, variant]);

    const filteredList = useMemo(() => {
        if (!provider && activeTab === 'Semua') return activeProducts;
        return activeProducts.filter(p => {
            const name = p.nama_layanan.toUpperCase();
            const matchProv = provider ? name.includes(provider) : true;
            const matchTab = activeTab === 'Semua' ? true : name.includes(activeTab.toUpperCase());
            return matchProv && matchTab;
        });
    }, [activeProducts, provider, activeTab]);

    const handleContactPicker = async () => {
        if (window.AndroidBridge && typeof window.AndroidBridge.bukaKontak === 'function') {
            window._contactResolve = (data) => {
                if (data && data.length > 0) {
                    let number = data[0].tel[0].replace(/\D/g, '');
                    if (number.startsWith('62')) number = '0' + number.substring(2);
                    setPhone(number);
                }
            };
            window.AndroidBridge.bukaKontak();
        }
    };

    const handleOrder = () => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (!selected || cleanPhone.length < 10) return;

        if (Number(userBalance) < Number(selected.harga_jual)) {
            return Swal.fire({ icon: 'error', title: 'Saldo Kurang', text: 'Top up dompet dulu!', confirmButtonColor: '#6366f1', customClass: {popup: 'rounded-[20px]'} });
        }

        Swal.fire({
            title: `<div class="text-xl font-black text-slate-800 mt-2">Konfirmasi Masa Aktif</div>`,
            html: `
                <div class="text-left mt-3 space-y-3">
                    <div class="bg-slate-50 p-4 flex justify-between items-center rounded-[16px] border border-slate-100 shadow-sm">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">No. Tujuan</span>
                        <span class="text-sm font-black text-slate-800 font-mono tracking-widest">${cleanPhone}</span>
                    </div>
                    <div class="bg-slate-50 p-4 flex justify-between items-center rounded-[16px] border border-slate-100 shadow-sm">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Layanan</span>
                        <span class="text-xs font-black text-purple-700 text-right w-2/3 leading-tight">${cleanProductName(selected.nama_layanan)}</span>
                    </div>
                    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 flex justify-between items-center rounded-[16px] shadow-lg shadow-purple-500/30 mt-4">
                        <span class="text-xs font-black text-white/80 uppercase tracking-widest">Total Bayar</span>
                        <span class="text-xl font-black text-white drop-shadow-md">Rp {formatRp(selected.harga_jual)}</span>
                    </div>
                </div>
            `,
            showCancelButton: true, cancelButtonText: 'BATAL', confirmButtonText: 'BAYAR SEKARANG',
            buttonsStyling: false, reverseButtons: true,
            customClass: {
                confirmButton: 'w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-xs uppercase shadow-xl',
                cancelButton: 'w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-xs uppercase',
                popup: 'rounded-[28px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl'
            }
        }).then((res) => {
            if (res.isConfirmed) {
                transform((data) => ({ ...data, tujuan: cleanPhone, kode_layanan: selected.kode_layanan, server: variant }));
                
                post('/order/masa-aktif', {
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
            <Head title="Perpanjang Masa Aktif" />
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
                            <h1 className="text-xl font-black text-white tracking-widest uppercase drop-shadow-md">Masa Aktif</h1>
                            <div className="mt-1 inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-inner">
                                <i className="fa-solid fa-wallet text-fuchsia-300 text-[10px]"></i>
                                <span className="text-[10px] font-bold text-white tracking-widest">Rp {formatRp(userBalance)}</span>
                            </div>
                        </div>
                        <div className="w-10"></div>
                    </div>
                </div>

                <div className="max-w-md mx-auto px-4 -mt-10 relative z-20">
                    
                    {/* 🎛️ SEGMENTED CONTROL 2 PROVIDER (DIGIFLAZZ / OKECONNECT) */}
                    <div className="bg-slate-200/50 p-1.5 rounded-[16px] flex mb-4 shadow-sm">
                        <button 
                            onClick={() => { setVariant('DIGIFLAZZ'); setSelected(null); }} 
                            className={`flex-1 py-3 text-xs font-black rounded-[12px] transition-all tracking-widest uppercase ${variant === 'DIGIFLAZZ' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <i className="fa-solid fa-server mr-1.5"></i> Server Reguler
                        </button>
                        <button 
                            onClick={() => { setVariant('OKECONNECT'); setSelected(null); }} 
                            className={`flex-1 py-3 text-xs font-black rounded-[12px] transition-all tracking-widest uppercase ${variant === 'OKECONNECT' ? 'bg-white text-fuchsia-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <i className="fa-solid fa-fire mr-1.5"></i> Server Promo
                        </button>
                    </div>

                    {/* 📱 INPUT NOMOR HP */}
                    <div className="bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-5">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor HP Tujuan</label>
                            {provider && <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100 animate-in fade-in">{provider}</span>}
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-[16px] p-2 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-50 transition-all">
                            <input
                                type="tel"
                                className="flex-1 border-none bg-transparent focus:ring-0 font-mono text-xl font-black text-slate-800 px-3 tracking-widest placeholder-slate-300"
                                placeholder="0812xxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} maxLength="15"
                            />
                            <button onClick={handleContactPicker} className="w-11 h-11 bg-white shadow-sm border border-slate-200 text-purple-600 rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-purple-50">
                                <i className="fa-solid fa-address-book"></i>
                            </button>
                        </div>
                    </div>

                    {/* 🏷️ FILTER TAB OPERATOR */}
                    <div className="flex overflow-x-auto gap-2 mb-5 no-scrollbar pb-1">
                        {['Semua', 'Telkomsel', 'Indosat', 'XL', 'Axis', 'Tri', 'Smartfren'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSelected(null); }}
                                className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all border ${activeTab === tab ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* 📦 LIST PRODUK (KARTU) */}
                    <div className="flex flex-col gap-3">
                        {filteredList.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 shadow-sm animate-in zoom-in">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 text-2xl">
                                    <i className="fa-solid fa-box-open"></i>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Produk Tidak Tersedia</p>
                            </div>
                        ) : (
                            filteredList.map((p) => {
                                const isSelected = selected?.kode_layanan === p.kode_layanan;
                                
                                return (
                                    <div 
                                        key={p.kode_layanan} 
                                        onClick={() => setSelected(p)} 
                                        className={`p-4 rounded-[20px] transition-all cursor-pointer border relative flex items-center gap-3.5 bg-white ${isSelected ? 'border-purple-500 bg-purple-50/40 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500 scale-[1.02] z-10' : 'border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md'}`}
                                    >
                                        <ProviderBadge provider={provider || activeTab} />
                                        <div className="flex-1 pr-1">
                                            <div className="text-[9px] font-black text-slate-400 mb-0.5 tracking-widest">{p.kode_layanan}</div>
                                            <div className={`font-bold text-[13px] leading-tight ${isSelected ? 'text-purple-800' : 'text-slate-700'}`}>
                                                {cleanProductName(p.nama_layanan)}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col justify-center items-end min-w-[85px] pl-2 border-l border-slate-100">
                                            <span className={`text-[15px] font-black tracking-tight ${isSelected ? 'text-purple-600' : 'text-slate-800'}`}>
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
                {selected && phone.length >= 10 && (
                    <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-5">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[24px] p-2 pl-6 pr-2 shadow-2xl flex justify-between items-center border border-slate-700">
                            <div className="flex flex-col justify-center py-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Bayar</span>
                                <span className="text-lg font-black text-white leading-none drop-shadow-md">Rp {formatRp(selected.harga_jual)}</span>
                            </div>
                            <button onClick={handleOrder} disabled={processing} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/40 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 border border-white/10">
                                {processing ? 'PROSES...' : 'BAYAR'} <i className="fa-solid fa-fingerprint"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
