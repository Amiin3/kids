import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Swal from 'sweetalert2';

export default function KhfyManager({ auth, layanan, categories, filter_cat }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [isMarkupSelected, setIsMarkupSelected] = useState(false);
    const bulkForm = useForm({ action_type: '', bulk_mode: 'flat', bulk_val: '', ids: [] });
    
    // 🔥 TAMBAHAN FITUR HARD SYNC & RESET HARGA DI MODAL
    const syncForm = useForm({ markup_value: 1000, reset_harga: false, hard_sync: false });
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', nama_layanan: '', deskripsi: '', harga_jual: '' });

    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('admin.khfy.update_single'), editForm, {
            onSuccess: () => { setShowEditModal(false); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Data diperbarui!', showConfirmButton: false, timer: 1500 }); }
        });
    };

    const formatRp = (n) => new Intl.NumberFormat('id-ID').format(n);

    // 🚀 FITUR TAMPIL/SEMBUNYIKAN 1 KLIK
    const toggleStatus = (p) => {
        const newStatus = p.status === 'active' ? 'inactive' : 'active';
        router.post(route('admin.khfy.bulk'), { action_type: newStatus, ids: [p.id] }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Status Diubah!', showConfirmButton: false, timer: 1500 })
        });
    };

    // 🚀 FITUR HAPUS 1 KLIK
    const deleteSingle = (p) => {
        Swal.fire({
            title: 'Hapus Produk?',
            html: `Yakin ingin menghapus <b class="text-rose-500">${p.nama_layanan}</b>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            confirmButtonText: 'Ya, Hapus!'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.khfy.bulk'), { action_type: 'delete', ids: [p.id] }, {
                    preserveScroll: true,
                    onSuccess: () => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Produk Dihapus!', showConfirmButton: false, timer: 1500 })
                });
            }
        });
    };

    const runBulk = (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) return Swal.fire('Error', 'Pilih produk dulu, Bos!', 'error');
        if (bulkForm.data.action_type === 'markup' && !bulkForm.data.bulk_val) return Swal.fire('Error', 'Isi nominal profitnya!', 'error');
        
        router.post(route('admin.khfy.bulk'), { ...bulkForm.data, ids: selectedIds }, {
            onSuccess: () => { setSelectedIds([]); bulkForm.reset(); setIsMarkupSelected(false); Swal.fire('Berhasil!', 'Aksi massal sukses.', 'success'); }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Khfy Manager - MILASTORE" />
            
            <div className="min-h-screen bg-slate-50 pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
                {/* 🌈 HEADER PREMIUM */}
                <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 pt-8 pb-20 px-4 md:px-8 rounded-b-[2rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-5 rounded-full filter blur-3xl translate-x-1/2 -translate-y-1/4"></div>
                    <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter">Produk KhfyPay</h1>
                            <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest mt-1">SULTAN EDITION • PANEL KONTROL KHFY</p>
                        </div>
                        <button onClick={() => setShowSyncModal(true)} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-white/20 transition-all shadow-lg flex items-center gap-2">
                            <i className="fa-solid fa-rotate"></i> KELOLA SYNC
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20 space-y-6">
                    {/* ⚙️ CONTROLS */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                        <form onSubmit={runBulk} className="flex flex-wrap gap-3 items-center">
                            <select 
                                value={bulkForm.data.action_type} 
                                onChange={e => { bulkForm.setData('action_type', e.target.value); setIsMarkupSelected(e.target.value === 'markup'); }}
                                className="rounded-xl border-slate-200 bg-slate-50 text-[11px] font-bold py-2.5 px-4 focus:ring-purple-500 outline-none"
                            >
                                <option value="">- Aksi Massal -</option>
                                <option value="markup">Update Profit (Markup)</option>
                                <option value="active">Aktifkan (ON)</option>
                                <option value="inactive">Sembunyikan (OFF)</option>
                                <option value="delete">Hapus Produk</option>
                            </select>

                            {isMarkupSelected && (
                                <div className="flex gap-2 animate-in fade-in zoom-in-95">
                                    <select value={bulkForm.data.bulk_mode} onChange={e => bulkForm.setData('bulk_mode', e.target.value)} className="rounded-xl border-slate-200 bg-slate-50 text-[11px] font-bold py-2.5 px-3">
                                        <option value="flat">Rp</option>
                                        <option value="percent">%</option>
                                    </select>
                                    <input type="number" value={bulkForm.data.bulk_val} onChange={e => bulkForm.setData('bulk_val', e.target.value)} placeholder="Nominal" className="w-28 rounded-xl border-slate-200 bg-indigo-50 text-[11px] font-black text-indigo-700 shadow-inner" />
                                </div>
                            )}
                            <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] hover:bg-indigo-600 transition-all shadow-md">TERAPKAN</button>
                        </form>

                        <select value={filter_cat || ''} onChange={e => router.get(route('admin.khfy.index'), { cat: e.target.value })} className="rounded-xl border-slate-200 bg-purple-50 text-[11px] font-black text-purple-700 py-2.5 px-4 shadow-sm border-purple-100">
                            <option value="">Semua Kategori</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* 📊 TABEL PRODUK */}
                    <div className="bg-white rounded-[1rem] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="p-4 w-10 text-center"><input type="checkbox" onChange={(e) => e.target.checked ? setSelectedIds(layanan.map(l => l.id)) : setSelectedIds([])} checked={selectedIds.length === layanan.length && layanan.length > 0} className="rounded border-slate-300" /></th>
                                    <th className="p-4">Produk</th>
                                    <th className="p-4 whitespace-nowrap">Harga Pusat</th>
                                    <th className="p-4 whitespace-nowrap">Harga Jual</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right pr-6">Aksi Cepat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {layanan.map((p) => (
                                    <tr key={p.id} className={`hover:bg-purple-50/30 transition-all group ${selectedIds.includes(p.id) ? 'bg-indigo-50/20' : ''} ${p.status !== 'active' ? 'opacity-60 grayscale-[30%]' : ''}`}>
                                        <td className="p-4 text-center"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id])} className="rounded border-slate-300" /></td>
                                        <td className="p-4">
                                            <div className="text-sm font-black text-slate-800">{p.nama_layanan}</div>
                                            <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{p.kode_layanan} • <span className="text-purple-500">{p.kategori}</span></div>
                                        </td>
                                        <td className="p-4 text-[11px] font-black text-slate-400">Rp {formatRp(p.harga_beli)}</td>
                                        <td className="p-4 text-sm font-black text-indigo-600">Rp {formatRp(p.harga_jual)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{p.status === 'active' ? 'Tampil' : 'Sembunyi'}</span>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => toggleStatus(p)} title={p.status === 'active' ? 'Sembunyikan' : 'Tampilkan'} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] transition-all border ${p.status === 'active' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white'}`}>
                                                    <i className={`fa-solid ${p.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                                <button onClick={() => { setEditForm({id: p.id, nama_layanan: p.nama_layanan, deskripsi: p.deskripsi || '', harga_jual: p.harga_jual}); setShowEditModal(true); }} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] transition-all border bg-slate-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white">
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button onClick={() => deleteSingle(p)} title="Hapus" className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] transition-all border bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODALS (EDIT & SYNC) */}
            {(showEditModal || showSyncModal) && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 border border-slate-100">
                        {showEditModal && (
                            <form onSubmit={submitEdit} className="space-y-4">
                                <h3 className="text-xl font-black text-slate-800 mb-4"><i className="fa-solid fa-pen-to-square text-indigo-500 mr-2"></i>Edit Produk</h3>
                                <div><label className="text-[9px] font-black text-slate-400 uppercase">Nama</label><input type="text" value={editForm.nama_layanan} onChange={e => setEditForm({...editForm, nama_layanan: e.target.value})} className="w-full rounded-xl border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:ring-indigo-500" /></div>
                                <div><label className="text-[9px] font-black text-slate-400 uppercase">Harga Jual</label><input type="number" value={editForm.harga_jual} onChange={e => setEditForm({...editForm, harga_jual: e.target.value})} className="w-full rounded-xl border-slate-200 text-sm font-black text-indigo-600 bg-slate-50 focus:bg-white focus:ring-indigo-500" /></div>
                                <div><label className="text-[9px] font-black text-slate-400 uppercase">Deskripsi</label><textarea value={editForm.deskripsi} onChange={e => setEditForm({...editForm, deskripsi: e.target.value})} className="w-full rounded-xl border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-indigo-500" rows={3}></textarea></div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all">BATAL</button>
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all">SIMPAN</button>
                                </div>
                            </form>
                        )}
                        {showSyncModal && (
                            <form onSubmit={(e) => { e.preventDefault(); syncForm.post(route('admin.khfy.sync'), { onSuccess: () => setShowSyncModal(false) })}} className="space-y-5">
                                <h3 className="text-xl font-black text-slate-800"><i className="fa-solid fa-satellite-dish text-purple-500 mr-2"></i>Smart Sync Khfy</h3>
                                
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Markup Profit Default (Rp)</label>
                                        <input type="number" value={syncForm.data.markup_value} onChange={e => syncForm.setData('markup_value', e.target.value)} className="w-full rounded-xl border-slate-200 text-sm font-black text-indigo-700 shadow-inner focus:ring-purple-500" />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={syncForm.data.reset_harga} onChange={e => syncForm.setData('reset_harga', e.target.checked)} className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                                        <span className="text-[11px] font-bold text-slate-600 group-hover:text-purple-600 transition-colors">Timpa/Reset harga jual ke Default Profit?</span>
                                    </label>
                                </div>

                                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={syncForm.data.hard_sync} onChange={e => syncForm.setData('hard_sync', e.target.checked)} className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 mt-1" />
                                        <div>
                                            <span className="text-xs font-black text-rose-700 block">HARD SYNC (Sapu Bersih)</span>
                                            <span className="text-[10px] font-medium text-rose-500 block mt-0.5 leading-tight">Hapus seluruh produk lama di database, ganti dengan data terbaru 100% dari pusat provider.</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowSyncModal(false)} className="flex-1 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all">BATAL</button>
                                    <button type="submit" className={`flex-1 text-white py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all ${syncForm.data.hard_sync ? 'bg-rose-600 hover:bg-rose-700' : 'bg-purple-700 hover:bg-purple-800'}`}>
                                        {syncForm.data.hard_sync ? '🔥 EKSEKUSI HARD SYNC' : 'MULAI SYNC'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
