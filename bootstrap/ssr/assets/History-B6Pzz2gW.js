import { jsxs, jsx } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { router, Head, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import "axios";
import "moment";
const modernStyles = `
    .modern-bg {
        background-color: #f8fafc;
        background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.05) 0px, transparent 50%);
        min-height: 100vh;
    }
    .modern-card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(226, 232, 240, 0.8);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .modern-card:hover {
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.08);
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
`;
function History({ auth, transactions, filters }) {
  useEffect(() => {
    const hasPending = transactions?.data?.some((t) => ["Proses", "Wait", "Pending", "Proses_API"].includes(t.status));
    if (hasPending) {
      const interval = setInterval(() => {
        router.reload({ only: ["transactions"], preserveScroll: true });
      }, 5e3);
      return () => clearInterval(interval);
    }
  }, [transactions]);
  const [search, setSearch] = useState(filters?.search || "");
  const [filterStatus, setFilterStatus] = useState(filters?.status || "Semua");
  const [showModal, setShowModal] = useState(false);
  const [activeTrx, setActiveTrx] = useState(null);
  const [tokoName, setTokoName] = useState(auth.user.username || auth.user.name || "Milastore Konter");
  const [hargaJual, setHargaJual] = useState(0);
  const receiptRef = useRef(null);
  const applyFilters = (newSearch, newStatus) => {
    router.get("/riwayat", { search: newSearch, status: newStatus }, { preserveState: true, preserveScroll: true });
  };
  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters(search, filterStatus);
  };
  const handleFilterChange = (statusName) => {
    setFilterStatus(statusName);
    applyFilters(search, statusName);
  };
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(n);
  const maskSN = (sn) => {
    if (!sn || sn === "-" || String(sn).toLowerCase() === "null") return "";
    return String(sn).replace(/kaje|kj|khfy/gi, "MS");
  };
  const copyToClipboard = (text) => {
    if (!text || text === "-") return Swal.fire({ icon: "error", title: "Kosong", text: "Tidak ada data untuk disalin.", customClass: { popup: "rounded-[20px]" } });
    navigator.clipboard.writeText(text);
    Swal.fire({ title: "Tersalin! 📋", text: "Data berhasil disalin ke clipboard", icon: "success", timer: 1200, showConfirmButton: false, customClass: { popup: "rounded-[20px]" } });
  };
  const openPrintModal = (trx) => {
    setActiveTrx(trx);
    setHargaJual(Number(trx.harga) + 2e3);
    setShowModal(true);
  };
  const handlePrint = () => window.print();
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    Swal.fire({ title: "Memproses Struk...", text: "Mencetak HD Image", allowOutsideClick: false, customClass: { popup: "rounded-[20px]" }, didOpen: () => {
      Swal.showLoading();
    } });
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: null });
      const fileName = `STRUK_${tokoName.replace(/\s+/g, "_")}_${activeTrx.tujuan}.png`;
      const base64Image = canvas.toDataURL("image/png");
      if (window.AndroidBridge) {
        window.AndroidBridge.downloadBase64Image(base64Image, fileName);
        Swal.fire({ title: "Berhasil! 🎉", text: "Struk disimpan ke Galeri HP!", icon: "success", timer: 1500, showConfirmButton: false, customClass: { popup: "rounded-[20px]" } });
      } else {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = base64Image;
        link.click();
        Swal.fire({ title: "Berhasil! 🎉", text: "Struk berhasil didownload!", icon: "success", timer: 1500, showConfirmButton: false, customClass: { popup: "rounded-[20px]" } });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Gagal", text: "Kesalahan sistem saat membuat gambar.", customClass: { popup: "rounded-[20px]" } });
    }
  };
  const StatusBadge = ({ status }) => {
    const s = String(status).toLowerCase();
    if (s.includes("sukses") || s.includes("success") || s.includes("berhasil")) return /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
      "Sukses"
    ] });
    if (s.includes("gagal") || s.includes("error") || s.includes("batal")) return /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-rose-500" }),
      "Gagal"
    ] });
    return /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse", children: [
      /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-500" }),
      "Proses"
    ] });
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Riwayat Transaksi - Milastore" }),
    /* @__PURE__ */ jsx("style", { children: modernStyles }),
    /* @__PURE__ */ jsxs("div", { className: "modern-bg font-['Outfit'] print:hidden pb-[140px] md:pb-32", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 pt-8 pb-20 px-6 rounded-b-[36px] shadow-xl relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 w-full md:w-auto", children: [
            /* @__PURE__ */ jsx(Link, { href: "/dashboard", className: "w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 shadow-inner", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left text-sm" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-white tracking-wide uppercase", children: "Riwayat Transaksi" }),
              /* @__PURE__ */ jsx("p", { className: "text-indigo-200 text-[11px] font-medium tracking-wider mt-0.5", children: "Pusat monitoring & cetak struk digital" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "w-full md:w-72 relative group", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Cari No. Tujuan / Ref ID / SN...",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                className: "w-full bg-black/25 border border-white/15 text-white placeholder-white/40 text-xs rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-400 focus:bg-black/40 outline-none transition-all shadow-inner"
              }
            ),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-6 -mt-10 relative z-25", children: [
        /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1", children: ["Semua", "Berhasil", "Pending", "Gagal"].map((status) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilterChange(status),
            className: `shrink-0 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${filterStatus === status ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]" : "bg-white/90 backdrop-blur-md text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-white"}`,
            children: status
          },
          status
        )) }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3.5 mb-8", children: transactions?.data?.length > 0 ? transactions.data.map((trx) => {
          const isSukses = String(trx.status).toLowerCase().includes("sukses") || String(trx.status).toLowerCase().includes("berhasil");
          const maskedSN = maskSN(trx.sn);
          const textKeterangan = String(trx.keterangan || "").trim();
          const displayMessage = maskedSN ? maskedSN : textKeterangan && textKeterangan !== "-" ? textKeterangan : "Menunggu Respon Provider...";
          return /* @__PURE__ */ jsxs("div", { className: "modern-card rounded-[24px] p-5 flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden group", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 w-full md:w-auto", children: [
              /* @__PURE__ */ jsxs("div", { className: "w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100/60 flex flex-col items-center justify-center shrink-0 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-receipt text-base" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[7px] font-black mt-0.5 opacity-80", children: [
                  new Date(trx.created_at).getDate(),
                  "/",
                  new Date(trx.created_at).getMonth() + 1
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between md:block items-center mb-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase text-indigo-600 tracking-wider", children: trx.nama_produk || trx.kode_layanan }),
                  /* @__PURE__ */ jsx("span", { className: "md:hidden", children: /* @__PURE__ */ jsx(StatusBadge, { status: trx.status }) })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "font-black text-slate-900 text-base tracking-tight", children: trx.tujuan }),
                /* @__PURE__ */ jsx("div", { className: "mt-2.5 w-full pr-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-100/80 border border-slate-200/70 rounded-xl p-2.5 text-[11px] font-mono text-slate-700 break-words w-full relative pr-10 shadow-inner", children: [
                  displayMessage,
                  /* @__PURE__ */ jsx("button", { onClick: () => copyToClipboard(displayMessage), className: "absolute top-2 right-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 p-1.5 rounded-lg shadow-sm border border-slate-200/60 transition-all active:scale-90", title: "Salin Teks", children: /* @__PURE__ */ jsx("i", { className: "fa-regular fa-copy" }) })
                ] }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col justify-between items-end min-w-[130px]", children: [
              /* @__PURE__ */ jsx(StatusBadge, { status: trx.status }),
              /* @__PURE__ */ jsxs("div", { className: "text-right mt-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 font-black tracking-widest uppercase", children: "Harga Modal" }),
                /* @__PURE__ */ jsxs("p", { className: "font-black text-slate-900 text-sm", children: [
                  "Rp ",
                  formatRp(trx.harga)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:hidden flex justify-between items-center pt-3 border-t border-slate-100 mt-1", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 font-black tracking-widest uppercase", children: "Harga Modal" }),
                /* @__PURE__ */ jsxs("p", { className: "font-black text-slate-900 text-sm", children: [
                  "Rp ",
                  formatRp(trx.harga)
                ] })
              ] }),
              isSukses && /* @__PURE__ */ jsxs("button", { onClick: () => openPrintModal(trx), className: "text-[10px] font-black uppercase tracking-wider bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100 active:scale-95 transition-all shadow-sm", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-print mr-1.5" }),
                " Struk"
              ] })
            ] }),
            isSukses && /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center", children: /* @__PURE__ */ jsx("button", { onClick: () => openPrintModal(trx), className: "w-12 h-12 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-2xl transition-all border border-indigo-100 flex items-center justify-center active:scale-95 shadow-sm hover:shadow-md", title: "Cetak Struk", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-print text-base" }) }) })
          ] }, trx.id);
        }) : /* @__PURE__ */ jsxs("div", { className: "bg-white/80 backdrop-blur-md rounded-[32px] p-12 text-center border border-slate-200/80 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-folder-open" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-700 uppercase tracking-widest", children: "Tidak Ada Riwayat" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-xs font-medium mt-1", children: "Belum ada transaksi yang sesuai dengan filter Anda." })
        ] }) }),
        transactions?.links && transactions.data.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-1.5 pb-12", children: transactions.links.map((link, index) => {
          if (!link.url && !link.active) return null;
          return /* @__PURE__ */ jsx(
            Link,
            {
              href: link.url || "#",
              preserveScroll: true,
              dangerouslySetInnerHTML: { __html: link.label.replace("Previous", '<i class="fa-solid fa-angle-left"></i>').replace("Next", '<i class="fa-solid fa-angle-right"></i>') },
              className: `px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${link.active ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20" : !link.url ? "bg-transparent text-slate-300 border-transparent cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`
            },
            index
          );
        }) })
      ] })
    ] }),
    showModal && activeTrx && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 print:hidden animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-100", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 flex justify-between items-center border-b border-slate-100", children: [
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", { className: "font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-receipt text-xs" }) }),
          "Cetak Struk"
        ] }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowModal(false), className: "text-slate-400 hover:text-rose-500 transition-colors w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center active:scale-90", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-xmark" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4 bg-slate-50/50", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2", children: "Nama Konter / Toko" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: tokoName, onChange: (e) => setTokoName(e.target.value), className: "w-full border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2", children: "Harga Jual (Rp)" }),
          /* @__PURE__ */ jsx("input", { type: "number", value: hargaJual, onChange: (e) => setHargaJual(e.target.value), className: "w-full border border-slate-200 rounded-2xl p-3 text-sm font-black text-indigo-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 mt-1.5 font-bold", children: [
            "Harga modal asli: Rp ",
            formatRp(activeTrx.harga)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 bg-white flex gap-3 border-t border-slate-100", children: [
        /* @__PURE__ */ jsxs("button", { onClick: handlePrint, className: "flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3.5 rounded-2xl transition-all uppercase tracking-wider text-[10px] flex justify-center items-center gap-2 active:scale-95", children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-print" }),
          " Thermal"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: handleDownloadImage, className: "flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all uppercase tracking-wider text-[10px] flex justify-center items-center gap-2 active:scale-95", children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-download" }),
          " Unduh HD"
        ] })
      ] })
    ] }) }),
    showModal && activeTrx && /* @__PURE__ */ jsxs("div", { className: "hidden print:block font-mono text-black bg-white w-[80mm] mx-auto text-sm p-4 leading-relaxed border-none", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-4", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-bold text-xl uppercase tracking-widest m-0 p-0 border-b-2 border-dashed border-black pb-2 mb-2", children: tokoName }),
        /* @__PURE__ */ jsx("p", { className: "text-xs m-0", children: "Struk Pembelian Elektrik" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "w-20", children: "Tanggal" }),
          /* @__PURE__ */ jsxs("span", { children: [
            ": ",
            new Date(activeTrx.created_at).toLocaleString("id-ID")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "w-20", children: "No. Ref" }),
          /* @__PURE__ */ jsxs("span", { children: [
            ": ",
            activeTrx.ref_id
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-b border-dashed border-black py-2 mb-4 text-xs", children: [
        /* @__PURE__ */ jsx("div", { className: "font-bold mb-1", children: activeTrx.nama_produk || activeTrx.kode_layanan }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-2", children: [
          /* @__PURE__ */ jsx("span", { children: "Tujuan:" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: activeTrx.tujuan })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
          /* @__PURE__ */ jsx("span", { className: "block mb-1", children: "SN / Token:" }),
          /* @__PURE__ */ jsx("span", { className: "block font-bold break-all bg-gray-100 p-1", children: maskSN(activeTrx.sn) || activeTrx.keterangan || "-" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-base font-bold mb-6", children: [
        /* @__PURE__ */ jsx("span", { children: "TOTAL BAYAR" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Rp ",
          formatRp(hargaJual)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center text-xs border-t-2 border-dashed border-black pt-4", children: [
        /* @__PURE__ */ jsx("p", { className: "m-0", children: "Terima Kasih" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-[10px]", children: [
          "Powered by ",
          tokoName
        ] })
      ] })
    ] }),
    showModal && activeTrx && /* @__PURE__ */ jsx("div", { className: "fixed top-[-9999px] left-[-9999px] z-[-50] print:hidden", children: /* @__PURE__ */ jsxs("div", { ref: receiptRef, className: "w-[420px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 rounded-[32px] text-white shadow-2xl relative font-sans border border-indigo-500/30", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center border-b border-white/15 pb-4 mb-5", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 uppercase drop-shadow", children: tokoName }),
        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-indigo-200 font-black uppercase tracking-[0.25em] mt-1", children: "Bukti Pembayaran Digital Resmi" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 relative z-10 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-white/10 pb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-indigo-300 font-medium", children: "Waktu Transaksi" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: new Date(activeTrx.created_at).toLocaleString("id-ID") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-white/10 pb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-indigo-300 font-medium", children: "No. Referensi" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: activeTrx.ref_id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-white/10 pb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-indigo-300 font-medium", children: "Produk" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold max-w-[220px] text-right", children: activeTrx.nama_produk || activeTrx.kode_layanan })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-white/10 pb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-indigo-300 font-medium", children: "Tujuan / Nomor" }),
          /* @__PURE__ */ jsx("span", { className: "font-black text-base tracking-wider", children: activeTrx.tujuan })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 bg-white/5 rounded-2xl p-3.5 border border-white/10 shadow-inner", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-indigo-300 uppercase tracking-wider font-black mb-1", children: "SN / Token / Pesan" }),
        /* @__PURE__ */ jsx("p", { className: "font-mono text-xs font-bold text-white break-all", children: maskSN(activeTrx.sn) || activeTrx.keterangan || "-" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-5 border-t-2 border-dashed border-white/20 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-indigo-300 uppercase tracking-widest font-black mb-1", children: "TOTAL PEMBAYARAN" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-black text-emerald-400 drop-shadow", children: [
          "Rp ",
          formatRp(hargaJual)
        ] })
      ] })
    ] }) })
  ] });
}
export {
  History as default
};
