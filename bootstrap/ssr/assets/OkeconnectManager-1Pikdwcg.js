import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { useForm, Head, router } from "@inertiajs/react";
import Swal from "sweetalert2";
import "axios";
import "moment";
function OkeconnectManager({ auth, products }) {
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(Number(n) || 0);
  const { data: markupData, setData: setMarkupData, post: postMarkup, processing: markupProcessing } = useForm({
    provider: "ALL",
    type: "nominal",
    amount: 1500
  });
  const handleSync = () => {
    setSyncing(true);
    Swal.fire({
      html: `
                <div class="mt-4 flex flex-col items-center">
                    <div class="w-14 h-14 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg"></div>
                    <p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-4">Sinkronisasi Pricelist Okeconnect...</p>
                </div>
            `,
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: { popup: "rounded-[28px] p-6" }
    });
    router.post("/admin/okeconnect/sync", {}, {
      onSuccess: (page) => {
        setSyncing(false);
        const flash = page.props.flash || {};
        Swal.fire({ icon: "success", title: "Berhasil!", text: flash.success || "Pricelist diperbarui.", timer: 2e3, showConfirmButton: false, customClass: { popup: "rounded-[28px]" } });
      },
      onError: () => {
        setSyncing(false);
        Swal.fire({ icon: "error", title: "Gagal", text: "Terjadi kesalahan saat sinkronisasi.", confirmButtonColor: "#ef4444", customClass: { popup: "rounded-[28px]" } });
      }
    });
  };
  const handleBulkMarkup = (e) => {
    e.preventDefault();
    postMarkup("/admin/okeconnect/markup", {
      onSuccess: () => {
        Swal.fire({ icon: "success", title: "Markup Berhasil!", timer: 1500, showConfirmButton: false, customClass: { popup: "rounded-[28px]" } });
      }
    });
  };
  const handleToggle = (id) => {
    router.post(`/admin/okeconnect/toggle/${id}`, {}, { preserveScroll: true });
  };
  const handleDelete = (id) => {
    Swal.fire({
      title: "Hapus Produk?",
      text: "Data produk ini akan dihapus dari database.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "HAPUS",
      cancelButtonText: "BATAL",
      confirmButtonColor: "#ef4444",
      customClass: { popup: "rounded-[28px]" }
    }).then((res) => {
      if (res.isConfirmed) {
        router.delete(`/admin/okeconnect/destroy/${id}`, { preserveScroll: true });
      }
    });
  };
  const filteredProducts = products.filter(
    (p) => p.nama_layanan.toLowerCase().includes(search.toLowerCase()) || p.kode_layanan.toLowerCase().includes(search.toLowerCase())
  );
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Manajemen Okeconnect H2H" }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50 font-['Outfit'] pb-32", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-6 pt-10 pb-24 rounded-b-[40px] shadow-lg shadow-purple-900/25 relative overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center relative z-10 flex-wrap gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-purple-200 uppercase tracking-widest", children: "Admin Control Center" }),
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-white tracking-wider uppercase drop-shadow-md", children: "Kelola Server Okeconnect" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxs("button", { onClick: handleSync, disabled: syncing, className: "bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2.5 rounded-2xl border border-white/20 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 shadow-inner", children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-cloud-arrow-down" }),
          " Tarik Pricelist API"
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 -mt-12 relative z-20 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold shadow-inner", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-box-archive" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Total Produk H2H" }),
              /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-black text-slate-800 mt-0.5", children: [
                products.length,
                " Item"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 bg-white p-6 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-black text-slate-800 uppercase tracking-wider mb-3", children: "Markup Harga Massal Otomatis" }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleBulkMarkup, className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700",
                  value: markupData.provider,
                  onChange: (e) => setMarkupData("provider", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "ALL", children: "Semua Provider" }),
                    /* @__PURE__ */ jsx("option", { value: "TELKOMSEL", children: "Telkomsel" }),
                    /* @__PURE__ */ jsx("option", { value: "INDOSAT", children: "Indosat" }),
                    /* @__PURE__ */ jsx("option", { value: "XL", children: "XL" }),
                    /* @__PURE__ */ jsx("option", { value: "AXIS", children: "Axis" }),
                    /* @__PURE__ */ jsx("option", { value: "TRI", children: "Tri" }),
                    /* @__PURE__ */ jsx("option", { value: "SMARTFREN", children: "Smartfren" }),
                    /* @__PURE__ */ jsx("option", { value: "PLN", children: "PLN" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    className: "bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 w-1/2",
                    value: markupData.type,
                    onChange: (e) => setMarkupData("type", e.target.value),
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "nominal", children: "Rp (Nominal)" }),
                      /* @__PURE__ */ jsx("option", { value: "persen", children: "% (Persen)" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    placeholder: "Jumlah",
                    className: "bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 w-1/2 font-mono",
                    value: markupData.amount,
                    onChange: (e) => setMarkupData("amount", e.target.value)
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("button", { type: "submit", disabled: markupProcessing, className: "bg-slate-900 hover:bg-black text-white rounded-xl p-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md", children: "Terapkan Markup" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-black text-sm text-slate-800 uppercase tracking-wider", children: "Database Produk Okeconnect" }),
            /* @__PURE__ */ jsx("div", { className: "w-full sm:w-72", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Cari nama atau kode...",
                className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:ring-purple-500 focus:border-purple-500",
                value: search,
                onChange: (e) => setSearch(e.target.value)
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100", children: [
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Kode" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Nama Layanan" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Provider / Tipe" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Harga Modal" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Harga Jual" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-center", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-center", children: "Aksi" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 text-xs font-bold text-slate-700", children: filteredProducts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "7", className: "text-center py-12 text-slate-400 uppercase tracking-widest text-[11px]", children: "Belum ada produk atau hasil pencarian tidak ditemukan." }) }) : filteredProducts.slice(0, 100).map((p) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/80 transition-all", children: [
              /* @__PURE__ */ jsx("td", { className: "p-4 font-mono font-black text-purple-600", children: p.kode_layanan }),
              /* @__PURE__ */ jsx("td", { className: "p-4 max-w-xs truncate", children: p.nama_layanan }),
              /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
                /* @__PURE__ */ jsx("span", { className: "bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase mr-1", children: p.provider }),
                /* @__PURE__ */ jsx("span", { className: "bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase", children: p.tipe })
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "p-4 font-mono text-slate-500", children: [
                "Rp ",
                formatRp(p.harga_modal)
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "p-4 font-mono font-black text-slate-900", children: [
                "Rp ",
                formatRp(p.harga_jual)
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("button", { onClick: () => handleToggle(p.id), className: `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${p.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100" : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"}`, children: p.status }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(p.id), className: "w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto shadow-sm", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-trash text-xs" }) }) })
            ] }, p.id)) })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  OkeconnectManager as default
};
