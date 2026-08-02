import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head, router } from "@inertiajs/react";
import Swal from "sweetalert2";
import axios from "axios";
/* empty css                      */
import "moment";
const CategoryLogo = ({ category }) => {
  const logos = {
    "PLN Pasca": { bg: "bg-yellow-400 text-slate-900", icon: "fa-bolt" },
    "PDAM": { bg: "bg-blue-500 text-white", icon: "fa-droplet" },
    "BPJS": { bg: "bg-emerald-600 text-white", icon: "fa-heart-pulse" },
    "HP Pasca": { bg: "bg-indigo-600 text-white", icon: "fa-mobile-screen-button" },
    "Internet / Telkom": { bg: "bg-red-600 text-white", icon: "fa-globe" },
    "Lainnya": { bg: "bg-purple-600 text-white", icon: "fa-file-invoice-dollar" }
  };
  const l = logos[category] || logos["Lainnya"];
  return /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-md ${l.bg} shrink-0`, children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${l.icon}` }) });
};
function Pascabayar({ auth, groupedProducts, userBalance }) {
  const categories = Object.keys(groupedProducts || {});
  const [activeCat, setActiveCat] = useState(categories[0] || "Lainnya");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tujuan, setTujuan] = useState("");
  const [inquiryData, setInquiryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(Number(n) || 0);
  const isPdam = activeCat === "PDAM";
  const pdamRegions = isPdam ? Object.keys(groupedProducts["PDAM"] || {}) : [];
  const currentList = isPdam ? selectedRegion ? groupedProducts["PDAM"][selectedRegion] || [] : [] : groupedProducts[activeCat] || [];
  const cleanProductName = (name) => {
    if (!name) return "";
    return name.replace(/\(OKECONNECT\)/gi, "").replace(/\(DIGIFLAZZ\)/gi, "").replace(/OKECONNECT/gi, "").replace(/DIGIFLAZZ/gi, "").trim();
  };
  const startPolling = (refId) => {
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const pollRes = await axios.post("/order/pascabayar/poll", { ref_id: refId });
        if (pollRes.data.status === "sukses") {
          clearInterval(interval);
          Swal.close();
          setInquiryData(pollRes.data.data);
          setLoading(false);
        } else if (pollRes.data.status === "gagal") {
          clearInterval(interval);
          Swal.fire({ icon: "error", title: "Cek Tagihan Gagal", text: pollRes.data.message || "Ditolak server pusat.", confirmButtonColor: "#ef4444" });
          setLoading(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          Swal.fire({ icon: "info", title: "Waktu Habis", text: "Server pusat sedang padat. Silakan cek hasil tagihannya di menu Riwayat nanti ya!", confirmButtonColor: "#6366f1" }).then(() => router.visit("/riwayat"));
          setLoading(false);
        }
      } catch (e) {
      }
    }, 3e3);
  };
  const handleInquiry = async () => {
    if (!selectedProduct || tujuan.length < 4) return Swal.fire({ icon: "warning", title: "Lengkapi Data", text: "Pilih produk dan masukkan nomor pelanggan!", confirmButtonColor: "#6366f1" });
    setLoading(true);
    Swal.fire({
      html: `
                <div class="mt-4 flex flex-col items-center">
                    <div class="w-14 h-14 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg"></div>
                    <p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-4">Memproses Permintaan...</p>
                    <p class="text-[10px] text-slate-400 mt-1 font-medium text-center">Jangan tutup aplikasi. Sedang menunggu balasan server pusat...</p>
                </div>
            `,
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: { popup: "rounded-[28px] p-6" }
    });
    try {
      const res = await axios.post("/order/pascabayar/inquiry", { kode_layanan: selectedProduct.kode_layanan, tujuan, server: selectedProduct.server });
      if (res.data.is_polling) {
        startPolling(res.data.ref_id);
      } else {
        Swal.close();
        setInquiryData(res.data.data);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      Swal.fire({ icon: "error", title: "Gagal Cek", text: err.response?.data?.message || "Gagal menghubungi server.", confirmButtonColor: "#ef4444" });
    }
  };
  const handlePay = () => {
    if (!inquiryData) return;
    const totalBayar = inquiryData.selling_price || inquiryData.price || 0;
    if (Number(userBalance) < Number(totalBayar)) return Swal.fire({ icon: "error", title: "Saldo Kurang", text: "Top up dompet dulu!", confirmButtonColor: "#6366f1" });
    Swal.fire({
      title: `<div class="text-xl font-black text-slate-800 mt-2">Konfirmasi Pembayaran</div>`,
      html: `
                <div class="text-left mt-3 space-y-3">
                    <div class="bg-slate-50 p-4 rounded-[16px] border border-slate-100 flex justify-between">
                        <span class="text-xs text-slate-400 font-bold">Pelanggan</span>
                        <span class="text-sm font-black text-slate-800 line-clamp-1">${inquiryData.customer_name || "Pelanggan"}</span>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-[16px] border border-slate-100 flex justify-between">
                        <span class="text-xs text-slate-400 font-bold">No Pelanggan</span>
                        <span class="text-sm font-black text-slate-800 font-mono">${tujuan}</span>
                    </div>
                    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-[16px] text-white flex justify-between items-center shadow-lg">
                        <span class="text-xs font-black uppercase">Total Tagihan</span>
                        <span class="text-xl font-black">Rp ${formatRp(totalBayar)}</span>
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "BAYAR SEKARANG",
      cancelButtonText: "BATAL",
      buttonsStyling: false,
      customClass: {
        confirmButton: "w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-xs uppercase shadow-xl",
        cancelButton: "w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-xs uppercase",
        popup: "rounded-[28px] p-6 w-full max-w-sm shadow-2xl"
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        setLoading(true);
        Swal.fire({ html: `<div class="mt-4 flex flex-col items-center"><div class="w-14 h-14 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg"></div><p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-4">Memproses Pembayaran...</p></div>`, allowOutsideClick: false, showConfirmButton: false, customClass: { popup: "rounded-[28px] p-6" } });
        try {
          const payRes = await axios.post("/order/pascabayar/pay", { kode_layanan: selectedProduct.kode_layanan, tujuan, server: selectedProduct.server, amount: totalBayar });
          Swal.fire({ icon: "success", title: "Berhasil!", text: payRes.data.message, timer: 1500, showConfirmButton: false }).then(() => router.visit("/riwayat"));
        } catch (err) {
          Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Transaksi gagal.", confirmButtonColor: "#ef4444" });
        } finally {
          setLoading(false);
        }
      }
    });
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Pascabayar & Tagihan" }),
    /* @__PURE__ */ jsx("style", { children: `.no-scrollbar::-webkit-scrollbar { display: none; }` }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50 font-['Outfit'] pb-32", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-5 pt-8 pb-20 rounded-b-[40px] shadow-lg shadow-purple-900/20 relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10" }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center relative z-10", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => router.visit("/dashboard"), className: "w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-2xl border border-white/20 active:scale-95 transition-all", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left-long" }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-white tracking-widest uppercase drop-shadow-md", children: "Pascabayar" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-inner", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-wallet text-fuchsia-300 text-[10px]" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-white tracking-widest", children: [
                "Rp ",
                formatRp(userBalance)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-10" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto px-4 -mt-10 relative z-20", children: [
        categories.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex overflow-x-auto gap-3 mb-6 no-scrollbar pb-2", children: categories.map((cat) => /* @__PURE__ */ jsxs("button", { onClick: () => {
          setActiveCat(cat);
          setSelectedRegion("");
          setSelectedProduct(null);
          setInquiryData(null);
        }, className: `shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black tracking-wide transition-all border shadow-sm ${activeCat === cat ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`, children: [
          /* @__PURE__ */ jsx("i", { className: `fa-solid ${cat === "PLN Pasca" ? "fa-bolt text-yellow-400" : cat === "PDAM" ? "fa-droplet text-blue-500" : cat === "BPJS" ? "fa-heart-pulse text-emerald-500" : cat === "HP Pasca" ? "fa-mobile-screen text-indigo-500" : "fa-globe text-red-500"}` }),
          " ",
          cat
        ] }, cat)) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pb-4 border-b border-slate-100", children: [
            /* @__PURE__ */ jsx(CategoryLogo, { category: activeCat }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-purple-600 uppercase tracking-widest", children: "Kategori Aktif" }),
              /* @__PURE__ */ jsx("h2", { className: "text-base font-black text-slate-800", children: activeCat })
            ] })
          ] }),
          isPdam && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2", children: "Wilayah / Provinsi PDAM" }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setIsRegionModalOpen(true), className: "w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3.5 text-xs font-bold text-slate-800 flex justify-between items-center shadow-sm hover:border-purple-300 transition-all", children: [
              /* @__PURE__ */ jsx("span", { className: selectedRegion ? "text-slate-800 font-black" : "text-slate-400", children: selectedRegion || "-- Pilih Provinsi / Wilayah --" }),
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-down text-slate-400 text-xs" })
            ] })
          ] }),
          (!isPdam || selectedRegion) && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2", children: "Pilih Jenis Tagihan" }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setIsModalOpen(true), className: "w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3.5 text-xs font-bold text-slate-800 flex justify-between items-center shadow-sm hover:border-purple-300 transition-all text-left", children: [
              /* @__PURE__ */ jsx("span", { className: selectedProduct ? "text-slate-800 font-black truncate pr-2" : "text-slate-400", children: selectedProduct ? cleanProductName(selectedProduct.nama_layanan) : "-- Pilih Layanan Tagihan --" }),
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-down text-slate-400 text-xs shrink-0" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2", children: "Nomor Pelanggan / ID Tujuan" }),
            /* @__PURE__ */ jsx("input", { type: "tel", className: "w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3.5 font-mono text-base font-black text-slate-800 tracking-wider placeholder-slate-300 focus:ring-purple-500 focus:border-purple-500 shadow-sm", placeholder: "Masukkan No Pelanggan...", value: tujuan, onChange: (e) => {
              setTujuan(e.target.value.replace(/\D/g, ""));
              setInquiryData(null);
            }, maxLength: "25" })
          ] }),
          !inquiryData && /* @__PURE__ */ jsx("button", { onClick: handleInquiry, disabled: loading || !selectedProduct || tujuan.length < 4, className: "w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-[16px] font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/30 disabled:opacity-50 transition-all active:scale-95", children: "Cek Tagihan" })
        ] }),
        inquiryData && /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-[28px] shadow-xl border border-purple-100 animate-in slide-in-from-bottom-3 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-100 pb-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-purple-600 uppercase tracking-widest", children: "Rincian Tagihan" }),
            /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-slate-800 mt-0.5", children: inquiryData.customer_name || "Pelanggan" })
          ] }),
          inquiryData.desc && /* @__PURE__ */ jsxs("div", { className: "bg-purple-50/70 border border-purple-100 p-3 rounded-[16px] text-[10px] font-black text-purple-700 leading-relaxed break-words shadow-inner", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle-info mr-1.5" }),
            " ",
            inquiryData.desc
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2.5 text-xs font-bold text-slate-600", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "No Pelanggan:" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-slate-800", children: tujuan })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "Periode:" }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-800", children: inquiryData.period || "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-base font-black text-purple-700 pt-3 border-t border-slate-100", children: [
              /* @__PURE__ */ jsx("span", { children: "Total Bayar:" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Rp ",
                formatRp(inquiryData.selling_price || inquiryData.price || 0)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setInquiryData(null), className: "w-full bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-[16px] font-black text-xs uppercase tracking-widest transition-all active:scale-95", children: "Tutup" }),
            /* @__PURE__ */ jsxs("button", { onClick: handlePay, disabled: loading, className: "w-full bg-slate-900 hover:bg-black text-white py-4 rounded-[16px] font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2", children: [
              "Bayar ",
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-fingerprint text-purple-400" })
            ] })
          ] })
        ] })
      ] }),
      isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-black text-sm text-slate-800 uppercase tracking-wider", children: [
            "Pilih Layanan ",
            activeCat
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setIsModalOpen(false), className: "w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-xmark" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 overflow-y-auto space-y-2.5 flex-1", children: currentList.map((p) => {
          const cleanedName = cleanProductName(p.nama_layanan);
          return /* @__PURE__ */ jsxs("div", { onClick: () => {
            setSelectedProduct(p);
            setIsModalOpen(false);
            setInquiryData(null);
          }, className: "p-4 rounded-2xl border border-slate-100 hover:border-purple-500 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between shadow-sm bg-white", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-file-invoice" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-slate-400 tracking-widest", children: p.kode_layanan }),
                /* @__PURE__ */ jsx("div", { className: "text-xs font-black text-slate-800 leading-tight pr-2", children: cleanedName })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-xs text-slate-300" })
          ] }, p.kode_layanan);
        }) })
      ] }) }),
      isRegionModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-black text-sm text-slate-800 uppercase tracking-wider", children: "Pilih Provinsi / Wilayah" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setIsRegionModalOpen(false), className: "w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-xmark" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 overflow-y-auto space-y-2.5 flex-1", children: pdamRegions.map((reg) => /* @__PURE__ */ jsxs("div", { onClick: () => {
          setSelectedRegion(reg);
          setIsRegionModalOpen(false);
          setSelectedProduct(null);
          setInquiryData(null);
        }, className: "p-4 rounded-2xl border border-slate-100 hover:border-purple-500 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between shadow-sm bg-white", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-map-location-dot" }) }),
            /* @__PURE__ */ jsx("div", { className: "text-xs font-black text-slate-800", children: reg })
          ] }),
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-xs text-slate-300" })
        ] }, reg)) })
      ] }) })
    ] })
  ] });
}
export {
  Pascabayar as default
};
