import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ auth, products = [] }) {
    // Memastikan data produk selalu aman (fallback array kosong jika null/undefined)
    const safeProducts = Array.isArray(products) ? products : [];

    // Deretan Menu Utama 100% lengkap dari versi aslinya
    const menus = [
        { name: 'Kelola Produk', icon: 'fa-box-open', color: 'text-orange-500', border: 'border-orange-500/30', url: '/kelola_produk.php' },
        { name: 'Input Stok', icon: 'fa-boxes-stacked', color: 'text-emerald-500', border: 'border-emerald-500/30', url: '/kelola_stok.php' },
        { name: 'Riwayat Trx', icon: 'fa-receipt', color: 'text-slate-100', border: 'border-slate-700', url: '/transaksi.php' },
        { name: 'Deposit', icon: 'fa-money-bill-transfer', color: 'text-blue-500', border: 'border-blue-500/30', url: '/deposits.php' },
        { name: 'Update Promo', icon: 'fa-bullhorn', color: 'text-amber-500', border: 'border-amber-500/30', url: '/kelola_promo.php' },
        { name: 'Data Member', icon: 'fa-users-gear', color: 'text-purple-500', border: 'border-purple-500/30', url: '/users.php' },
        { name: 'Tema', icon: 'fa-palette', color: 'text-pink-500', border: 'border-pink-500/30', url: '/admin_tema.php' },
        { name: 'Keuangan', icon: 'fa-sack-dollar', color: 'text-cyan-500', border: 'border-cyan-500/30', url: '/admin/keuangan' },
        { name: 'Kelola Akrab', icon: 'fa-network-wired', color: 'text-cyan-400', border: 'border-cyan-400/50', url: '/admin/akrab' },
        { name: 'Order Akrab', icon: 'fa-wifi', color: 'text-purple-400', border: 'border-purple-500/50 bg-purple-500/10', url: '/order/akrabnew' },
    ];

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Management Console - MILASTORE" />
            <div className="min-h-screen bg-[#0b0e11] text-slate-200 p-4 md:p-6 pb-20 font-sans selection:bg-blue-500/30">
                
                {/* Header Premium */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-[#151a21]/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl mb-8 shadow-2xl gap-4">
                    <div className="text-2xl font-black tracking-widest text-blue-500 drop-shadow-md">
                        <i className="fa-solid fa-server mr-3"></i>MILA<span className="text-white">STORE</span>
                    </div>
                    <div className="flex gap-5">
                        <a href="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                            <i className="fa-solid fa-globe"></i> WEB
                        </a>
                        <a href="/logout" className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-2">
                            <i className="fa-solid fa-power-off"></i> EXIT
                        </a>
                    </div>
                </div>

                {/* Console Section */}
                <h6 className="text-blue-500 font-black tracking-widest border-l-4 border-blue-500 pl-3 mb-6 uppercase text-sm drop-shadow-sm">
                    Management Console
                </h6>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-12">
                    {menus.map((menu, idx) => (
                        <a key={idx} href={menu.url} className={`flex flex-col items-center justify-center p-5 md:p-6 bg-[#1e2329]/80 backdrop-blur-sm border ${menu.border} rounded-2xl hover:bg-[#2b3139] hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_10px_20px_rgba(59,130,246,0.15)] transition-all duration-300 group`}>
                            <i className={`fa-solid ${menu.icon} text-2xl md:text-3xl mb-3 md:mb-4 ${menu.color} group-hover:text-blue-400 transition-colors drop-shadow-md`}></i>
                            <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider ${menu.color} group-hover:text-slate-100 text-center leading-tight`}>
                                {menu.name}
                            </span>
                        </a>
                    ))}
                </div>

                {/* Digiflazz Section */}
                <h6 className="text-emerald-500 font-black tracking-widest border-l-4 border-emerald-500 pl-3 mb-6 uppercase text-sm drop-shadow-sm">
                    Data Produk Digiflazz (Protected)
                </h6>

                <div className="bg-[#151a21]/90 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#1e2329] border-b border-slate-800/80">
                                <tr>
                                    <th className="px-5 md:px-8 py-4 md:py-5 font-black text-slate-500 text-[10px] md:text-xs uppercase tracking-widest">LAYANAN / PRODUK</th>
                                    <th className="px-5 md:px-8 py-4 md:py-5 font-black text-slate-500 text-[10px] md:text-xs uppercase tracking-widest">SKU DIGIFLAZZ</th>
                                    <th className="px-5 md:px-8 py-4 md:py-5 font-black text-slate-500 text-[10px] md:text-xs uppercase tracking-widest">HARGA (IDR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {safeProducts.length > 0 ? (
                                    safeProducts.map((p, i) => (
                                        <tr key={i} className="hover:bg-[#1e2329]/60 transition-colors">
                                            <td className="px-5 md:px-8 py-4 md:py-5 font-bold text-slate-200 text-xs md:text-sm">
                                                {p.layanan || p.product_name || 'Tanpa Nama'}
                                            </td>
                                            <td className="px-5 md:px-8 py-4 md:py-5 font-mono text-slate-400 text-[10px] md:text-xs">
                                                {p.kode || p.buyer_sku_code || '-'}
                                            </td>
                                            <td className="px-5 md:px-8 py-4 md:py-5 font-black text-emerald-400 drop-shadow-sm text-xs md:text-sm">
                                                Rp {new Intl.NumberFormat('id-ID').format(p.harga || p.price || 0)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-5 md:px-8 py-10 md:py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                                            Data Produk Digiflazz belum tersedia (Belum disinkronisasi).
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center mt-12 text-[10px] font-black text-slate-600 tracking-widest uppercase">
                    MILASTORE SYSTEM &bull; <span className="text-emerald-500 ml-1">STOK MANUAL AKTIF</span>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
