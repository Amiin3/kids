import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { router, Head } from "@inertiajs/react";
import Swal from "sweetalert2";
import axios from "axios";
import "moment";
function ManagePOV8({ auth, antrean, mode }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [isProcessing, setIsProcessing] = useState(false);
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(n);
  const toggleMode = () => {
    Swal.fire({
      title: "Ubah Mode Sistem?",
      text: currentMode === "auto" ? "Sistem Sniper akan dihentikan (Manual)." : "Sistem Sniper akan mengeksekusi otomatis di latar belakang.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Ubah Mode!"
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post("/admin/po-v8/toggle").then((res) => {
          setCurrentMode(currentMode === "auto" ? "manual" : "auto");
          Swal.fire("Berhasil!", res.data.message, "success");
        });
      }
    });
  };
  const actionRetry = (id, tujuan) => {
    setIsProcessing(true);
    Swal.fire({ title: "Menembak API...", html: `Mengeksekusi nomor <b>${tujuan}</b>`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    axios.post(`/admin/po-v8/retry/${id}`).then((res) => {
      setIsProcessing(false);
      if (res.data.success) {
        Swal.fire("Sukses / Refunded", res.data.message, "success").then(() => router.reload());
      } else {
        Swal.fire("Tertahan", res.data.message, "warning").then(() => router.reload());
      }
    }).catch((err) => {
      setIsProcessing(false);
      Swal.fire("Error", "Terjadi kesalahan sistem", "error");
    });
  };
  const actionCancel = (id, tujuan) => {
    Swal.fire({
      title: "Batalkan & Refund?",
      html: `Yakin ingin membatalkan pesanan untuk <b>${tujuan}</b>? Saldo akan dikembalikan ke user.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Batalkan!"
    }).then((result) => {
      if (result.isConfirmed) {
        setIsProcessing(true);
        Swal.fire({ title: "Memproses Refund...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        axios.post(`/admin/po-v8/cancel/${id}`).then((res) => {
          setIsProcessing(false);
          if (res.data.success) {
            Swal.fire("Dibatalkan!", res.data.message, "success").then(() => router.reload());
          } else {
            Swal.fire("Gagal", res.data.message, "error");
          }
        });
      }
    });
  };
  React.useEffect(() => {
    let interval;
    if (currentMode === "auto" && antrean.length > 0 && !isProcessing) {
      interval = setInterval(() => {
        const target = antrean[0];
        if (target) {
          setIsProcessing(true);
          axios.post(`/admin/po-v8/retry/${target.id}`).then((res) => {
            setIsProcessing(false);
            router.reload({ preserveScroll: true, preserveState: true });
          }).catch((err) => {
            setIsProcessing(false);
          });
        }
      }, 3e3);
    }
    return () => clearInterval(interval);
  }, [currentMode, antrean, isProcessing]);
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Admin PO Command Center" }),
    isProcessing && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[9999] bg-slate-900/20 backdrop-blur-sm" }),
    /* @__PURE__ */ jsx("div", { className: "py-8 bg-slate-50 min-h-screen font-['Outfit']", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white overflow-hidden shadow-sm rounded-[24px] border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4 md:mb-0", children: [
          /* @__PURE__ */ jsx("div", { className: `w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${currentMode === "auto" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`, children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${currentMode === "auto" ? "fa-robot animate-bounce" : "fa-hand-paper"}` }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-slate-800 tracking-tight leading-none mb-1", children: "Command Center PO" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-widest", children: "Akrab V8 Autonomous Engine" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-600 uppercase tracking-widest pl-2", children: "Mode Mesin:" }),
          /* @__PURE__ */ jsx("button", { onClick: toggleMode, className: `relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${currentMode === "auto" ? "bg-emerald-500" : "bg-slate-300"}`, children: /* @__PURE__ */ jsx("span", { className: `inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${currentMode === "auto" ? "translate-x-9" : "translate-x-1"}` }) }),
          /* @__PURE__ */ jsx("span", { className: `text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border ${currentMode === "auto" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`, children: currentMode === "auto" ? "OTOMATIS (ON)" : "MANUAL (PAUSED)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white overflow-hidden shadow-sm rounded-[24px] border border-slate-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-sm font-black text-slate-800 uppercase tracking-widest", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-list-ol text-blue-500 mr-2" }),
            " Daftar Antrean Tertahan"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md", children: [
            "Total: ",
            antrean.length,
            " Data"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 border-b border-slate-100", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "ID / Tgl" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "User / Reseller" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Produk / Target" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Status / Retry" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right", children: "Aksi Eksekusi" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: antrean.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "5", className: "p-10 text-center text-slate-400", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-box-open text-4xl mb-3 opacity-20" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: "Gudang Antrean Kosong" })
          ] }) }) : antrean.map((trx) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-50 hover:bg-slate-50/50 transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-800", children: trx.ref_id }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-400 mt-0.5", children: new Date(trx.created_at).toLocaleString("id-ID") })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-black text-blue-600 uppercase tracking-widest", children: trx.username }),
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-slate-500 font-medium", children: [
                "Rp ",
                formatRp(trx.harga)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mb-1 border border-slate-200", children: trx.kode_layanan }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-black text-slate-800 tracking-wider", children: trx.tujuan })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded inline-block border border-indigo-100 mb-1", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-clock-rotate-left mr-1" }),
                " ",
                trx.status
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 font-medium line-clamp-1", children: trx.sn }),
              /* @__PURE__ */ jsxs("div", { className: "text-[9px] text-amber-600 font-bold mt-1 uppercase tracking-widest", children: [
                "Telah di-retry: ",
                trx.retry_count,
                "x"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-4 text-right space-x-2", children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => actionRetry(trx.id, trx.tujuan), className: "bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-md", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-bolt mr-1" }),
                " Retry"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => actionCancel(trx.id, trx.tujuan), className: "bg-white border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-xmark mr-1" }),
                " Cancel"
              ] })
            ] })
          ] }, trx.id)) })
        ] }) })
      ] })
    ] }) })
  ] });
}
export {
  ManagePOV8 as default
};
