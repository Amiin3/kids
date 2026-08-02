import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";
import axios from "axios";
import "moment";
const fadeInUp = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; } .live-dot { animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; } @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }`;
function AkrabV8({ auth, reguler = [], promo = [], am = [] }) {
  const { user } = auth;
  const isAdmin = ["admin", "superadmin", "owner"].includes(user?.level?.toLowerCase());
  const [target, setTarget] = useState("");
  const [activeTab, setActiveTab] = useState("akrab");
  const [orderMode, setOrderMode] = useState("reguler");
  const [isMultiOrder, setIsMultiOrder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [liveProducts, setLiveProducts] = useState([
    ...reguler || [],
    ...promo || [],
    ...am || []
  ]);
  useEffect(() => {
    const timer = setInterval(() => {
      axios.get("/api/v8/live-stock").then((res) => {
        if (res.data && typeof res.data === "object" && !res.data.message) {
          const incomingData = [...res.data.reguler || [], ...res.data.promo || [], ...res.data.am || []];
          if (incomingData.length > 0) setLiveProducts(incomingData);
        }
      }).catch(() => {
      });
    }, 5e3);
    return () => clearInterval(timer);
  }, []);
  const fakeMarkup = 0.03;
  const trueAkrab = useMemo(() => {
    return liveProducts.filter((p) => p.product_code && (p.product_code.toUpperCase().includes("XDA") || p.product_code.toUpperCase().includes("XAP"))).sort((a, b) => {
      const numA = parseInt(a.product_code.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.product_code.replace(/\D/g, "")) || 0;
      if (numA === numB) return a.product_code.localeCompare(b.product_code);
      return numA - numB;
    });
  }, [liveProducts]);
  const trueAm = useMemo(() => {
    return liveProducts.filter((p) => p.product_code && p.product_code.toUpperCase().includes("AM")).sort((a, b) => {
      const numA = parseInt(a.product_code.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.product_code.replace(/\D/g, "")) || 0;
      return numA - numB;
    });
  }, [liveProducts]);
  const activeProductsList = activeTab === "akrab" ? trueAkrab : trueAm;
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(n);
  const handleCheckPromo = () => {
    if (!target || target.includes(",")) return Swal.fire({ icon: "warning", title: "Input Tidak Valid", text: "Masukkan HANYA 1 nomor HP untuk cek promo.", confirmButtonColor: "#9333ea", customClass: { popup: "rounded-[20px]" } });
    Swal.fire({ title: "Mengecek Promo...", text: "Sedang menghubungi server pusat.", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    axios.post("/api/v8/check-promo", { msisdn: target }).then((res) => {
      if (res.data.success) {
        const promos = res.data.data.result.data;
        const html = promos.length > 0 ? promos.map((p) => `<div class="p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm font-bold text-purple-700 mb-2">${p}</div>`).join("") : '<div class="text-slate-500">Tidak ada promo tersedia untuk nomor ini.</div>';
        Swal.fire({ title: "Daftar Promo FlexMax", html, icon: "success", confirmButtonColor: "#9333ea", customClass: { popup: "rounded-[24px]" } });
      } else {
        Swal.fire("Gagal", res.data.error || "Terjadi kesalahan.", "error");
      }
    }).catch(() => Swal.fire("Error", "Gagal terhubung ke pusat.", "error"));
  };
  const handleCheckTrx = () => {
    if (!target || target.includes(",")) return Swal.fire({ icon: "warning", title: "Input Tidak Valid", text: "Masukkan Nomor HP ATAU Reffid pusat (contoh: 1555257).", confirmButtonColor: "#1e293b", customClass: { popup: "rounded-[20px]" } });
    Swal.fire({ title: "Melacak Server (Admin)...", text: "Mengambil riwayat 7 hari terakhir.", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const isReffid = !target.startsWith("0") && !target.startsWith("62");
    const payload = isReffid ? { reffid: target } : { msisdn: target };
    axios.post("/api/v8/check-transaction", payload).then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        const html = res.data.map((t) => {
          const date = new Date(t.timestamp + 7 * 3600 * 1e3);
          return `
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left mb-3 text-sm">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-slate-800 text-xs">${date.toLocaleString("id-ID")}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${t.status === "SUKSES" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}">${t.status}</span>
                        </div>
                        <div class="text-slate-600 text-xs leading-relaxed mt-2">${t.message}</div>
                        <div class="text-[10px] text-slate-400 mt-2 font-mono">Reffid Pusat: #${t.reffid || "-"}</div>
                    </div>`;
        }).join("");
        Swal.fire({ title: "Log Server Pusat", html: `<div class="max-h-64 overflow-y-auto mt-4 pr-1">${html}</div>`, confirmButtonColor: "#1e293b", customClass: { popup: "rounded-[24px]" } });
      } else {
        Swal.fire("Info", res.data.error || "Tidak ada riwayat ditemukan.", "info");
      }
    }).catch((err) => Swal.fire("Error", err.response?.data?.error || "Akses ditolak atau gagal terhubung.", "error"));
  };
  const getRealStock = (p) => p.live_stock !== void 0 ? p.live_stock : p.stock_count || 0;
  const renderSmartDescription = (desc) => {
    if (!desc) return null;
    if (desc.includes("|") || desc.toLowerCase().includes("area")) {
      const parts = desc.split(/\||\n/).map((s) => s.trim()).filter((s) => s !== "");
      return /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-2", children: [
        /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800 mb-1.5", children: "📝 Detail Kuota Area:" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1 ml-1 mb-3", children: parts.map((p, idx) => {
          let clean = p.replace(/area\s*(\d+)/i, "Area $1 ").replace(":", " : ").replace(/^~?\s*/, "");
          return /* @__PURE__ */ jsxs("div", { children: [
            "• ",
            clean
          ] }, idx);
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "pt-2.5 border-t border-slate-200", children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800 mb-1 text-[10px] uppercase", children: "Catatan Penting:" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-0.5 ml-1 text-slate-500 text-[10px]", children: [
            /* @__PURE__ */ jsx("div", { children: "• Harap tunggu 1x24 jam untuk laporan kendala/komplain." }),
            /* @__PURE__ */ jsx("div", { children: "• Produk Resmi & Bergaransi di MILASTORE." })
          ] })
        ] })
      ] });
    }
    return /* @__PURE__ */ jsx("div", { className: "text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-2 whitespace-pre-wrap", dangerouslySetInnerHTML: { __html: desc } });
  };
  const handleOrder = (product) => {
    if (!target || target.trim().length < 5) return Swal.fire({ icon: "warning", title: "Tujuan Kosong", text: "Mohon isi nomor telepon tujuan terlebih dahulu.", confirmButtonColor: "#9333ea" });
    const targetsArray = target.split(/[\n,]+/).map((n) => n.trim()).filter((n) => n !== "");
    const jumlahTarget = targetsArray.length;
    const totalHargaAsli = product.price_sell * jumlahTarget;
    const totalHargaCoret = Math.round(product.price_sell * (1 + fakeMarkup)) * jumlahTarget;
    const isPO = orderMode === "po";
    const currentStock = getRealStock(product);
    if (!isPO && currentStock <= 0) {
      Swal.fire({
        title: "Stok Pusat Kosong",
        text: "Gunakan Mode Pre-Order agar otomatis dieksekusi saat stok masuk.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Pre-Order",
        cancelButtonText: "Paksa Beli",
        confirmButtonColor: "#9333ea",
        cancelButtonColor: "#ef4444",
        customClass: { popup: "rounded-[20px]" }
      }).then((result) => {
        if (result.isConfirmed) setOrderMode("po");
        else if (result.dismiss === Swal.DismissReason.cancel) executeOrder(product, targetsArray, totalHargaAsli, totalHargaCoret, isPO);
      });
    } else executeOrder(product, targetsArray, totalHargaAsli, totalHargaCoret, isPO);
  };
  const executeOrder = (product, targetsArray, totalHargaAsli, totalHargaCoret, isPO) => {
    const jumlahTarget = targetsArray.length;
    Swal.fire({
      title: `<div class="text-xl font-bold text-slate-800 tracking-tight">${isPO ? "Pre-Order" : "Konfirmasi Beli"}</div>`,
      html: `
                <div class="text-left text-sm mt-4 space-y-3">
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center"><span class="text-xs font-semibold text-slate-500">Produk</span><span class="text-sm font-bold text-slate-800 text-right w-1/2">${product.product_name}</span></div>
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center"><span class="text-xs font-semibold text-slate-500">Tujuan</span><span class="text-base font-bold text-slate-800">${jumlahTarget > 1 ? jumlahTarget + " Nomor (Massal)" : targetsArray[0]}</span></div>
                    <div class="bg-purple-50 p-4 rounded-xl border border-purple-100 flex justify-between items-center"><span class="text-xs font-semibold text-purple-600">Total Harga</span><div class="text-right"><span class="text-xs text-slate-400 line-through mr-2">Rp ${formatRp(totalHargaCoret)}</span><span class="text-xl font-extrabold text-purple-700">Rp ${formatRp(totalHargaAsli)}</span></div></div>
                </div>
            `,
      showCancelButton: true,
      cancelButtonText: "Batal",
      confirmButtonText: "Bayar Sekarang",
      buttonsStyling: false,
      customClass: { confirmButton: `w-full ${isPO ? "bg-slate-800" : "bg-purple-600"} text-white font-bold rounded-xl px-4 py-3.5 mt-5 transition shadow-md`, cancelButton: "w-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl px-4 py-3 mt-2 transition", popup: "rounded-[24px] p-6 w-full max-w-sm shadow-xl" }
    }).then((result) => {
      if (result.isConfirmed) {
        setIsProcessing(true);
        Swal.fire({ title: "Memproses...", text: "Tunggu sebentar.", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        axios.post("/order/place", { product_code: product.product_code, target, order_mode: orderMode }).then((res) => {
          setIsProcessing(false);
          if (res.data.success) {
            Swal.fire({ title: res.data.is_po_alert ? "Masuk Antrean" : "Sukses", text: res.data.message, icon: "success", timer: 3e3, showConfirmButton: false }).then(() => router.visit("/riwayat"));
          } else Swal.fire("Gagal", res.data.message, "warning");
        }).catch((err) => {
          setIsProcessing(false);
          Swal.fire("Error", "Server Sibuk.", "error");
        });
      }
    });
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Akrab V8 Pro - MILASTORE" }),
    /* @__PURE__ */ jsx("style", { children: fadeInUp }),
    isProcessing && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[9999] bg-white/60 backdrop-blur-sm" }),
    /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-slate-50 pb-24 pt-6 font-sans", children: /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto px-4 md:px-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsx(Link, { href: route("dashboard"), className: "w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 hover:border-purple-400 hover:text-purple-600 transition", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left" }) }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-extrabold text-slate-800", children: [
            "Akrab V8 ",
            /* @__PURE__ */ jsx("span", { className: "text-purple-600", children: "Pro" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-purple-500 tracking-[0.2em] uppercase mt-0.5", children: "MILASTORE" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-10" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white p-1.5 rounded-2xl mb-6 flex gap-1 border border-slate-200 shadow-sm", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setOrderMode("reguler"), className: `flex-1 py-3 rounded-xl text-xs font-bold transition flex justify-center items-center gap-2 ${orderMode === "reguler" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`, children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-bolt text-yellow-300" }),
          " Mode Instan"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setOrderMode("po"), className: `flex-1 py-3 rounded-xl text-xs font-bold transition flex justify-center items-center gap-2 ${orderMode === "po" ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`, children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-box-open" }),
          " Pre-Order (PO)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700", children: isMultiOrder ? "Target Massal" : "Nomor HP" }),
          /* @__PURE__ */ jsxs("button", { onClick: () => {
            setIsMultiOrder(!isMultiOrder);
            setTarget("");
          }, className: `text-[10px] font-bold px-3 py-1.5 rounded-lg transition border ${isMultiOrder ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`, children: [
            /* @__PURE__ */ jsx("i", { className: `fa-solid ${isMultiOrder ? "fa-check" : "fa-list"} mr-1.5` }),
            isMultiOrder ? "Massal" : "Single"
          ] })
        ] }),
        isMultiOrder ? /* @__PURE__ */ jsx("textarea", { value: target, onChange: (e) => setTarget(e.target.value), placeholder: "0819xxx, 0812xxx (Pisahkan dengan koma)", rows: "3", className: "w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-sm font-semibold text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition resize-none" }) : /* @__PURE__ */ jsx("input", { type: "text", value: target, onChange: (e) => setTarget(e.target.value), placeholder: "Contoh: 081234567890", className: "w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-lg font-bold text-slate-800 tracking-wide focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition" })
      ] }),
      !isMultiOrder && target.length > 5 && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-6 animate-fade-in-up", children: [
        /* @__PURE__ */ jsxs("button", { onClick: handleCheckPromo, className: "flex-1 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 py-3 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-tags" }),
          " Cek Promo"
        ] }),
        isAdmin && /* @__PURE__ */ jsxs("button", { onClick: handleCheckTrx, className: "flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-900 text-white py-3 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" }),
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-satellite-dish relative z-10" }),
          /* @__PURE__ */ jsxs("span", { className: "relative z-10", children: [
            "Lacak Server ",
            /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 ml-1", children: "(Admin)" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mb-6 mt-6", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setActiveTab("akrab"), className: `flex-1 py-3.5 rounded-xl text-sm font-bold transition border ${activeTab === "akrab" ? "bg-white border-purple-500 text-purple-700 shadow-sm ring-4 ring-purple-50" : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-300"}`, children: "🔥 Reguler XDA" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setActiveTab("am"), className: `flex-1 py-3.5 rounded-xl text-sm font-bold transition border ${activeTab === "am" ? "bg-white border-purple-500 text-purple-700 shadow-sm ring-4 ring-purple-50" : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-300"}`, children: "💠 Produk AM" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: activeProductsList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm", children: [
        /* @__PURE__ */ jsx("i", { className: "fa-solid fa-folder-open text-3xl text-slate-300 mb-3" }),
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-700", children: "Produk Tidak Tersedia" })
      ] }) : activeProductsList.map((p) => {
        const isSelected = selectedProduct?.id === p.id;
        const isPromo = p.product_code.toUpperCase().includes("XAP");
        const currentStock = getRealStock(p);
        const outOfStock = orderMode === "reguler" && currentStock <= 0;
        return /* @__PURE__ */ jsxs("div", { onClick: () => setSelectedProduct(isSelected ? null : p), className: `bg-white rounded-2xl p-4 transition-all duration-300 border cursor-pointer ${isSelected ? "border-purple-500 shadow-md ring-4 ring-purple-50 z-10 scale-[1.01]" : outOfStock ? "border-slate-200 bg-slate-100/50" : "border-slate-200 shadow-sm hover:border-purple-300"} animate-fade-in-up`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center flex-wrap gap-2 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded-md border ${isPromo ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-slate-100 text-slate-700 border-slate-200"}`, children: isPromo ? "🔥 PROMO" : p.product_code }),
                orderMode === "reguler" ? currentStock > 0 ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" }),
                  " Stok: ",
                  currentStock
                ] }) : /* @__PURE__ */ jsx("span", { className: "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100", children: "Kosong" }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200", children: "Jalur PO" })
              ] }),
              /* @__PURE__ */ jsx("h4", { className: `font-bold text-sm leading-snug ${outOfStock ? "text-slate-500" : "text-slate-800"}`, children: p.product_name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right pl-2", children: [
              /* @__PURE__ */ jsxs("div", { className: `text-base font-extrabold mb-2 ${isPromo ? "text-orange-600" : outOfStock ? "text-slate-500" : "text-purple-600"}`, children: [
                "Rp ",
                formatRp(p.price_sell)
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: (e) => {
                e.stopPropagation();
                if (!outOfStock) handleOrder(p);
              }, disabled: outOfStock, className: `w-full py-2 px-4 rounded-xl text-xs font-bold transition shadow-sm ${orderMode === "po" ? "bg-slate-800 text-white" : outOfStock ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"}`, children: orderMode === "po" ? "Antre PO" : outOfStock ? "Habis" : "Beli" })
            ] })
          ] }),
          isSelected && /* @__PURE__ */ jsx("div", { className: "mt-4 pt-4 border-t border-slate-200 animate-fade-in-up", children: renderSmartDescription(p.description) })
        ] }, p.id);
      }) })
    ] }) })
  ] });
}
export {
  AkrabV8 as default
};
