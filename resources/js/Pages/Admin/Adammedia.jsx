import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function Adammedia({ auth, info, products = [] }) {
    const [amount, setAmount] = useState('');
    const [search, setSearch] = useState('');
    
    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
    
    const handleSync = () => {
        Swal.fire({ title: 'Sinkronisasi Pusat...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        router.post('/admin/adammedia/sync', {}, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Sinkron Sukses!', text: 'Stok XDA dan AM terupdate.', timer: 2000, showConfirmButton: false }),
            onError: () => Swal.fire('Gagal!', 'Koneksi ke server pusat terputus.', 'error')
        });
    };

    // 🤖 SULTAN V2: MENGGUNAKAN AXIOS MURNI (ANTI STUCK / ANTI HANG)
    const handleAutoPrice = async () => {
        const { value: form, isConfirmed } = await Swal.fire({
            title: `<div class="text-xl font-black text-slate-800 uppercase tracking-tight border-b pb-3">🤖 Robot Auto Harga</div>`,
            html: `
                <div class="text-left mt-2 space-y-4">
                    <div class="bg-purple-50 border border-purple-100 p-3 rounded-xl shadow-inner">
                        <p class="text-[10px] text-purple-700 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5"><i class="fa-brands fa-whatsapp text-green-500 text-sm"></i> Paste Text Dari WhatsApp:</p>
                        <textarea id="wa-text" class="w-full bg-white border border-purple-200 rounded-lg p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-purple-300 transition-all resize-none shadow-sm" rows="6" placeholder="Contoh Paste:\nAM38 = 51.000 AKRAB MINUSAN...\nXDA13 = 45.000 XL AXIS..."></textarea>
                    </div>
                    <div class="flex gap-3">
                        <div class="flex-1">
                            <label class="text-[10px] font-black uppercase text-slate-500 ml-1">Tipe Markup</label>
                            <select id="markup-type" class="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-slate-700 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all mt-1">
                                <option value="rp">Nominal (Rp)</option>
                                <option value="percent">Persentase (%)</option>
                            </select>
                        </div>
                        <div class="flex-1">
                            <label class="text-[10px] font-black uppercase text-slate-500 ml-1">Nilai Untung</label>
                            <input id="markup-value" type="number" class="w-full bg-white border border-slate-200 rounded-xl p-3 font-black text-slate-800 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all mt-1" value="0" placeholder="Cth: 2000 atau 5">
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true, confirmButtonText: '🚀 EKSEKUSI SEKARANG', cancelButtonText: 'BATAL', buttonsStyling: false,
            customClass: {
                confirmButton: 'w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl px-5 py-3.5 mt-4 transition-all shadow-lg text-xs tracking-widest',
                cancelButton: 'w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl px-5 py-3 mt-2 transition-all',
                popup: 'rounded-[24px] p-5 w-full max-w-md shadow-2xl'
            },
            preConfirm: () => {
                const text = document.getElementById('wa-text').value;
                const type = document.getElementById('markup-type').value;
                const val = document.getElementById('markup-value').value;
                if (!text) { Swal.showValidationMessage('Teks WA tidak boleh kosong Boss!'); return false; }
                return { raw_text: text, markup_type: type, markup_value: val };
            }
        });

        if (isConfirmed && form) {
            // Loading Pop-up 100% muncul dan mengunci layar
            Swal.fire({ title: 'Robot Sedang Bekerja...', text: 'Membaca data dan menghitung harga massal.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            // Tembak API Menggunakan Axios agar 100% diproses di Background (Sangat Presisi & Cepat)
            axios.post('/admin/adammedia/auto-price', form)
                .then(res => {
                    if (res.data.success) {
                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: res.data.message, timer: 3000, showConfirmButton: false, customClass: { popup: 'rounded-[20px]' }});
                        // Reload data tabel saja secara halus tanpa reload halaman penuh
                        router.reload({ only: ['products'] });
                    } else {
                        Swal.fire('Gagal!', res.data.message, 'warning');
                    }
                })
                .catch(err => {
                    Swal.fire('Error Sistem!', err.response?.data?.message || 'Server sedang sibuk atau error.', 'error');
                });
        }
    };

    const handleInstantToggle = (p) => {
        router.post(`/admin/adammedia/update/${p.id}`, {
            is_active: p.is_active ? 0 : 1, price_sell: p.price_sell, description: p.description
        }, { preserveScroll: true });
    };

    const handleTicket = async (e) => {
        e.preventDefault();
        if (!amount) return;
        Swal.fire({ title: 'Memproses Tiket...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const res = await axios.post('/admin/adammedia/ticket', { amount });
            Swal.fire({
                title: '📩 Tiket Deposit',
                html: `<div class="p-4 bg-slate-900 text-purple-400 rounded-xl font-mono text-sm text-left leading-relaxed shadow-inner">${res.data.message.replace(/\n/g, '<br>')}</div>`,
                confirmButtonText: 'SIAP LAKSANAKAN!', confirmButtonColor: '#9333ea', customClass: { popup: 'rounded-[24px]' }
            });
            setAmount('');
        } catch (err) { Swal.fire('Gagal!', 'Terjadi kesalahan saat request tiket.', 'error'); }
    };

    const handleEdit = async (p) => {
        const { value: form, isConfirmed } = await Swal.fire({
            title: `<div class="text-lg font-black text-slate-800 uppercase tracking-tight border-b pb-3">Edit Produk</div>`,
            html: `
                <div class="text-left mt-2 space-y-4">
                    <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span class="text-[10px] font-bold text-slate-400 uppercase">Kode</span>
                        <span class="text-sm font-black text-purple-600">${p.product_code}</span>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-slate-500 ml-1">Harga Modal (Dari Pusat)</label>
                        <input id="p-cost" type="number" class="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-bold text-slate-500 text-sm outline-none mt-1" value="${p.price_cost || 0}" disabled>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-slate-500 ml-1">Harga Jual (Rp)</label>
                        <input id="p-price" type="number" class="w-full bg-white border border-slate-200 rounded-xl p-3 font-black text-slate-800 text-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all mt-1" value="${p.price_sell || 0}">
                    </div>
                </div>
            `,
            showCancelButton: true, confirmButtonText: 'SIMPAN', cancelButtonText: 'BATAL', buttonsStyling: false,
            customClass: {
                confirmButton: 'w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl px-5 py-3 mt-4 transition-all shadow-md',
                cancelButton: 'w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl px-5 py-3 mt-2 transition-all', popup: 'rounded-[24px] p-5 w-full max-w-sm'
            },
            preConfirm: () => ({ price_sell: document.getElementById('p-price').value })
        });

        if (isConfirmed && form) {
            router.post(`/admin/adammedia/update/${p.id}`, form, { preserveScroll: true, onSuccess: () => Swal.fire({ icon: 'success', title: 'Tersimpan!', timer: 1500, showConfirmButton: false }) });
        }
    };

    const filtered = products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()) || p.product_code.toLowerCase().includes(search.toLowerCase()));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Admin Pusat - MILASTORE" />
            <div className="min-h-screen bg-slate-50 pb-20 pt-6 font-sans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    
                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                                Pusat <span className="text-purple-600">MILASTORE</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Kontrol H2H API & Pricing</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={handleAutoPrice} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide shadow-md transition-all flex items-center gap-2">
                                <i className="fa-solid fa-robot"></i> Robot Auto Harga
                            </button>
                            <button onClick={handleSync} className="bg-slate-900 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide shadow-md transition-all flex items-center gap-2">
                                <i className="fa-solid fa-rotate"></i> Sync Server
                            </button>
                        </div>
                    </div>

                    {/* STATS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gradient-to-r from-slate-900 to-purple-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase text-purple-200 tracking-wider mb-1">Saldo Asli Pusat</p>
                                <h3 className="text-3xl font-black">Rp {formatRp(info?.saldo)}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Terpakai Hari Ini</p>
                            <h3 className="text-2xl font-black text-slate-700">Rp {formatRp(info?.used)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Komisi Pusat</p>
                            <h3 className="text-2xl font-black text-emerald-600">Rp {formatRp(info?.komisi)}</h3>
                        </div>
                    </div>

                    {/* ACTION BAR */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-8">
                        <form onSubmit={handleTicket} className="flex-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                            <div className="w-10 h-10 flex items-center justify-center text-slate-400"><i className="fa-solid fa-wallet"></i></div>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 bg-transparent border-none font-bold text-sm text-slate-700 outline-none focus:ring-0 placeholder:text-slate-300" placeholder="Nominal deposit server..." />
                            <button disabled={!amount} className="bg-purple-600 disabled:bg-slate-300 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] transition-all">Request</button>
                        </form>
                        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 lg:min-w-[350px]">
                            <div className="w-10 h-10 flex items-center justify-center text-slate-400"><i className="fa-solid fa-search"></i></div>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-transparent border-none font-bold text-sm text-slate-700 outline-none focus:ring-0 placeholder:text-slate-300" placeholder="Cari kode XDA / AM..." />
                        </div>
                    </div>

                    {/* PRODUCTS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtered.map(p => {
                            let badgeClass = 'bg-purple-50 text-purple-600 border border-purple-100';
                            if (p.category === 'PROMO') badgeClass = 'bg-rose-50 text-rose-600 border border-rose-100';
                            if (p.category === 'AM') badgeClass = 'bg-sky-50 text-sky-600 border border-sky-100';

                            return (
                                <div key={p.id} className={`group bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all flex flex-col ${!p.is_active ? 'opacity-60 bg-slate-50' : ''}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${badgeClass}`}>{p.product_code}</span>
                                        <span className={`text-[8px] font-black tracking-wider uppercase px-2 py-1 rounded-md ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {p.is_active ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 line-clamp-2 flex-1 leading-snug">{p.product_name}</h4>
                                    
                                    <div className="border-t border-slate-100 pt-3 mb-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Harga Jual</p>
                                        <p className="text-base font-black text-slate-900">Rp {formatRp(p.price_sell)}</p>
                                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">Modal Pusat: Rp {formatRp(p.price_cost)}</p>
                                    </div>

                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl mb-3 border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-500 uppercase ml-1">SAKLAR</span>
                                        <button onClick={() => handleInstantToggle(p)} className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${p.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${p.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    
                                    <button onClick={() => handleEdit(p)} className="w-full bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all">
                                        Edit Produk
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
