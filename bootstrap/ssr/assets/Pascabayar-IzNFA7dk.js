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
    "Telkom & Indihome": { bg: "bg-red-600 text-white", icon: "fa-tty" },
    "BPJS": { bg: "bg-emerald-600 text-white", icon: "fa-heart-pulse" },
    "PDAM": { bg: "bg-blue-500 text-white", icon: "fa-droplet" },
    "Finance & Cicilan": { bg: "bg-indigo-600 text-white", icon: "fa-money-bill-transfer" },
    "HP Pasca": { bg: "bg-purple-600 text-white", icon: "fa-mobile-screen" },
    "TV & Internet": { bg: "bg-rose-500 text-white", icon: "fa-wifi" },
    "Gas Negara": { bg: "bg-orange-500 text-white", icon: "fa-fire-flame-simple" },
    "Asuransi": { bg: "bg-teal-500 text-white", icon: "fa-shield-heart" },
    "IPL & Pajak": { bg: "bg-cyan-600 text-white", icon: "fa-house-circle-check" },
    "Lainnya": { bg: "bg-slate-700 text-white", icon: "fa-file-invoice-dollar" }
  };
  const l = logos[category] || logos["Lainnya"];
  return /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-md shrink-0 ${l.bg}`, children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${l.icon}` }) });
};
function Pascabayar({ auth, groupedProducts, userBalance }) {
  const categories = Object.keys(groupedProducts || {});
  const [activeCat, setActiveCat] = useState(categories[0] || "Lainnya");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tujuan, setTujuan] = useState("");
  const [inquiryData, setInquiryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchProd, setSearchProd] = useState("");
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(Number(n) || 0);
  const cleanProductName = (name) => {
    if (!name) return "";
    return name.replace(/\(OKECONNECT\)/gi, "").replace(/\(DIGIFLAZZ\)/gi, "").replace(/OKECONNECT/gi, "").replace(/DIGIFLAZZ/gi, "").trim();
  };
  const currentList = (groupedProducts[activeCat] || []).filter(
    (p) => p.nama_layanan.toLowerCase().includes(searchProd.toLowerCase())
  );
  const startPolling = (refId) => {
    let attempts = 0;
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
          Swal.fire({ icon: "error", title: "Gagal", text: pollRes.data.message, confirmButtonColor: "#ef4444" });
          setLoading(false);
        } else if (attempts >= 20) {
          clearInterval(interval);
          Swal.fire({ icon: "info", title: "Waktu Habis", text: "Silakan cek menu Riwayat nanti." }).then(() => router.visit("/riwayat"));
          setLoading(false);
        }
      } catch (e) {
      }
    }, 3e3);
  };
  const handleInquiry = async () => {
    if (!selectedProduct || tujuan.length < 4) return Swal.fire({ icon: "warning", title: "Lengkapi Data", text: "Pilih produk dan masukkan ID!" });
    setLoading(true);
    Swal.fire({
      html: `<div class="mt-4 flex flex-col items-center"><div class="w-14 h-14 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg"></div><p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-4">Mengecek Tagihan...</p></div>`,
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
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghubungi server.", confirmButtonColor: "#ef4444" });
    }
  };
  const handlePay = () => {
    if (!inquiryData) return;
    const parsed = inquiryData.parsed || {};
    const totalBayar = parsed.total || inquiryData.selling_price || inquiryData.price || 0;
    if (Number(userBalance) < Number(totalBayar)) return Swal.fire({ icon: "error", title: "Saldo Kurang", text: "Top up dompet dulu!" });
    setLoading(true);
    Swal.fire({
      html: `<div class="mt-4 flex flex-col items-center"><div class="w-14 h-14 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg"></div><p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-4">Memproses Pembayaran...</p></div>`,
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: { popup: "rounded-[28px] p-6" }
    });
    axios.post("/order/pascabayar/pay", { kode_layanan: selectedProduct.kode_layanan, tujuan, server: selectedProduct.server, amount: totalBayar }).then((payRes) => {
      Swal.fire({ icon: "success", title: "Berhasil!", text: payRes.data.message, timer: 1500, showConfirmButton: false }).then(() => router.visit("/riwayat"));
    }).catch((err) => {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Transaksi gagal.", confirmButtonColor: "#ef4444" });
    }).finally(() => setLoading(false));
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Pascabayar & Tagihan" }),
    /* @__PURE__ */ jsx("style", { children: `.no-scrollbar::-webkit-scrollbar { display: none; }` }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50 font-['Outfit'] pb-32", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-teal-600 to-emerald-700 px-5 pt-8 pb-20 rounded-b-[40px] shadow-lg relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10" }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center relative z-10", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => router.visit("/dashboard"), className: "w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-2xl active:scale-95 transition-all", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left-long" }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-white tracking-widest uppercase drop-shadow-md", children: "Bayar Tagihan" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-wallet text-emerald-300 text-[10px]" }),
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
        categories.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex overflow-x-auto gap-3 mb-5 no-scrollbar pb-2", children: categories.map((cat) => /* @__PURE__ */ jsx("button", { onClick: () => {
          setActiveCat(cat);
          setSelectedProduct(null);
          setInquiryData(null);
          setSearchProd("");
        }, className: `shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black tracking-wide transition-all border shadow-sm ${activeCat === cat ? "bg-teal-700 border-teal-700 text-white shadow-md" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`, children: cat }, cat)) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 rounded-[28px] shadow-xl border border-slate-100 mb-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 pb-4 border-b border-slate-100", children: [
            /* @__PURE__ */ jsx(CategoryLogo, { category: activeCat }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-teal-600 uppercase tracking-widest", children: "Kategori Pilihan" }),
              /* @__PURE__ */ jsx("h2", { className: "text-base font-black text-slate-800", children: activeCat })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2", children: "Pilih Layanan Tagihan" }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setIsModalOpen(true), className: "w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3.5 text-xs font-bold text-slate-800 flex justify-between items-center shadow-sm text-left hover:border-teal-400 transition-all", children: [
              /* @__PURE__ */ jsx("span", { className: selectedProduct ? "text-slate-800 font-black truncate pr-2" : "text-slate-400", children: selectedProduct ? cleanProductName(selectedProduct.nama_layanan) : "-- Klik & Pilih Produk --" }),
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-down text-slate-400 text-xs shrink-0" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2", children: "ID Pelanggan / Nomor Tujuan" }),
            /* @__PURE__ */ jsx("input", { type: "tel", className: "w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3.5 font-mono text-base font-black text-slate-800 tracking-wider placeholder-slate-300 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-all", placeholder: "Contoh: 152507xxxx", value: tujuan, onChange: (e) => {
              setTujuan(e.target.value.replace(/\D/g, ""));
              setInquiryData(null);
            }, maxLength: "25" })
          ] }),
          !inquiryData && /* @__PURE__ */ jsx("button", { onClick: handleInquiry, disabled: loading || !selectedProduct || tujuan.length < 4, className: "w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-[16px] font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/30 disabled:opacity-50 active:scale-95 transition-all", children: "Cek Tagihan" })
        ] }),
        inquiryData && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in slide-in-from-bottom-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-file-invoice text-teal-600" }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-slate-800", children: "Rincian Transaksi" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-3 text-[13px]", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 col-span-1", children: "Pilihan Layanan" }),
                /* @__PURE__ */ jsx("span", { className: "font-black text-slate-800 col-span-2 text-right", children: cleanProductName(selectedProduct.nama_layanan) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 col-span-1", children: "ID Pelanggan" }),
                /* @__PURE__ */ jsx("span", { className: "font-mono font-black text-slate-800 col-span-2 text-right", children: tujuan })
              ] }),
              inquiryData.parsed?.nama !== "Pelanggan" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 col-span-1", children: "Nama" }),
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 col-span-2 text-right break-words", children: inquiryData.parsed?.nama })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 pt-2 border-t border-slate-100", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-xs", children: "Serial Number / Info" }),
                /* @__PURE__ */ jsx("div", { className: "bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-600 break-words leading-relaxed", children: inquiryData.parsed?.desc || inquiryData.sn || inquiryData.message || "-" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-slate-100", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-slate-800", children: "Total Pembayaran" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3 text-[13px] text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Tagihan" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Rp ",
                  formatRp(inquiryData.parsed?.tagihan || 0)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3 text-[13px] text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Biaya Admin" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Rp ",
                  formatRp(inquiryData.parsed?.admin || 0)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-3 border-t border-slate-100", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-slate-800", children: "Total" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-black text-teal-600", children: [
                  "Rp ",
                  formatRp(inquiryData.parsed?.total || inquiryData.selling_price || inquiryData.price || 0)
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: handlePay, disabled: loading, className: "w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded-[16px] font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mb-6", children: [
            "BAYAR ",
            formatRp(inquiryData.parsed?.total || inquiryData.selling_price || inquiryData.price || 0)
          ] })
        ] })
      ] }),
      isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 bg-slate-50 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-black text-sm text-slate-800 uppercase tracking-wider", children: [
              "Layanan ",
              activeCat
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setIsModalOpen(false), className: "w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold hover:bg-slate-300 transition-all", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-xmark" }) })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Cari nama wilayah atau produk...",
              className: "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:ring-teal-500 focus:border-teal-500 shadow-sm",
              value: searchProd,
              onChange: (e) => setSearchProd(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 overflow-y-auto space-y-2.5 flex-1", children: currentList.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest", children: "Produk Tidak Ditemukan" }) : currentList.map((p) => {
          const cleanedName = cleanProductName(p.nama_layanan);
          return /* @__PURE__ */ jsxs("div", { onClick: () => {
            setSelectedProduct(p);
            setIsModalOpen(false);
            setInquiryData(null);
            setSearchProd("");
          }, className: "p-4 rounded-2xl border border-slate-100 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between shadow-sm bg-white", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 font-bold", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-list-check" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-teal-600 tracking-widest", children: p.kode_layanan }),
                /* @__PURE__ */ jsx("div", { className: "text-xs font-black text-slate-800 leading-tight pr-2", children: cleanedName })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-xs text-slate-300" })
          ] }, p.kode_layanan);
        }) })
      ] }) })
    ] })
  ] });
}
export {
  Pascabayar as default
};
