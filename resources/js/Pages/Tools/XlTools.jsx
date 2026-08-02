import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function XlTools({ auth, userBalance }) {
    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Cek Hutang & Tools - MilaStore" />
            <div className="min-h-screen bg-[#F4F7FB] font-['Outfit'] pb-40">
                <div className="p-8 pb-20 text-white shadow-xl relative overflow-hidden rounded-b-[45px]" style={{background: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)'}}>
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="max-w-md mx-auto flex justify-between items-center relative z-10">
                        <Link href="/dashboard" className="text-white w-8 h-8 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-md transition-transform hover:-translate-x-1">
                            <i className="fa-solid fa-arrow-left-long"></i>
                        </Link>
                        <div className="text-center">
                            <h1 className="text-xl font-black tracking-tight m-0 uppercase drop-shadow-md">Cek Hutang & Tools</h1>
                            <div className="mt-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-inner">Saldo: Rp {formatRp(userBalance)}</div>
                        </div>
                        <div className="w-8"></div>
                    </div>
                    <i className="fa-solid fa-toolbox absolute right-5 -bottom-5 text-8xl text-white opacity-10 -rotate-12"></i>
                </div>

                <div className="max-w-md mx-auto px-5 -mt-12 relative z-20 space-y-4">
                    {/* MENU CEK HUTANG TELKOMSEL */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-xl font-black">
                                <i className="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-sm">Cek Hutang Telkomsel</h3>
                                <p className="text-[11px] font-bold text-slate-400">Cek status pulsa siaga / hutang</p>
                            </div>
                        </div>
                        <a href="tel:*805#" className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all">Dial *805#</a>
                    </div>

                    {/* MENU CEK KUOTA / INFO */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl font-black">
                                <i className="fa-solid fa-sim-card"></i>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-sm">Cek Kuota XL / Axis</h3>
                                <p className="text-[11px] font-bold text-slate-400">Informasi sisa kuota reguler</p>
                            </div>
                        </div>
                        <a href="tel:*808#" className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all">Dial *808#</a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
