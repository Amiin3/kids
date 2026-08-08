import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head, router } from "@inertiajs/react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import Swal from "sweetalert2";
import "axios";
import "moment";
function KhfyManager({ auth, layanan, categories, filter_cat }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isMarkupSelected, setIsMarkupSelected] = useState(false);
  const bulkForm = useForm({ action_type: "", bulk_mode: "flat", bulk_val: "", ids: [] });
  const syncForm = useForm({ markup_value: 1e3, reset_harga: false, hard_sync: false });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", nama_layanan: "", deskripsi: "", harga_jual: "" });
  const submitEdit = (e) => {
    e.preventDefault();
    router.post(route("admin.khfy.update_single"), editForm, {
      onSuccess: () => {
        setShowEditModal(false);
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Data diperbarui!", showConfirmButton: false, timer: 1500 });
      }
    });
  };
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(n);
  const toggleStatus = (p) => {
    const newStatus = p.status === "active" ? "inactive" : "active";
    router.post(route("admin.khfy.bulk"), { action_type: newStatus, ids: [p.id] }, {
      preserveScroll: true,
      onSuccess: () => Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Status Diubah!", showConfirmButton: false, timer: 1500 })
    });
  };
  const deleteSingle = (p) => {
    Swal.fire({
      title: "Hapus Produk?",
      html: `Yakin ingin menghapus <b class="text-rose-500">${p.nama_layanan}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      confirmButtonText: "Ya, Hapus!"
    }).then((result) => {
      if (result.isConfirmed) {
        router.post(route("admin.khfy.bulk"), { action_type: "delete", ids: [p.id] }, {
          preserveScroll: true,
          onSuccess: () => Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Produk Dihapus!", showConfirmButton: false, timer: 1500 })
        });
      }
    });
  };
  const runBulk = (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return Swal.fire("Error", "Pilih produk dulu, Bos!", "error");
    if (bulkForm.data.action_type === "markup" && !bulkForm.data.bulk_val) return Swal.fire("Error", "Isi nominal profitnya!", "error");
    router.post(route("admin.khfy.bulk"), { ...bulkForm.data, ids: selectedIds }, {
      onSuccess: () => {
        setSelectedIds([]);
        bulkForm.reset();
        setIsMarkupSelected(false);
        Swal.fire("Berhasil!", "Aksi massal sukses.", "success");
      }
    });
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Khfy Manager - MILASTORE" }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50 pb-20 font-['Plus_Jakarta_Sans',sans-serif]", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 pt-8 pb-20 px-4 md:px-8 rounded-b-[2rem] shadow-xl relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-72 h-72 bg-white opacity-5 rounded-full filter blur-3xl translate-x-1/2 -translate-y-1/4" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-black text-white tracking-tighter", children: "Produk KhfyPay" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-purple-200 uppercase tracking-widest mt-1", children: "SULTAN EDITION • PANEL KONTROL KHFY" })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setShowSyncModal(true), className: "bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-white/20 transition-all shadow-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-rotate" }),
            " KELOLA SYNC"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between", children: [
          /* @__PURE__ */ jsxs("form", { onSubmit: runBulk, className: "flex flex-wrap gap-3 items-center", children: [
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: bulkForm.data.action_type,
                onChange: (e) => {
                  bulkForm.setData("action_type", e.target.value);
                  setIsMarkupSelected(e.target.value === "markup");
                },
                className: "rounded-xl border-slate-200 bg-slate-50 text-[11px] font-bold py-2.5 px-4 focus:ring-purple-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "- Aksi Massal -" }),
                  /* @__PURE__ */ jsx("option", { value: "markup", children: "Update Profit (Markup)" }),
                  /* @__PURE__ */ jsx("option", { value: "active", children: "Aktifkan (ON)" }),
                  /* @__PURE__ */ jsx("option", { value: "inactive", children: "Sembunyikan (OFF)" }),
                  /* @__PURE__ */ jsx("option", { value: "delete", children: "Hapus Produk" })
                ]
              }
            ),
            isMarkupSelected && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 animate-in fade-in zoom-in-95", children: [
              /* @__PURE__ */ jsxs("select", { value: bulkForm.data.bulk_mode, onChange: (e) => bulkForm.setData("bulk_mode", e.target.value), className: "rounded-xl border-slate-200 bg-slate-50 text-[11px] font-bold py-2.5 px-3", children: [
                /* @__PURE__ */ jsx("option", { value: "flat", children: "Rp" }),
                /* @__PURE__ */ jsx("option", { value: "percent", children: "%" })
              ] }),
              /* @__PURE__ */ jsx("input", { type: "number", value: bulkForm.data.bulk_val, onChange: (e) => bulkForm.setData("bulk_val", e.target.value), placeholder: "Nominal", className: "w-28 rounded-xl border-slate-200 bg-indigo-50 text-[11px] font-black text-indigo-700 shadow-inner" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] hover:bg-indigo-600 transition-all shadow-md", children: "TERAPKAN" })
          ] }),
          /* @__PURE__ */ jsxs("select", { value: filter_cat || "", onChange: (e) => router.get(route("admin.khfy.index"), { cat: e.target.value }), className: "rounded-xl border-slate-200 bg-purple-50 text-[11px] font-black text-purple-700 py-2.5 px-4 shadow-sm border-purple-100", children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Semua Kategori" }),
            categories.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-[1rem] shadow-sm border border-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50/80 border-b border-slate-100", children: /* @__PURE__ */ jsxs("tr", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 w-10 text-center", children: /* @__PURE__ */ jsx("input", { type: "checkbox", onChange: (e) => e.target.checked ? setSelectedIds(layanan.map((l) => l.id)) : setSelectedIds([]), checked: selectedIds.length === layanan.length && layanan.length > 0, className: "rounded border-slate-300" }) }),
            /* @__PURE__ */ jsx("th", { className: "p-4", children: "Produk" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 whitespace-nowrap", children: "Harga Pusat" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 whitespace-nowrap", children: "Harga Jual" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 text-right pr-6", children: "Aksi Cepat" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-50", children: layanan.map((p) => /* @__PURE__ */ jsxs("tr", { className: `hover:bg-purple-50/30 transition-all group ${selectedIds.includes(p.id) ? "bg-indigo-50/20" : ""} ${p.status !== "active" ? "opacity-60 grayscale-[30%]" : ""}`, children: [
            /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selectedIds.includes(p.id), onChange: () => setSelectedIds((prev) => prev.includes(p.id) ? prev.filter((i) => i !== p.id) : [...prev, p.id]), className: "rounded border-slate-300" }) }),
            /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-black text-slate-800", children: p.nama_layanan }),
              /* @__PURE__ */ jsxs("div", { className: "text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter", children: [
                p.kode_layanan,
                " • ",
                /* @__PURE__ */ jsx("span", { className: "text-purple-500", children: p.kategori })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-4 text-[11px] font-black text-slate-400", children: [
              "Rp ",
              formatRp(p.harga_beli)
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-4 text-sm font-black text-indigo-600", children: [
              "Rp ",
              formatRp(p.harga_jual)
            ] }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${p.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`, children: p.status === "active" ? "Tampil" : "Sembunyi" }) }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-right pr-6", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => toggleStatus(p), title: p.status === "active" ? "Sembunyikan" : "Tampilkan", className: `w-8 h-8 rounded-lg flex items-center justify-center text-[11px] transition-all border ${p.status === "active" ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white"}`, children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${p.status === "active" ? "fa-eye-slash" : "fa-eye"}` }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setEditForm({ id: p.id, nama_layanan: p.nama_layanan, deskripsi: p.deskripsi || "", harga_jual: p.harga_jual });
                setShowEditModal(true);
              }, title: "Edit", className: "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] transition-all border bg-slate-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-pen" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => deleteSingle(p), title: "Hapus", className: "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] transition-all border bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-trash" }) })
            ] }) })
          ] }, p.id)) })
        ] }) })
      ] })
    ] }),
    (showEditModal || showSyncModal) && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 border border-slate-100", children: [
      showEditModal && /* @__PURE__ */ jsxs("form", { onSubmit: submitEdit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-xl font-black text-slate-800 mb-4", children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-pen-to-square text-indigo-500 mr-2" }),
          "Edit Produk"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[9px] font-black text-slate-400 uppercase", children: "Nama" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: editForm.nama_layanan, onChange: (e) => setEditForm({ ...editForm, nama_layanan: e.target.value }), className: "w-full rounded-xl border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:ring-indigo-500" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[9px] font-black text-slate-400 uppercase", children: "Harga Jual" }),
          /* @__PURE__ */ jsx("input", { type: "number", value: editForm.harga_jual, onChange: (e) => setEditForm({ ...editForm, harga_jual: e.target.value }), className: "w-full rounded-xl border-slate-200 text-sm font-black text-indigo-600 bg-slate-50 focus:bg-white focus:ring-indigo-500" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[9px] font-black text-slate-400 uppercase", children: "Deskripsi" }),
          /* @__PURE__ */ jsx("textarea", { value: editForm.deskripsi, onChange: (e) => setEditForm({ ...editForm, deskripsi: e.target.value }), className: "w-full rounded-xl border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-indigo-500", rows: 3 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowEditModal(false), className: "flex-1 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all", children: "BATAL" }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all", children: "SIMPAN" })
        ] })
      ] }),
      showSyncModal && /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        syncForm.post(route("admin.khfy.sync"), { onSuccess: () => setShowSyncModal(false) });
      }, className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-xl font-black text-slate-800", children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-satellite-dish text-purple-500 mr-2" }),
          "Smart Sync Khfy"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[9px] font-black text-slate-500 uppercase mb-1 block", children: "Markup Profit Default (Rp)" }),
            /* @__PURE__ */ jsx("input", { type: "number", value: syncForm.data.markup_value, onChange: (e) => syncForm.setData("markup_value", e.target.value), className: "w-full rounded-xl border-slate-200 text-sm font-black text-indigo-700 shadow-inner focus:ring-purple-500" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer group", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: syncForm.data.reset_harga, onChange: (e) => syncForm.setData("reset_harga", e.target.checked), className: "rounded border-slate-300 text-purple-600 focus:ring-purple-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-600 group-hover:text-purple-600 transition-colors", children: "Timpa/Reset harga jual ke Default Profit?" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-rose-50 p-4 rounded-xl border border-rose-200", children: /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-3 cursor-pointer group", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: syncForm.data.hard_sync, onChange: (e) => syncForm.setData("hard_sync", e.target.checked), className: "rounded border-rose-300 text-rose-600 focus:ring-rose-500 mt-1" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-rose-700 block", children: "HARD SYNC (Sapu Bersih)" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium text-rose-500 block mt-0.5 leading-tight", children: "Hapus seluruh produk lama di database, ganti dengan data terbaru 100% dari pusat provider." })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowSyncModal(false), className: "flex-1 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all", children: "BATAL" }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: `flex-1 text-white py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all ${syncForm.data.hard_sync ? "bg-rose-600 hover:bg-rose-700" : "bg-purple-700 hover:bg-purple-800"}`, children: syncForm.data.hard_sync ? "🔥 EKSEKUSI HARD SYNC" : "MULAI SYNC" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  KhfyManager as default
};
