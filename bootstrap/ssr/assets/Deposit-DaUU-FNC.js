import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { router, Head, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
import axios from "axios";
import "moment";
const generateDynamicQRIS = (qrisStatic, nominal) => {
  if (!qrisStatic) return "";
  let rawQris = qrisStatic.trim();
  const idx = rawQris.lastIndexOf("6304");
  if (idx !== -1) {
    rawQris = rawQris.substring(0, idx);
  } else {
    rawQris = rawQris.substring(0, rawQris.length - 4);
  }
  const nomStr = nominal.toString();
  const nomLen = nomStr.length.toString().padStart(2, "0");
  const qrisNominal = `${rawQris}54${nomLen}${nomStr}6304`;
  let crc = 65535;
  for (let i = 0; i < qrisNominal.length; i++) {
    crc ^= qrisNominal.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 32768) !== 0) crc = crc << 1 ^ 4129;
      else crc = crc << 1;
    }
  }
  return qrisNominal + (crc & 65535).toString(16).toUpperCase().padStart(4, "0");
};
const OfficialQrisHeader = () => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
  /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 110 38", className: "h-7 w-auto", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M4 4h18v18H4V4zm4 4v10h10V8H8z", fill: "#0f172a" }),
    /* @__PURE__ */ jsx("path", { d: "M10 10h6v6h-6v-6zM32 4h16v6H38v6h10v6H32V4zm22 0h14v18h-6v-6h-8V4zm8 6h-2V8h2v2zm12-6h6v18h-6V4zm12 0h16v6h-10v6h10v6h-16V4z", fill: "#0f172a" }),
    /* @__PURE__ */ jsx("path", { d: "M4 28h18v6H4v-6zm28 0h6v6h-6v-6zm12 0h6v6h-6v-6zm12 0h18v6H56v-6z", fill: "#0f172a" }),
    /* @__PURE__ */ jsx("path", { d: "M2 2h22v22H2V2z", stroke: "#0f172a", strokeWidth: "2.5", fill: "none" })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "border-l border-slate-400 pl-2 leading-tight text-left", children: [
    /* @__PURE__ */ jsx("span", { className: "block text-[11px] font-black text-slate-900 tracking-tight", children: "QR Code Standar" }),
    /* @__PURE__ */ jsx("span", { className: "block text-[10px] font-black text-slate-900 tracking-tight", children: "Pembayaran Nasional" })
  ] })
] });
const OfficialGpnLogo = () => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
  /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 70 50", className: "h-7 w-auto", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M12 28C22 16 38 10 58 4C48 14 42 22 40 30C36 24 30 20 22 22C18 23 14 26 12 28Z", fill: "#e11d48" }),
    /* @__PURE__ */ jsx("path", { d: "M8 32C18 24 28 20 42 18C34 26 30 32 28 38C22 34 16 33 8 32Z", fill: "#be123c" }),
    /* @__PURE__ */ jsx("path", { d: "M4 38C14 32 24 30 32 30C26 38 22 44 20 48C14 44 8 42 4 38Z", fill: "#9f1239" })
  ] }),
  /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-[#1e293b] tracking-wider mt-0.5", children: "GPN" })
] });
function Deposit({ auth, history, paymentSettings = [] }) {
  const [amount, setAmount] = useState("");
  const [metode, setMetode] = useState("QRIS_GOPAY");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);
  const [isDownloading, setIsDownloading] = useState(false);
  const nominalOptions = [1e4, 25e3, 5e4, 1e5, 2e5, 499e3];
  const formatRp = (angka) => angka ? new Intl.NumberFormat("id-ID").format(angka) : "";
  const formatTime = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s % 3600 / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const handleAmountChange = (e) => setAmount(e.target.value.replace(/\D/g, ""));
  const isQris = metode.includes("QRIS");
  const isOverLimit = isQris && parseInt(amount) >= 5e5;
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: "top",
      icon: "success",
      title: `${label} berhasil disalin`,
      timer: 1500,
      showConfirmButton: false,
      background: "#ffffff",
      color: "#0f172a"
    });
  };
  const pendingTicket = (history || []).find((t) => t.status === "Pending");
  useEffect(() => {
    if (!pendingTicket) return;
    const expireTime = new Date(pendingTicket.created_at).getTime() + 24 * 60 * 60 * 1e3;
    const timerId = setInterval(() => setTimeLeft(Math.max(0, Math.floor((expireTime - (/* @__PURE__ */ new Date()).getTime()) / 1e3))), 1e3);
    return () => clearInterval(timerId);
  }, [pendingTicket]);
  useEffect(() => {
    if (!pendingTicket?.id) return;
    const pollingId = setInterval(async () => {
      try {
        const res = await axios.get(`/deposit/${pendingTicket.id}/status?_t=${(/* @__PURE__ */ new Date()).getTime()}`);
        const status = res.data?.status?.toLowerCase();
        if (status === "sukses") {
          clearInterval(pollingId);
          Swal.fire({
            title: "Pembayaran Diterima!",
            text: `Saldo Rp ${formatRp(pendingTicket.total_bayar)} berhasil ditambahkan.`,
            icon: "success",
            background: "#ffffff",
            color: "#0f172a",
            confirmButtonColor: "#2563eb"
          }).then(() => router.reload({ only: ["history"] }));
        } else if (status === "dibatalkan" || status === "gagal") {
          clearInterval(pollingId);
          Swal.fire({
            title: "Tiket Dibatalkan",
            text: "Tagihan deposit telah dibatalkan.",
            icon: "info",
            background: "#ffffff",
            color: "#0f172a",
            confirmButtonColor: "#64748b"
          }).then(() => router.reload({ only: ["history"] }));
        }
      } catch (e) {
      }
    }, 3e3);
    return () => clearInterval(pollingId);
  }, [pendingTicket?.id]);
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (isOverLimit) return;
    if (!amount || parseInt(amount) < 1e3) {
      return Swal.fire({
        title: "Perhatian",
        text: "Minimal deposit Rp 1.000",
        icon: "warning",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#2563eb"
      });
    }
    setIsLoading(true);
    try {
      const res = await axios.post("/deposit", { jumlah: amount, metode });
      setIsLoading(false);
      if (res.data.status === "success") {
        Swal.fire({
          title: "Tiket Dibuat",
          text: res.data.message,
          icon: "success",
          background: "#ffffff",
          color: "#0f172a",
          confirmButtonColor: "#2563eb"
        }).then(() => {
          router.reload({ only: ["history"] });
          setAmount("");
        });
      } else {
        Swal.fire({
          title: "Gagal",
          text: res.data.message,
          icon: "error",
          background: "#ffffff",
          color: "#0f172a"
        });
      }
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        title: "Kendala Sistem",
        text: "Terjadi kendala saat memproses deposit.",
        icon: "error",
        background: "#ffffff",
        color: "#0f172a"
      });
    }
  };
  const handleCancel = async (id) => {
    const confirm = await Swal.fire({
      title: "Batalkan Tiket?",
      text: "Tiket pembayaran ini akan dihapus dari antrean.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Kembali",
      background: "#ffffff",
      color: "#0f172a"
    });
    if (confirm.isConfirmed) {
      try {
        await axios.post("/deposit/cancel", { id });
        router.reload({ only: ["history"] });
      } catch (e) {
        Swal.fire({
          title: "Gagal",
          text: "Gagal membatalkan tiket.",
          icon: "error",
          background: "#ffffff",
          color: "#0f172a"
        });
      }
    }
  };
  const getBankData = (m) => paymentSettings.find((s) => s.metode === m) || {};
  const pendingBankData = pendingTicket ? getBankData(pendingTicket.metode) : {};
  let finalQrisUrl = "";
  if (pendingTicket?.metode?.includes("QRIS") && pendingBankData.nomor) {
    const str = generateDynamicQRIS(pendingBankData.nomor, pendingTicket.total_bayar);
    finalQrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(str)}&margin=10`;
  }
  const downloadNationalQrisPoster = async () => {
    if (!finalQrisUrl) return;
    setIsDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1.5;
      for (let x = 0; x < canvas.width; x += 50) {
        for (let y = 0; y < canvas.height; y += 50) {
          ctx.strokeRect(x, y, 35, 35);
        }
      }
      ctx.fillStyle = "#f3f4f6";
      ctx.beginPath();
      ctx.moveTo(0, 240);
      ctx.lineTo(190, 390);
      ctx.lineTo(0, 540);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.moveTo(0, 270);
      ctx.lineTo(170, 390);
      ctx.lineTo(0, 510);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.moveTo(canvas.width, 820);
      ctx.lineTo(440, 1200);
      ctx.lineTo(canvas.width, 1200);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 36px sans-serif";
      ctx.fillText("QRIS", 50, 75);
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("QR Code Standar", 160, 62);
      ctx.fillText("Pembayaran Nasional", 160, 82);
      ctx.fillStyle = "#be123c";
      ctx.font = "900 24px sans-serif";
      ctx.fillText("GPN", canvas.width - 110, 80);
      const merchantName = pendingBankData.atas_nama || "AMIFI STORE, KMB, TLGSR";
      const nmid = pendingBankData.nomor ? pendingBankData.nomor.slice(0, 19) : "ID1024334136412";
      ctx.textAlign = "center";
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 28px sans-serif";
      ctx.fillText(merchantName.toUpperCase(), canvas.width / 2, 190);
      ctx.fillStyle = "#334155";
      ctx.font = "600 19px sans-serif";
      ctx.fillText(`NMID: ${nmid}`, canvas.width / 2, 230);
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("A01", canvas.width / 2, 265);
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = finalQrisUrl;
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
      });
      const qrSize = 390;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 300;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("SATU QRIS UNTUK SEMUA", canvas.width / 2, 730);
      ctx.fillStyle = "#475569";
      ctx.font = "500 15px sans-serif";
      ctx.fillText("Cek aplikasi penyelenggara", canvas.width / 2, 755);
      ctx.fillText("di: www.aspi-qris.id", canvas.width / 2, 775);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.fillRect(80, 810, canvas.width - 160, 60);
      ctx.strokeRect(80, 810, canvas.width - 160, 60);
      ctx.fillStyle = "#e11d48";
      ctx.font = "900 24px sans-serif";
      ctx.fillText(`TOTAL BAYAR: Rp ${formatRp(pendingTicket.total_bayar)}`, canvas.width / 2, 850);
      ctx.textAlign = "left";
      ctx.fillStyle = "#334155";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Dicetak oleh: 93600914", 50, 1020);
      ctx.fillText("Versi cetak: V1.0.2024.12.16", 50, 1055);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "right";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Cara pembayaran QRIS", canvas.width - 40, 990);
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("Buka Aplikasi • Scan dan cek • Bayar", canvas.width - 40, 1060);
      const dataUrl = canvas.toDataURL("image/png");
      if (window.AndroidBridge) {
        window.AndroidBridge.downloadBase64Image(dataUrl, `QRIS-Milastore-Rp${pendingTicket.total_bayar}.png`);
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `QRIS-Milastore-Rp${pendingTicket.total_bayar}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Poster QRIS berhasil diunduh",
        timer: 1500,
        showConfirmButton: false,
        background: "#ffffff",
        color: "#0f172a"
      });
    } catch (error) {
      Swal.fire({
        title: "Gagal",
        text: "Gagal merender poster QRIS.",
        icon: "error",
        background: "#ffffff",
        color: "#0f172a"
      });
    }
    setIsDownloading(false);
  };
  const paymentOptions = [
    {
      id: "QRIS_GOPAY",
      name: "QRIS Instan 1 (All Payment)",
      desc: "DANA, OVO, GoPay, BCA Mobile, dll",
      isQrisBadge: true,
      tag: "⚡ Otomatis",
      tagClass: "bg-emerald-50 text-emerald-600 border border-emerald-200"
    },
    {
      id: "QRIS_SHOPEE",
      name: "QRIS Instan 2 (All Payment)",
      desc: "ShopeePay, Livin Mandiri, BRImo, dll",
      isQrisBadge: true,
      tag: "⚡ Otomatis",
      tagClass: "bg-rose-50 text-rose-600 border border-rose-200"
    },
    {
      id: "SEABANK",
      name: "SeaBank Virtual Transfer",
      desc: "Bebas biaya admin antar bank",
      isTextLogo: true,
      textLogo: "SeaBank",
      textClass: "font-black text-orange-500 text-sm tracking-tight",
      tag: "Manual/Auto",
      tagClass: "bg-orange-50 text-orange-600 border border-orange-200"
    },
    {
      id: "JAGO",
      name: "Bank Jago Transfer",
      desc: "Transfer sesama & antar bank 24 jam",
      isTextLogo: true,
      textLogo: "jago",
      textClass: "font-black text-amber-500 text-lg tracking-tighter lowercase",
      tag: "24 Jam",
      tagClass: "bg-amber-50 text-amber-700 border border-amber-200"
    }
  ];
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Isi Saldo" }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs", children: /* @__PURE__ */ jsxs("div", { className: "max-w-lg mx-auto px-4 h-14 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: "/dashboard",
            className: "w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center transition-colors text-slate-600",
            children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left text-xs" })
          }
        ),
        /* @__PURE__ */ jsx("h1", { className: "text-sm font-bold tracking-tight text-slate-900", children: "Isi Saldo Akun" }),
        /* @__PURE__ */ jsx("div", { className: "w-8" })
      ] }) }),
      /* @__PURE__ */ jsxs("main", { className: "max-w-lg mx-auto px-4 pt-4 space-y-4", children: [
        !pendingTicket ? /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleDeposit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600", children: "Nominal Pengisian" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 font-medium", children: "Min. Rp 1.000" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:bg-white transition-all px-3.5 py-2.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-400 mr-2 select-none", children: "Rp" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "tel",
                  value: formatRp(amount),
                  onChange: handleAmountChange,
                  placeholder: "0",
                  className: "w-full bg-transparent border-0 p-0 text-2xl font-black text-slate-900 focus:ring-0 focus:outline-none placeholder:text-slate-300 tracking-tight"
                }
              ),
              amount && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setAmount(""),
                  className: "w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] hover:bg-slate-300",
                  children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-xmark" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: nominalOptions.map((nom) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setAmount(nom.toString()),
              className: `py-2 px-2 rounded-xl text-xs font-semibold transition-all border ${amount === nom.toString() ? "bg-blue-50 text-blue-600 border-blue-500 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`,
              children: [
                "Rp ",
                formatRp(nom)
              ]
            },
            nom
          )) }),
          isOverLimit && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-xl text-center", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-red-600 font-semibold leading-relaxed", children: "Maksimal transaksi QRIS Rp 499.000. Untuk nominal lebih besar, silakan gunakan transfer bank." }) }),
          /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-2", children: "Metode Pembayaran" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: paymentOptions.map((opt) => {
              const isSelected = metode === opt.id;
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => setMetode(opt.id),
                  className: `p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500 shadow-xs" : "border-slate-200/90 bg-white hover:border-slate-300"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-14 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 shrink-0", children: opt.isQrisBadge ? /* @__PURE__ */ jsx("div", { className: "bg-[#e11d48] text-white text-[11px] font-black tracking-widest px-2 py-0.5 rounded", children: "QRIS" }) : opt.isTextLogo ? /* @__PURE__ */ jsx("span", { className: opt.textClass, children: opt.textLogo }) : /* @__PURE__ */ jsx("img", { src: opt.logo, alt: opt.name, className: "max-h-full max-w-full object-contain" }) }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-800", children: opt.name }),
                          /* @__PURE__ */ jsx("span", { className: `text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${opt.tagClass}`, children: opt.tag })
                        ] }),
                        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 font-normal mt-0.5", children: opt.desc })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: `w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`, children: isSelected && /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white" }) })
                  ]
                },
                opt.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: isLoading || !amount || parseInt(amount) < 1e3 || isOverLimit,
              className: `w-full py-3.5 rounded-xl text-xs font-bold tracking-wide shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${isOverLimit || !amount || parseInt(amount) < 1e3 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`,
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle-notch fa-spin text-sm" }),
                /* @__PURE__ */ jsx("span", { children: "Membuat Tiket..." })
              ] }) : /* @__PURE__ */ jsx("span", { children: "Lanjutkan Pembayaran" })
            }
          )
        ] }) }) }) : (
          /* ⏳ KARTU POSTER RESMI QRIS STANDAR PEMBAYARAN NASIONAL */
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-800", children: "Menunggu Pembayaran" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200", children: [
                "Sisa waktu ",
                formatTime(timeLeft)
              ] })
            ] }),
            pendingTicket.metode.includes("QRIS") ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative bg-white border border-slate-300/80 rounded-2xl p-6 shadow-sm overflow-hidden text-center max-w-[340px] mx-auto", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-1/3 -left-12 w-24 h-32 bg-slate-100 rotate-45 pointer-events-none" }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-1/3 -left-14 w-24 h-28 bg-[#e11d48] rotate-45 pointer-events-none" }),
                /* @__PURE__ */ jsx("div", { className: "absolute -bottom-16 -right-16 w-44 h-44 bg-[#e11d48] rotate-45 pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10 mb-4 pb-2", children: [
                  /* @__PURE__ */ jsx(OfficialQrisHeader, {}),
                  /* @__PURE__ */ jsx(OfficialGpnLogo, {})
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative z-10 mb-3", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-black text-slate-900 text-sm tracking-tight uppercase", children: pendingBankData.atas_nama || "AMIFI STORE, KMB, TLGSR" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-semibold text-slate-600 mt-0.5", children: [
                    "NMID: ",
                    pendingBankData.nomor ? pendingBankData.nomor.slice(0, 19) : "ID1024334136412"
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-500 mt-0.5", children: "A01" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "relative z-10 inline-block bg-white p-2 rounded-lg shadow-2xs border border-slate-200", children: finalQrisUrl ? /* @__PURE__ */ jsx("img", { src: finalQrisUrl, className: "w-56 h-56 object-contain mx-auto", alt: "QRIS Nasional" }) : /* @__PURE__ */ jsx("div", { className: "w-56 h-56 flex items-center justify-center text-xs text-slate-400", children: "Memuat QR..." }) }),
                /* @__PURE__ */ jsxs("div", { className: "relative z-10 mt-3", children: [
                  /* @__PURE__ */ jsx("h5", { className: "text-[11px] font-extrabold text-slate-900 tracking-tight", children: "SATU QRIS UNTUK SEMUA" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-slate-500 leading-tight mt-0.5", children: [
                    "Cek aplikasi penyelenggara",
                    /* @__PURE__ */ jsx("br", {}),
                    "di: www.aspi-qris.id"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative z-10 mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between px-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500", children: "TOTAL BAYAR:" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-sm font-black text-[#e11d48]", children: [
                      "Rp ",
                      formatRp(pendingTicket.total_bayar)
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => copyToClipboard(pendingTicket.total_bayar, "Nominal"),
                        className: "text-slate-400 hover:text-blue-600 p-1",
                        children: /* @__PURE__ */ jsx("i", { className: "fa-regular fa-copy text-xs" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-end justify-between text-left", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[8px] font-semibold text-slate-600", children: "Dicetak oleh: 93600914" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[8px] font-semibold text-slate-600", children: "Versi cetak: V1.0.2024.12.16" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right text-white", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[8px] font-bold opacity-95", children: "Cara bayar QRIS" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[7px] font-medium opacity-90", children: "Buka • Scan • Bayar" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: downloadNationalQrisPoster,
                  disabled: isDownloading,
                  className: "w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx("i", { className: `fa-solid ${isDownloading ? "fa-spinner fa-spin" : "fa-download"} text-sm` }),
                    /* @__PURE__ */ jsx("span", { children: isDownloading ? "Menyiapkan Gambar HD..." : "Simpan Poster QRIS ke HP" })
                  ]
                }
              )
            ] }) : (
              /* Transfer Bank View */
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 text-xs shadow-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium", children: "Metode Transfer" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: pendingTicket.metode })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium", children: "Nomor Rekening Tujuan" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono font-black text-slate-900 text-sm tracking-wide", children: pendingBankData.nomor || "-" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => copyToClipboard(pendingBankData.nomor, "Nomor Rekening"),
                        className: "text-blue-600 hover:text-blue-700",
                        children: /* @__PURE__ */ jsx("i", { className: "fa-regular fa-copy" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium", children: "Atas Nama" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: pendingBankData.atas_nama || "-" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-slate-200 flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium", children: "Nominal Pas" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxs("span", { className: "font-black text-red-600 text-base", children: [
                      "Rp ",
                      formatRp(pendingTicket.total_bayar)
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => copyToClipboard(pendingTicket.total_bayar, "Nominal"),
                        className: "text-slate-400 hover:text-blue-600",
                        children: /* @__PURE__ */ jsx("i", { className: "fa-regular fa-copy text-xs" })
                      }
                    )
                  ] })
                ] })
              ] })
            ),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 pt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleCancel(pendingTicket.id),
                  className: "py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors",
                  children: "Batalkan Tiket"
                }
              ),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: `https://wa.me/6287760390507?text=Halo%20Admin,%20saya%20sudah%20transfer%20deposit%20ID%20${pendingTicket.id}%20via%20${pendingTicket.metode}%20sebesar%20Rp%20${formatRp(pendingTicket.total_bayar)}`,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5",
                  children: [
                    /* @__PURE__ */ jsx("i", { className: "fa-brands fa-whatsapp text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { children: "Bantuan CS" })
                  ]
                }
              )
            ] })
          ] })
        ),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xs font-bold text-slate-500 tracking-tight px-1", children: "Riwayat Deposit Terakhir" }),
          /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs", children: history.filter((h) => h.status !== "Pending").length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-8 text-center text-xs text-slate-400 font-medium", children: "Belum ada riwayat transaksi" }) : history.filter((h) => h.status !== "Pending").slice(0, 10).map((r) => {
            const st = r.status.toLowerCase();
            const isSuccess = st === "sukses";
            const isFailed = st === "gagal" || st === "dibatalkan";
            const dateObj = new Date(r.created_at);
            const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")} ${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
            let displayMetode = r.metode;
            if (r.metode === "QRIS_GOPAY") displayMetode = "QRIS 1";
            if (r.metode === "QRIS_SHOPEE") displayMetode = "QRIS 2";
            return /* @__PURE__ */ jsxs("div", { className: "p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 ${isSuccess ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : isFailed ? "bg-rose-50 text-rose-500 border border-rose-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`, children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${isSuccess ? "fa-arrow-down-left" : isFailed ? "fa-xmark" : "fa-clock"}` }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-slate-800", children: [
                    "Rp ",
                    formatRp(r.total_bayar)
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-slate-400 font-medium", children: [
                    displayMetode,
                    " • ",
                    formattedDate
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded-md border ${isSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isFailed ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`, children: r.status })
            ] }, r.id);
          }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  Deposit as default
};
