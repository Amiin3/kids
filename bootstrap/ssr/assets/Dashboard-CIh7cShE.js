import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { A as AuthenticatedLayout, N as NotificationBell } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import Swal from "sweetalert2";
import "moment";
function PushRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then(function(swReg) {
        console.log("Service Worker is registered", swReg);
      }).catch(function(error) {
        console.error("Service Worker Error", error);
      });
    }
  }, []);
  return null;
}
const defaultAdminMenus = [
  { name: "VPN Manager", icon: "fa-server", route: "admin.vpn.index" },
  { name: "Transaksi", icon: "fa-receipt", route: "admin.transaksi.index" },
  { name: "Deposit", icon: "fa-wallet", route: "admin.deposit.index" },
  { name: "Digiflazz", icon: "fa-bolt", route: "admin.digiflazz.index" },
  { name: "Keuangan", icon: "fa-money-bill-trend-up", route: "admin.keuangan" },
  { name: "Sistem XDA", icon: "fa-microchip", route: "admin.kaje.index" },
  { name: "War XDA", icon: "fa-rocket", route: "admin.kaje.war.index" },
  { name: "Command PO", icon: "fa-robot", route: "admin.po_v8" },
  { name: "Promo", icon: "fa-bullhorn", route: "admin.promo.index" },
  { name: "Sistem XLA", icon: "fa-users", route: "admin.khfy.index" },
  { name: "War XLA", icon: "fa-jet-fighter", route: "admin.khfy.war.po" },
  { name: "Adammedia", icon: "fa-satellite-dish", url: "/admin/adammedia" },
  { name: "Member", icon: "fa-users-gear", route: "admin.users" },
  { name: "Audit", icon: "fa-user-secret", url: "/admin/audit", isBlade: true },
  { name: "Broadcast", icon: "fa-tower-broadcast", route: "admin.broadcast" },
  { name: "Setting", icon: "fa-sliders", route: "profile.edit" },
  { name: "Diskon", icon: "fa-tags", url: "/admin/reseller-discounts" },
  { name: "Payment", icon: "fa-money-check-dollar", url: "/admin/payment-settings" },
  { name: "Kelola Menu", icon: "fa-layer-group", url: "/admin/menus" }
];
const defaultAppMenus = [
  { name: "VPN V12", icon: "fa-shield-halved", color: "text-white", bg: "bg-gradient-to-br from-blue-700 to-indigo-900 shadow-md border border-indigo-400/30", route: "order.vpn" },
  { name: "Cek Kuota", icon: "fa-magnifying-glass-chart", color: "text-white", bg: "bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md border border-emerald-400/30", url: "https://milastore.cloud/order/cek-kuota" },
  { name: "Pulsa", icon: "fa-mobile-retro", color: "text-white", bg: "bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md", route: "order.pulsa" },
  { name: "Data", icon: "fa-wifi", color: "text-white", bg: "bg-gradient-to-br from-indigo-400 to-purple-600 shadow-md", route: "order.data" },
  { name: "E-Wallet", icon: "fa-wallet", color: "text-white", bg: "bg-gradient-to-br from-sky-300 to-cyan-500 shadow-md", route: "order.ewallet" },
  { name: "PLN", icon: "fa-bolt", color: "text-white", bg: "bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md", route: "order.pln" },
  { name: "Pascabayar", icon: "fa-file-invoice-dollar", color: "text-white", bg: "bg-gradient-to-br from-teal-400 to-emerald-600 shadow-md", route: "order.pascabayar" },
  { name: "Games", icon: "fa-gamepad", color: "text-white", bg: "bg-gradient-to-br from-emerald-400 to-green-600 shadow-md", route: "order.games" },
  { name: "Voucher", icon: "fa-ticket", color: "text-white", bg: "bg-gradient-to-br from-rose-400 to-red-600 shadow-md", route: "order.voucher" },
  { name: "Masa Aktif", icon: "fa-calendar-check", color: "text-white", bg: "bg-gradient-to-br from-orange-400 to-rose-500 shadow-md", route: "order.masa-aktif" },
  { name: "Akrab XLA", icon: "fa-users", color: "text-white", bg: "bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-md", route: "order.akrab" },
  { name: "Akrab V8", icon: "fa-share-nodes", color: "text-white", bg: "bg-gradient-to-br from-pink-400 to-rose-600 shadow-md border border-pink-300/50", url: "/order/akrabv8", isBlade: true },
  { name: "PO XLA", icon: "fa-fire", color: "text-white", bg: "bg-gradient-to-br from-red-500 to-orange-600 shadow-md", route: "war.xla.index" },
  { name: "Akrab XDA", icon: "fa-microchip", color: "text-white", bg: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-md", route: "order.xda" },
  { name: "PO XDA", icon: "fa-rocket", color: "text-white", bg: "bg-gradient-to-br from-indigo-500 to-blue-700 shadow-md", route: "order.po-xda.view" },
  { name: "Tool XL", icon: "fa-wrench", color: "text-white", bg: "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md", route: "tools.xl" },
  { name: "API Docs", icon: "fa-laptop-code", color: "text-white", bg: "bg-gradient-to-br from-slate-700 to-slate-900 shadow-md border border-slate-500/50", url: "/developer/payment-gateway-docs" }
];
function Dashboard({ auth, recentTransactions = [], userBalance = 0 }) {
  const [maintConfig, setMaintConfig] = useState({ manual: false, start: "", end: "" });
  const [promos, setPromos] = useState([]);
  const [appTheme, setAppTheme] = useState({ bg_type: "color_dark", bg_value: "from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6]" });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [adminMenus, setAdminMenus] = useState(defaultAdminMenus);
  const [appMenus, setAppMenus] = useState(defaultAppMenus);
  const displayBalance = userBalance || auth.user.balance || 0;
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(n);
  const isAdmin = auth.user?.role === "admin" || auth.user?.level === "admin" || auth.user?.email === "admin@MilaStore.web.id";
  const safeRoute = (routeName) => {
    if (!routeName) return "#";
    try {
      return route(routeName);
    } catch (e) {
      return "#";
    }
  };
  useEffect(() => {
    if (isAdmin) axios.get("/admin/maintenance/status").then((res) => setMaintConfig(res.data)).catch((err) => console.log("Status Maintenance:", err));
    axios.get("/api/active-promos").then((res) => setPromos(res.data));
    axios.get("/api/theme/status").then((res) => setAppTheme(res.data));
    axios.get("/api/menus/list").then((res) => {
      if (res.data.status === "custom") {
        setAdminMenus(res.data.data.admin);
        setAppMenus(res.data.data.app);
      }
    });
  }, [isAdmin]);
  const renderAppIcon = (iconString) => {
    if (!iconString) return /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle relative z-10" });
    if (iconString.includes("/") || iconString.includes("http")) {
      return /* @__PURE__ */ jsx("img", { src: iconString, alt: "icon", className: "w-full h-full object-cover relative z-10 drop-shadow-md" });
    }
    return /* @__PURE__ */ jsx("i", { className: `fa-solid ${iconString} relative z-10` });
  };
  const renderAdminIcon = (iconString) => {
    if (!iconString) return /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle text-sm" });
    if (iconString.includes("/") || iconString.includes("http")) {
      return /* @__PURE__ */ jsx("img", { src: iconString, alt: "icon", className: "w-full h-full object-cover drop-shadow-sm" });
    }
    return /* @__PURE__ */ jsx("i", { className: `fa-solid ${iconString} text-sm` });
  };
  const openThemeSettings = async () => {
    const isSpace2 = appTheme.bg_value === "animated_space";
    const isClouds2 = appTheme.bg_value === "animated_clouds";
    const isDark = (appTheme.bg_type === "color_dark" || appTheme.bg_type === "color") && !isSpace2 && !isClouds2;
    const { value: formValues } = await Swal.fire({
      title: "🎨 Tema Dashboard",
      html: `
                <div class="text-left text-xs font-black text-slate-500 tracking-widest uppercase mb-2">Pilihan Mode Latar</div>
                <select id="theme-type" class="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl mb-4 font-bold text-slate-700 py-3" onchange="
                    const val = this.value;
                    document.getElementById('input-color').style.display = (val === 'color_dark' || val === 'color_light') ? 'block' : 'none';
                    document.getElementById('input-file').style.display = val === 'image_upload' ? 'block' : 'none';
                ">
                    <option value="color_dark" ${isDark ? "selected" : ""}>🌃 Gradient Gelap (Teks Putih)</option>
                    <option value="color_light" ${appTheme.bg_type === "color_light" ? "selected" : ""}>🏙️ Gradient Terang/Putih (Teks Gelap)</option>
                    <option value="animated_space" ${isSpace2 ? "selected" : ""}>🚀 Antariksa (Bintang Bergerak)</option>
                    <option value="animated_clouds" ${isClouds2 ? "selected" : ""}>☁️ Langit Berawan (Awan Bergerak)</option>
                    <option value="image_upload" ${appTheme.bg_type === "image" ? "selected" : ""}>📁 Upload dari Galeri</option>
                </select>
                <div id="input-color" style="display: ${isDark || appTheme.bg_type === "color_light" ? "block" : "none"};">
                    <div class="text-left text-xs font-black text-slate-500 tracking-widest uppercase mb-2">Kode Warna Gradient</div>
                    <textarea id="theme-value" class="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-600" rows="2" placeholder="from-white to-slate-100">${isDark || appTheme.bg_type === "color_light" ? appTheme.bg_value : "from-blue-600 to-indigo-700"}</textarea>
                </div>
                <div id="input-file" style="display: ${appTheme.bg_type === "image" ? "block" : "none"};">
                    <div class="text-left text-xs font-black text-slate-500 tracking-widest uppercase mb-2">Pilih File (JPG/PNG/GIF/WEBP)</div>
                    <input type="file" id="theme-file" accept="image/*" class="w-full border-2 border-slate-200 rounded-xl p-2 text-sm font-bold text-slate-600 bg-slate-50">
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Terapkan Tema",
      preConfirm: () => {
        const type = document.getElementById("theme-type").value;
        const val = document.getElementById("theme-value").value;
        const file = document.getElementById("theme-file").files[0];
        if (type === "image_upload" && !file) {
          Swal.showValidationMessage("Pilih file gambar dulu!");
          return false;
        }
        let final_type = type;
        let final_value = val;
        if (type === "animated_space" || type === "animated_clouds") {
          final_type = "color_dark";
          final_value = type;
        }
        return { bg_type: final_type, bg_value: final_value, bg_file: file };
      }
    });
    if (formValues) {
      Swal.fire({ title: "Menyimpan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const formData = new FormData();
        formData.append("bg_type", formValues.bg_type);
        if (formValues.bg_type === "image_upload") formData.append("bg_file", formValues.bg_file);
        else formData.append("bg_value", formValues.bg_value);
        const res = await axios.post("/admin/theme/save", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setAppTheme(res.data.theme);
        Swal.fire({ icon: "success", title: "Selesai!", showConfirmButton: false, timer: 1500 });
      } catch (e) {
        Swal.fire("Error", "Gagal memproses tema.", "error");
      }
    }
  };
  const isMaintActive = maintConfig.manual === true || maintConfig.manual === "true" || maintConfig.start && maintConfig.end;
  const isSpace = appTheme.bg_value === "animated_space";
  const isClouds = appTheme.bg_value === "animated_clouds";
  const actualThemeType = isSpace || isClouds ? appTheme.bg_value : appTheme.bg_type;
  const isLightTheme = actualThemeType === "color_light";
  let themeClass = "";
  let themeStyle = {};
  let textPrimary = "text-white";
  let cardBg = "bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg";
  let avatarBg = "bg-gradient-to-br from-white/30 to-white/5 border border-white/30 backdrop-blur-md shadow-md";
  let headerBorder = "shadow-xl";
  if (isLightTheme) {
    themeClass = `bg-gradient-to-br ${appTheme.bg_value}`;
    textPrimary = "text-slate-800";
    cardBg = "bg-white/90 backdrop-blur-md border border-slate-100 shadow-sm";
    avatarBg = "bg-white border-2 border-slate-100 shadow-sm";
    headerBorder = "border-b border-slate-200/50 shadow-sm";
  } else if (actualThemeType === "animated_space") {
    themeClass = "bg-animated-space";
  } else if (actualThemeType === "animated_clouds") {
    themeClass = "bg-animated-clouds";
  } else if (actualThemeType === "color_dark" || actualThemeType === "color") {
    themeClass = `bg-gradient-to-br ${appTheme.bg_value}`;
  } else if (actualThemeType === "image") {
    themeClass = "bg-slate-900";
    themeStyle = { backgroundImage: `url('${appTheme.bg_value}')`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" };
  }
  const uiAvatarUrl = `https://ui-avatars.com/api/?name=${auth.user.name}&background=random&color=fff&bold=true`;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Beranda - MilaStore" }),
    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
                @keyframes moveSpaceBg { 0% { background-position: 0 0; } 100% { background-position: 300px 300px; } }
                @keyframes moveClouds { 0% { background-position: 0 0; } 100% { background-position: 600px 0; } }
                @keyframes floatObj { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
                .bg-animated-space { background-color: #0b0f19; background-image: radial-gradient(1.5px 1.5px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)); background-repeat: repeat; background-size: 250px 250px; animation: moveSpaceBg 20s linear infinite; will-change: background-position; }
                .bg-animated-clouds { background-color: #0ea5e9; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250' viewBox='0 0 200 200'%3E%3Cpath fill='%23ffffff' fill-opacity='0.4' d='M59 39c-7.7 0-14.2 5.6-15.7 12.9-4.3-1.4-8.9 4-8.9 10.6 0 7.7 6.2 14 14 14h56c9.9 0 18-8.1 18-18 0-9.1-6.9-16.7-15.7-17.9C103.1 34.4 92.6 27 81 27c-10.7 0-20.1 6.7-23.7 16.2-.5-2.1-2.5-4.2-4.3-4.2zm76 48c-5.8 0-10.6 4.2-11.8 9.7-3.2-1-6.7 3-6.7 8 0 5.8 4.7 10.5 10.5 10.5h42c7.4 0 13.5-6.1 13.5-13.5 0-6.8-5.2-12.5-11.8-13.4C168.3 84.8 160.5 79 152 79c-8 0-15 5-17.7 12.1-.3-1.6-1.8-3.1-3.3-3.1z'/%3E%3C/svg%3E"); animation: moveClouds 35s linear infinite; will-change: background-position; }
                .glass-button-shine { position: relative; overflow: hidden; }
                .glass-button-shine::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: shine 7s infinite; will-change: left; }
                @keyframes shine { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            ` } }),
    /* @__PURE__ */ jsx(PushRegister, {}),
    /* @__PURE__ */ jsx(AuthenticatedLayout, { user: auth.user, children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50 pb-28 font-['Outfit'] relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-indigo-500/5 to-transparent z-0 pointer-events-none transform-gpu" }),
      /* @__PURE__ */ jsx("div", { className: "absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none transform-gpu" }),
      /* @__PURE__ */ jsxs("div", { className: `pt-8 pb-16 px-4 rounded-b-[40px] relative overflow-hidden transition-all duration-500 z-10 transform-gpu ${themeClass} ${headerBorder}`, style: themeStyle, children: [
        actualThemeType === "image" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto relative z-20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 cursor-pointer group", onClick: () => setIsUserMenuOpen(!isUserMenuOpen), children: [
              /* @__PURE__ */ jsxs("div", { className: `w-11 h-11 rounded-full flex items-center justify-center p-0.5 relative group-hover:scale-105 transition-transform transform-gpu ${avatarBg}`, children: [
                /* @__PURE__ */ jsx("img", { src: auth.user.avatar && auth.user.avatar !== "test_avatar.jpg" ? `/storage/${auth.user.avatar}` : uiAvatarUrl, onError: (e) => {
                  e.target.onerror = null;
                  e.target.src = uiAvatarUrl;
                }, alt: "Avatar", className: "w-full h-full rounded-full object-cover border border-white/50" }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h2", { className: `text-sm font-black leading-tight tracking-tight drop-shadow-md flex items-center gap-1 ${textPrimary}`, children: [
                  auth.user.name,
                  /* @__PURE__ */ jsx("i", { className: `fa-solid fa-chevron-down text-[8px] transition-transform duration-300 transform-gpu ${isUserMenuOpen ? "rotate-180" : ""}` })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: `text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 w-max ${textPrimary}`, children: [
                  /* @__PURE__ */ jsx("i", { className: "fa-solid fa-gem text-amber-400" }),
                  " Sultan V12"
                ] })
              ] })
            ] }),
            isUserMenuOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-14 left-0 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 py-1.5 origin-top-left animate-in fade-in zoom-in duration-200 z-[60] transform-gpu", children: /* @__PURE__ */ jsxs("div", { className: "p-1.5", children: [
              /* @__PURE__ */ jsxs(Link, { href: route("profile.edit"), className: "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors", children: [
                /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-user-pen text-[10px]" }) }),
                "Pengaturan"
              ] }),
              /* @__PURE__ */ jsxs(Link, { href: route("logout"), method: "post", as: "button", className: "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left mt-0.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-power-off text-[10px]" }) }),
                "Keluar"
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: `flex items-center gap-2 ${textPrimary}`, children: /* @__PURE__ */ jsx("div", { className: "bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-full shadow-sm", children: /* @__PURE__ */ jsx(NotificationBell, {}) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: `rounded-[24px] p-5 flex justify-between items-center relative overflow-hidden transition-all duration-300 transform-gpu ${cardBg}`, style: { animation: "floatObj 6s ease-in-out infinite", willChange: "transform" }, children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl" }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsx("p", { className: `text-[9px] font-black uppercase tracking-widest mb-0.5 opacity-80 ${textPrimary}`, children: "Total Kekayaan" }),
              /* @__PURE__ */ jsxs("h3", { className: `text-3xl font-black tracking-tighter drop-shadow-md flex items-start gap-1 ${textPrimary}`, children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs mt-1.5 opacity-80", children: "Rp" }),
                formatRp(displayBalance)
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "relative z-10 w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-inner", children: /* @__PURE__ */ jsx("i", { className: `fa-solid fa-wallet text-xl ${textPrimary}` }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto px-4 -mt-8 relative z-50", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white/90 backdrop-blur-lg rounded-[24px] p-4 shadow-lg border border-white flex justify-around items-center mb-6", children: [
          /* @__PURE__ */ jsxs(Link, { href: route("deposit.index"), className: "flex flex-col items-center group transition-transform hover:-translate-y-1 transform-gpu will-change-transform", children: [
            /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex justify-center items-center text-lg mb-1.5 shadow-md border-t border-white/40", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-plus" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-700 tracking-tight", children: "Isi Saldo" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: "/statistik", className: "flex flex-col items-center group transition-transform hover:-translate-y-1 transform-gpu will-change-transform", children: [
            /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex justify-center items-center text-lg mb-1.5 shadow-md border-t border-white/40", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chart-pie" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-700 tracking-tight", children: "Statistik" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: "/riwayat", className: "flex flex-col items-center group transition-transform hover:-translate-y-1 transform-gpu will-change-transform", children: [
            /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex justify-center items-center text-lg mb-1.5 shadow-md border-t border-white/40", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-clock-rotate-left" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-700 tracking-tight", children: "Riwayat" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: "/bantuan", className: "flex flex-col items-center group transition-transform hover:-translate-y-1 transform-gpu will-change-transform", children: [
            /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-white flex justify-center items-center text-lg mb-1.5 shadow-md border-t border-white/40", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-headset" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-slate-700 tracking-tight", children: "Bantuan" })
          ] })
        ] }),
        isAdmin && /* @__PURE__ */ jsxs("div", { className: "mb-6 bg-slate-900 rounded-[24px] p-5 shadow-xl border border-slate-800 relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl transform-gpu" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-5 relative z-10", children: [
            /* @__PURE__ */ jsxs("h4", { className: "font-black text-white text-xs italic uppercase tracking-wider flex items-center", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-shield-halved text-rose-500 mr-1.5" }),
              " Admin Area"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
              /* @__PURE__ */ jsxs("button", { onClick: openThemeSettings, className: "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors border border-blue-500/30", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-image" }),
                " Tema"
              ] }),
              /* @__PURE__ */ jsxs(Link, { href: route("admin.maintenance.index"), className: `px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${isMaintActive ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse" : "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"}`, children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-lock" }),
                " Kunci"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-y-4 gap-x-1.5 relative z-10", children: adminMenus.map((menu, i) => {
            const content = /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-slate-800 rounded-[12px] flex items-center justify-center text-slate-300 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-blue-600 group-hover:text-white group-hover:shadow-md border border-slate-700/50 transition-all duration-300 mb-1.5 group-hover:-translate-y-1 transform-gpu will-change-transform overflow-hidden", children: renderAdminIcon(menu.icon) }),
              /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-400 text-center leading-tight tracking-tighter group-hover:text-white", children: menu.name })
            ] });
            return menu.isBlade ? /* @__PURE__ */ jsx("a", { href: menu.url, className: "flex flex-col items-center group", children: content }, i) : /* @__PURE__ */ jsx(Link, { href: menu.url ? menu.url : safeRoute(menu.route), className: "flex flex-col items-center group", children: content }, i);
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-black text-slate-800 text-xs mb-3 px-1.5 tracking-tight flex items-center justify-between", children: [
            "Kategori Layanan",
            /* @__PURE__ */ jsx(Link, { href: "#", className: "text-[9px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-widest font-black", children: "Lihat Semua" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white/80 backdrop-blur-lg p-5 rounded-[24px] shadow-sm border border-white", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-y-6 gap-x-2", children: appMenus.map((menu, i) => {
            const content = /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300 mb-1.5 relative transform-gpu will-change-transform", children: /* @__PURE__ */ jsxs("div", { className: `${menu.bg} text-white w-full h-full rounded-[16px] flex items-center justify-center text-xl border-t border-white/30 border-l border-white/10 glass-button-shine overflow-hidden`, children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[16px]" }),
                renderAppIcon(menu.icon)
              ] }) }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-700 text-center leading-tight tracking-tight drop-shadow-sm", children: menu.name })
            ] });
            return menu.isBlade ? /* @__PURE__ */ jsx("a", { href: menu.url, className: "flex flex-col items-center group", children: content }, i) : /* @__PURE__ */ jsx(Link, { href: menu.url ? menu.url : safeRoute(menu.route), className: "flex flex-col items-center group", children: content }, i);
          }) }) })
        ] }),
        promos && promos.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-black text-slate-800 text-xs mb-3 px-1.5 tracking-tight flex items-center gap-1.5", children: [
            "Promo Spesial ",
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-fire text-orange-500 animate-bounce" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-3 overflow-x-auto pb-4 pt-1 px-1 snap-x scrollbar-hide", children: promos.map((promo) => {
            return /* @__PURE__ */ jsxs("div", { className: "min-w-[250px] bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 rounded-[24px] p-5 text-white shadow-md snap-center relative border-t border-white/20 overflow-hidden transition-transform hover:-translate-y-1 transform-gpu will-change-transform", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent" }),
              /* @__PURE__ */ jsx("i", { className: `fa-solid ${promo.icon || "fa-star"} text-5xl absolute -right-3 -bottom-3 opacity-10 -rotate-12` }),
              /* @__PURE__ */ jsx("h5", { className: "font-black text-base mb-1.5 tracking-tight drop-shadow-md line-clamp-2 relative z-10", children: promo.title }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] opacity-90 mb-4 leading-relaxed font-medium line-clamp-2 relative z-10", children: promo.description }),
              /* @__PURE__ */ jsx("button", { className: "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors relative z-10", children: "Detail Promo" })
            ] }, promo.id);
          }) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Dashboard as default
};
