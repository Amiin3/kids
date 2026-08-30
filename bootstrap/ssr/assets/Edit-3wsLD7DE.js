import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import UpdateProfileInformation from "./UpdateProfileInformationForm-DmOzctMU.js";
import UpdatePasswordForm from "./UpdatePasswordForm-zvD8TgBd.js";
import UpdatePinForm from "./UpdatePinForm-CWusCWxK.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "moment";
import "./TextInput-BP-vnUns.js";
import "./InputLabel-CE_n4Upz.js";
import "./PrimaryButton-DgVfVBwo.js";
import "@headlessui/react";
function Edit({ auth, full_user, mustVerifyEmail, status }) {
  const { url } = usePage();
  const [appTheme, setAppTheme] = useState({ bg_type: "color_dark", bg_value: "from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6]" });
  const userLevel = full_user?.level || auth?.user?.level || "member";
  const levelConfig = {
    member: { label: "Member", color: "bg-slate-500", icon: "fa-medal text-slate-300", shadow: "shadow-slate-500/50" },
    reseller: { label: "Reseller", color: "bg-gradient-to-r from-amber-400 to-yellow-600", icon: "fa-crown text-yellow-200", shadow: "shadow-amber-500/50" },
    h2h: { label: "Partner H2H", color: "bg-gradient-to-r from-blue-500 to-indigo-700", icon: "fa-gem text-blue-200", shadow: "shadow-blue-500/50" },
    admin: { label: "Owner", color: "bg-gradient-to-r from-rose-500 to-purple-700", icon: "fa-shield-halved text-rose-200", shadow: "shadow-rose-500/50" }
  };
  const currentLevel = levelConfig[userLevel.toLowerCase()] || levelConfig.member;
  const [h2h, setH2h] = useState({
    api_key: full_user?.api_key || auth?.user?.api_key || "",
    payment_webhook: full_user?.payment_webhook || auth?.user?.payment_webhook || "",
    payment_secret: full_user?.payment_secret || auth?.user?.payment_secret || "",
    webhook_url: full_user?.webhook_url || auth?.user?.webhook_url || "",
    ip_whitelist: full_user?.ip_whitelist || auth?.user?.ip_whitelist || ""
  });
  useEffect(() => {
    axios.get("/api/theme/status").then((res) => setAppTheme(res.data)).catch(() => {
    });
  }, []);
  const isSpace = appTheme.bg_value === "animated_space";
  const isClouds = appTheme.bg_value === "animated_clouds";
  const actualThemeType = isSpace || isClouds ? appTheme.bg_value : appTheme.bg_type;
  const isLightTheme = actualThemeType === "color_light";
  let themeClass = `bg-gradient-to-br ${appTheme.bg_value}`;
  let themeStyle = {};
  let textPrimary = "text-white";
  let textSecondary = "text-white/80";
  let cardBg = "bg-white/10 border-white/20 shadow-inner";
  let avatarBg = "bg-white/20 border-white/30 backdrop-blur-md";
  if (isLightTheme) {
    textPrimary = "text-slate-800";
    textSecondary = "text-slate-500";
    cardBg = "bg-white border-slate-200 shadow-[0_5px_15px_rgba(0,0,0,0.05)]";
    avatarBg = "bg-slate-50 border-slate-200";
  } else if (actualThemeType === "image") {
    themeClass = "bg-slate-900";
    themeStyle = { backgroundImage: `url('${appTheme.bg_value}')`, backgroundSize: "cover", backgroundPosition: "center" };
  } else if (actualThemeType === "animated_space") {
    themeClass = "bg-animated-space";
  } else if (actualThemeType === "animated_clouds") {
    themeClass = "bg-animated-clouds";
  }
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(n || 0);
  const displayBalance = auth?.user?.saldo || auth?.user?.balance || 0;
  const uiAvatarUrl = `https://ui-avatars.com/api/?name=${auth?.user?.name || "User"}&background=random&color=fff&bold=true`;
  const handleComingSoon = (feature) => {
    Swal.fire({ icon: "info", title: "Segera Hadir!", text: `Fitur ${feature} sedang dikembangkan.`, confirmButtonColor: "#3b82f6" });
  };
  const handleUpdateH2H = (action = "save") => {
    const payload = action === "generate" || action === "generate_secret" ? { action } : { ...h2h, action: "save" };
    axios.post("/profile/update-h2h", payload).then((res) => {
      if (res.data.status) {
        if (action === "generate") {
          Swal.fire({ title: "Berhasil!", text: "Sistem akan merefresh untuk memuat API Key baru.", icon: "success", timer: 1500, showConfirmButton: false });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          Swal.fire({ toast: true, position: "top", icon: "success", title: res.data.message, showConfirmButton: false, timer: 2e3 });
        }
      }
    }).catch((err) => {
      Swal.fire({ icon: "error", title: "Akses Ditolak!", text: err.response?.data?.message || "Terjadi kesalahan sistem." });
    });
  };
  const handleCopy = (txt) => {
    if (!txt) return Swal.fire({ toast: true, position: "top", icon: "warning", title: "Key Kosong!", showConfirmButton: false, timer: 1500 });
    navigator.clipboard.writeText(txt);
    Swal.fire({ toast: true, position: "top", icon: "success", title: "Berhasil Disalin!", showConfirmButton: false, timer: 1500 });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Profil Sultan - MilaStore" }),
    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
                @keyframes moveSpace { 0% { background-position: 0 0; } 100% { background-position: 300px 300px; } }
                @keyframes moveClouds { 0% { background-position: 0 0; } 100% { background-position: 600px 0; } }
                .bg-animated-space { background-color: #0b0f19; background-image: radial-gradient(1.5px 1.5px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)); background-repeat: repeat; background-size: 250px 250px; animation: moveSpace 20s linear infinite; }
                .bg-animated-clouds { background-color: #0ea5e9; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250' viewBox='0 0 200 200'%3E%3Cpath fill='%23ffffff' fill-opacity='0.4' d='M59 39c-7.7 0-14.2 5.6-15.7 12.9-4.3-1.4-8.9 4-8.9 10.6 0 7.7 6.2 14 14 14h56c9.9 0 18-8.1 18-18 0-9.1-6.9-16.7-15.7-17.9C103.1 34.4 92.6 27 81 27c-10.7 0-20.1 6.7-23.7 16.2-.5-2.1-2.5-4.2-4.3-4.2zm76 48c-5.8 0-10.6 4.2-11.8 9.7-3.2-1-6.7 3-6.7 8 0 5.8 4.7 10.5 10.5 10.5h42c7.4 0 13.5-6.1 13.5-13.5 0-6.8-5.2-12.5-11.8-13.4C168.3 84.8 160.5 79 152 79c-8 0-15 5-17.7 12.1-.3-1.6-1.8-3.1-3.3-3.1z'/%3E%3C/svg%3E"); animation: moveClouds 35s linear infinite; }
            ` } }),
    /* @__PURE__ */ jsx(AuthenticatedLayout, { user: auth?.user, children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen pb-32", children: [
      /* @__PURE__ */ jsx("div", { className: `pt-12 pb-24 px-6 rounded-b-[3rem] relative overflow-hidden transition-all duration-700 ${themeClass}`, style: themeStyle, children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: `w-16 h-16 rounded-full flex items-center justify-center border-2 overflow-hidden ${avatarBg}`, children: [
              "                                        ",
              /* @__PURE__ */ jsx("img", { src: uiAvatarUrl, alt: "Avatar", className: "w-full h-full rounded-full object-cover" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: `text-xl font-black leading-tight drop-shadow-sm ${textPrimary}`, children: auth?.user?.name || "User" }),
              /* @__PURE__ */ jsxs("div", { className: `mt-1 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-lg ${currentLevel.color} ${currentLevel.shadow}`, children: [
                /* @__PURE__ */ jsx("i", { className: `fa-solid ${currentLevel.icon} text-[10px]` }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-white", children: currentLevel.label })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Link, { href: route("dashboard"), className: `w-10 h-10 rounded-full flex items-center justify-center ${isLightTheme ? "bg-slate-100 text-slate-500" : "bg-white/20 text-white"}`, children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-house" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `backdrop-blur-xl border rounded-[2rem] p-6 flex justify-between items-center relative overflow-hidden ${cardBg}`, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: `text-[10px] font-black uppercase tracking-widest mb-1 ${textSecondary}`, children: "Saldo Aktif" }),
            /* @__PURE__ */ jsxs("h3", { className: `text-2xl font-black tracking-tighter ${textPrimary}`, children: [
              /* @__PURE__ */ jsx("span", { className: `text-sm mr-1 ${textSecondary}`, children: "Rp" }),
              formatRp(displayBalance)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: `text-[10px] font-black uppercase tracking-widest mb-1 ${textSecondary}`, children: "Bergabung" }),
            /* @__PURE__ */ jsx("h3", { className: `text-xs font-black ${textPrimary}`, children: auth?.user?.created_at ? new Date(auth.user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto px-5 -mt-10 relative z-50 space-y-6", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white p-2 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-slate-50 overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "p-3", children: [
          /* @__PURE__ */ jsxs(Link, { href: "/riwayat", className: "w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border-b border-slate-50 last:border-0 text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-clock-rotate-left" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 text-sm", children: "Riwayat Transaksi" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-slate-400", children: "Pantau semua transaksi Anda" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-slate-300 text-xs" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: "/mutasi", className: "w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border-b border-slate-50 last:border-0 text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-money-bill-transfer" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 text-sm", children: "Mutasi Saldo" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-slate-400", children: "Cek pemasukan & pengeluaran" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-slate-300 text-xs" })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => handleComingSoon("Daftar Harga"), className: "w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border-b border-slate-50 last:border-0 text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-tags" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 text-sm", children: "Daftar Harga" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-slate-400", children: "Harga update produk PPOB" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-slate-300 text-xs" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: route("referral.index"), className: "w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border-b border-slate-50 last:border-0 text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-users" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 text-sm", children: "Downline & Referral" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-slate-400", children: "Ajak teman dapatkan komisi" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-slate-300 text-xs" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: "/notifikasi", className: "w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border-b border-slate-50 last:border-0 text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center text-lg relative group-hover:scale-110 transition-transform", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-bell" }),
                /* @__PURE__ */ jsx("span", { className: "absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-sky-50" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 text-sm", children: "Pusat Notifikasi" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-slate-400", children: "Pemberitahuan & Info Penting" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-slate-300 text-xs" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: "/bantuan", className: "w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border-b border-slate-50 last:border-0 text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-headset" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 text-sm", children: "Bantuan & CS" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-slate-400", children: "Hubungi kami jika ada kendala" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right text-slate-300 text-xs" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-black text-slate-800 text-xs mb-5 uppercase tracking-widest flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-code text-indigo-500" }),
            " API & Integrasi H2H"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs(Link, { href: route("developer.api"), className: "w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-100 p-4 rounded-2xl transition-all group text-left mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-book" }) }),
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 text-xs", children: "Baca Dokumentasi API" })
              ] }),
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-right text-slate-400 text-xs group-hover:translate-x-1 transition-transform" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase text-slate-400 ml-1", children: "Secret API Key" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-1", children: [
                /* @__PURE__ */ jsx("input", { readOnly: true, value: h2h.api_key, className: "flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none", placeholder: "Belum ada Key..." }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateH2H("generate"), className: "bg-indigo-600 text-white px-3 rounded-xl active:scale-90 transition-all shadow-md", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-rotate" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleCopy(h2h.api_key), className: "bg-slate-800 text-white px-3 rounded-xl active:scale-90 transition-all shadow-md", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-copy" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase text-slate-400 ml-1", children: "URL Webhook (Callback)" }),
              /* @__PURE__ */ jsx("input", { value: h2h.webhook_url, onChange: (e) => setH2h({ ...h2h, webhook_url: e.target.value }), className: "w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 mt-1 outline-none focus:border-indigo-500 transition-all", placeholder: "https://web-anda.com/callback" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-indigo-500/5 rounded-2xl border-2 border-dashed border-indigo-500/20", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase text-indigo-500 ml-1", children: "URL Webhook Payment (MilaPay)" }),
                /* @__PURE__ */ jsx("input", { value: h2h.payment_webhook, onChange: (e) => setH2h({ ...h2h, payment_webhook: e.target.value }), className: "w-full bg-white border-2 border-indigo-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 mt-1 outline-none focus:border-indigo-500", placeholder: "https://web-anda.com/callback-payment" }),
                /* @__PURE__ */ jsx("p", { className: "text-[9px] text-indigo-400 mt-1 italic font-bold", children: "* Khusus laporan QRIS, JAGO, SEABANK (MilaPay V12)" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-indigo-500/20 pt-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase text-indigo-500 ml-1", children: "Secret Key Webhook (Signature)" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-1", children: [
                    /* @__PURE__ */ jsx("input", { readOnly: true, value: h2h.payment_secret, className: "flex-1 bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none", placeholder: "Belum ada Secret Key..." }),
                    /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateH2H("generate_secret"), className: "bg-indigo-600 text-white px-3 rounded-xl active:scale-90 transition-all shadow-md", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-rotate" }) }),
                    /* @__PURE__ */ jsx("button", { onClick: () => handleCopy(h2h.payment_secret), className: "bg-slate-800 text-white px-3 rounded-xl active:scale-90 transition-all shadow-md", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-copy" }) })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[9px] text-indigo-400 mt-1 italic font-bold", children: "* Gunakan ini untuk validasi MD5 di script tujuan" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase text-slate-400 ml-1", children: "Whitelist IP Server" }),
              /* @__PURE__ */ jsx("input", { value: h2h.ip_whitelist, onChange: (e) => setH2h({ ...h2h, ip_whitelist: e.target.value }), className: "w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 mt-1 outline-none focus:border-indigo-500 transition-all", placeholder: "Contoh: 1.2.3.4, 5.6.7.8" })
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => handleUpdateH2H("save"), className: "w-full bg-slate-900 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg flex justify-center items-center gap-2", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-floppy-disk" }),
              " Simpan Konfigurasi"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-slate-50", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-black text-slate-800 text-xs mb-5 uppercase tracking-widest px-1 opacity-80 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-user-pen text-blue-500" }),
            " Informasi Pribadi"
          ] }),
          /* @__PURE__ */ jsx(UpdateProfileInformation, { mustVerifyEmail, status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-slate-50", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-black text-slate-800 text-xs mb-5 uppercase tracking-widest px-1 opacity-80 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-shield-halved text-rose-500" }),
            " Keamanan Sandi"
          ] }),
          /* @__PURE__ */ jsx(UpdatePasswordForm, {})
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-slate-50", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-black text-slate-800 text-xs mb-5 uppercase tracking-widest px-1 opacity-80 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-key text-emerald-500" }),
            " PIN Keamanan Transaksi"
          ] }),
          /* @__PURE__ */ jsx(UpdatePinForm, {})
        ] }),
        /* @__PURE__ */ jsxs(Link, { href: route("logout"), method: "post", as: "button", className: "w-full bg-rose-50 text-rose-600 rounded-[2rem] p-5 font-black uppercase tracking-widest text-xs border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-power-off text-base" }),
          " Keluar Aplikasi"
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Edit as default
};
