import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head, router } from "@inertiajs/react";
import Swal from "sweetalert2";
import axios from "axios";
/* empty css                      */
import "moment";
function DigiflazzManager({ auth, products, stats, categories = [], brands = [] }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [markupPersen, setMarkupPersen] = useState(2);
  const [markupFlat, setMarkupFlat] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(Number(n) || 0);
  const handleSync = async () => {
    Swal.fire({
      title: `<span class="text-xl font-black text-slate-800">Sapu Jagat Data Pusat</span>`,
      html: `
                <div class="text-left mt-3 space-y-3">
                    <div class="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-600 text-xs font-bold leading-relaxed">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i> Seluruh data lama akan <b>dihapus bersih</b> dan diganti data baru dari pusat agar terhindar dari produk mati/zombie.
                    </div>
                    <div class="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs space-y-1">
                        <div class="flex justify-between font-bold text-slate-700"><span>Keuntungan Persen:</span><span class="text-indigo-600 font-black">${markupPersen}%</span></div>
                        <div class="flex justify-between font-bold text-slate-700"><span>Keuntungan Flat:</span><span class="text-indigo-600 font-black">Rp ${formatRp(markupFlat)}</span></div>
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "BERSIHKAN & UPDATE HARGA",
      cancelButtonText: "BATAL",
      buttonsStyling: false,
      reverseButtons: true,
      customClass: {
        confirmButton: "w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-[11px] uppercase shadow-xl",
        cancelButton: "w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-[11px] uppercase",
        popup: "rounded-[28px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl"
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSyncing(true);
        Swal.fire({
          html: `
                        <div class="mt-4 flex flex-col items-center">
                            <div class="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-lg shadow-indigo-500/20"></div>
                            <p class="text-sm font-black tracking-widest uppercase text-slate-700 mt-6">Menyelaraskan Sistem...</p>
                            <p class="text-[11px] font-bold text-slate-400 mt-1">Sistem sedang membersihkan data lama.</p>
                        </div>
                    `,
          allowOutsideClick: false,
          showConfirmButton: false,
          buttonsStyling: false,
          customClass: { popup: "rounded-[32px] p-8 w-full max-w-xs shadow-2xl" }
        });
        try {
          const response = await axios.post("/admin/digiflazz/sync", { markup_persen: markupPersen, markup_flat: markupFlat });
          if (response.data.success) {
            Swal.fire({ icon: "success", title: "Selesai!", text: response.data.message, confirmButtonColor: "#4f46e5", customClass: { popup: "rounded-[28px]" } }).then(() => router.reload());
          }
        } catch (error) {
          Swal.fire({ icon: "error", title: "Gagal", text: error.response?.data?.message || "Sistem Sibuk.", confirmButtonColor: "#ef4444", customClass: { popup: "rounded-[24px]" } });
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };
  const handleToggleStatus = (sku) => {
    router.post(`/admin/digiflazz/toggle/${sku}`, {}, { preserveScroll: true });
  };
  const handleEditPrice = (item) => {
    Swal.fire({
      title: `<span class="text-lg font-black text-slate-800">Ubah Harga Khusus</span>`,
      html: `<p class="text-xs text-slate-500 mb-4">${item.product_name}</p>`,
      input: "number",
      inputValue: item.price,
      showCancelButton: true,
      confirmButtonText: "SIMPAN",
      cancelButtonText: "BATAL",
      buttonsStyling: false,
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || value <= 0) return "Harga tidak boleh kosong!";
      },
      customClass: {
        confirmButton: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-xs uppercase shadow-xl shadow-indigo-500/30",
        cancelButton: "w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-xs uppercase",
        popup: "rounded-[28px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl",
        input: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-black text-slate-800 text-lg focus:ring-indigo-500 focus:border-indigo-500 text-center"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        router.post(`/admin/digiflazz/update-price/${item.sku}`, { harga_jual: result.value }, {
          preserveScroll: true,
          onSuccess: (page) => {
            const flash = page.props.flash || {};
            Swal.fire({ icon: "success", title: "Tersimpan!", text: flash.success || "Harga diperbarui.", timer: 1500, showConfirmButton: false, customClass: { popup: "rounded-[24px]" } });
          }
        });
      }
    });
  };
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const term = searchTerm.toLowerCase();
    return products.filter((item) => {
      const matchSearch = item.product_name && item.product_name.toLowerCase().includes(term) || item.sku && item.sku.toLowerCase().includes(term);
      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchBrand = selectedBrand === "ALL" || item.brand === selectedBrand;
      const matchStatus = selectedStatus === "ALL" || selectedStatus === "active" && (item.status === "active" || item.status === "Aktif") || selectedStatus === "inactive" && (item.status === "inactive" || item.status === "Nonaktif");
      return matchSearch && matchCategory && matchBrand && matchStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, selectedStatus]);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Manajemen Digiflazz H2H" }),
    /* @__PURE__ */ jsx("style", { children: `.no-scrollbar::-webkit-scrollbar { display: none; }` }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50/60 font-['Outfit'] pb-32", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 pt-10 pb-28 rounded-b-[44px] shadow-2xl relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto relative z-10 flex justify-between items-center flex-wrap gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-2xl shadow-inner backdrop-blur-md", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-server" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-indigo-300 uppercase tracking-widest", children: "H2H Provider Center" }),
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black text-white tracking-wide uppercase drop-shadow-md", children: "Digiflazz Manager" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: handleSync, disabled: isSyncing, className: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 border border-white/10", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-rotate-right" }),
            " ",
            isSyncing ? "MEMPROSES..." : "TARIK & SINKRON HARGA"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 -mt-16 relative z-20 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl shrink-0", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-boxes-stacked" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "Total Produk" }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 font-mono", children: stats.total.toLocaleString("id-ID") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle-check" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "Produk Aktif" }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-emerald-600 font-mono", children: stats.active.toLocaleString("id-ID") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle-xmark" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "Nonaktif" }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-rose-600 font-mono", children: stats.inactive.toLocaleString("id-ID") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100/80 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-tags" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "Kategori" }),
              /* @__PURE__ */ jsxs("h3", { className: "text-xl font-black text-purple-600 font-mono", children: [
                stats.categories,
                " Jenis"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-sliders text-indigo-600" }),
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-black text-slate-800 uppercase tracking-wider", children: "Pengaturan Margin Keuntungan Massal" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5", children: "Keuntungan Persen (%)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("input", { type: "number", className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono", value: markupPersen, onChange: (e) => setMarkupPersen(e.target.value) }),
                /* @__PURE__ */ jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs", children: "%" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5", children: "Keuntungan Flat (Rp)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs", children: "Rp" }),
                /* @__PURE__ */ jsx("input", { type: "number", className: "w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-black text-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono", value: markupFlat, onChange: (e) => setMarkupFlat(e.target.value) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50/60 rounded-xl p-3 border border-indigo-100/80 flex flex-col justify-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-indigo-400 uppercase tracking-widest", children: "Kalkulasi Simulasi" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-black text-indigo-900 mt-0.5", children: [
                "Modal Rp 10.000 ",
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-right mx-1 text-[10px]" }),
                " Jual Rp ",
                formatRp(1e4 + 1e4 * (markupPersen / 100) + Number(markupFlat))
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "w-full md:w-72 relative", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" }),
              /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Cari nama atau SKU...", className: "w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm", value: searchTerm, onChange: (e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              } })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 w-full md:w-auto", children: [
              /* @__PURE__ */ jsxs("select", { value: selectedCategory, onChange: (e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }, className: "bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "ALL", children: "Semua Kategori" }),
                categories.map((cat, i) => /* @__PURE__ */ jsx("option", { value: cat, children: cat }, i))
              ] }),
              /* @__PURE__ */ jsxs("select", { value: selectedBrand, onChange: (e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }, className: "bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "ALL", children: "Semua Brand" }),
                brands.map((b, i) => /* @__PURE__ */ jsx("option", { value: b, children: b }, i))
              ] }),
              /* @__PURE__ */ jsxs("select", { value: selectedStatus, onChange: (e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }, className: "bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "ALL", children: "Semua Status" }),
                /* @__PURE__ */ jsx("option", { value: "active", children: "Aktif" }),
                /* @__PURE__ */ jsx("option", { value: "inactive", children: "Nonaktif" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100", children: [
              /* @__PURE__ */ jsx("th", { className: "p-4 pl-6", children: "Detail Produk" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "SKU Code" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Harga Jual" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-center", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 pr-6 text-center", children: "Aksi Management" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 text-xs font-bold text-slate-700", children: paginatedProducts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "text-center py-16 text-slate-400 uppercase tracking-widest text-[11px] font-black", children: "Data tidak ditemukan." }) }) : paginatedProducts.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/80 transition-all", children: [
              /* @__PURE__ */ jsxs("td", { className: "p-4 pl-6", children: [
                /* @__PURE__ */ jsx("div", { className: "font-black text-slate-800 text-[13px] leading-tight mb-1 max-w-[200px] truncate", title: item.product_name, children: item.product_name }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider", children: item.category }),
                  /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-wider", children: item.brand })
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "font-mono text-[11px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100", children: item.sku }) }),
              /* @__PURE__ */ jsxs("td", { className: "p-4 font-mono font-black text-slate-900 text-sm", children: [
                "Rp ",
                formatRp(item.price)
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsxs("span", { className: `px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${item.status === "active" || item.status === "Aktif" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`, children: [
                /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${item.status === "active" || item.status === "Aktif" ? "bg-emerald-500" : "bg-rose-500"}` }),
                item.status
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 pr-6 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => handleEditPrice(item), title: "Edit Harga Satuan", className: "w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm border border-slate-200 flex items-center justify-center", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-pen text-xs" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleToggleStatus(item.sku), title: "Aktif/Nonaktifkan", className: `w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm border ${item.status === "active" || item.status === "Aktif" ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"}`, children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${item.status === "active" || item.status === "Aktif" ? "fa-power-off" : "fa-check"} text-xs` }) })
              ] }) })
            ] }, item.sku)) })
          ] }) }),
          totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-slate-100 flex items-center justify-between bg-white flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: [
              "Halaman ",
              currentPage,
              " dari ",
              totalPages,
              " (",
              filteredProducts.length,
              " Data)"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage === 1, className: "px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider hover:bg-slate-200 disabled:opacity-50 transition-all", children: "Prev" }),
              /* @__PURE__ */ jsx("button", { onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages, className: "px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider hover:bg-slate-200 disabled:opacity-50 transition-all", children: "Next" })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  DigiflazzManager as default
};
