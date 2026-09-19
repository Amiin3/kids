import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef, useCallback } from "react";
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
  { name: "VPN V12", icon: "fa-shield-halved", color: "text-white", bg: "bg-blue-600", route: "order.vpn" },
  { name: "Cek Kuota", icon: "fa-magnifying-glass-chart", color: "text-white", bg: "bg-emerald-600", url: "https://milastore.cloud/order/cek-kuota" },
  { name: "Pulsa", icon: "fa-mobile-retro", color: "text-white", bg: "bg-sky-500", route: "order.pulsa" },
  { name: "Data", icon: "fa-wifi", color: "text-white", bg: "bg-indigo-600", route: "order.data" },
  { name: "E-Wallet", icon: "fa-wallet", color: "text-white", bg: "bg-cyan-500", route: "order.ewallet" },
  { name: "PLN", icon: "fa-bolt", color: "text-white", bg: "bg-amber-500", route: "order.pln" },
  { name: "Pascabayar", icon: "fa-file-invoice-dollar", color: "text-white", bg: "bg-teal-600", route: "order.pascabayar" },
  { name: "Games", icon: "fa-gamepad", color: "text-white", bg: "bg-green-600", route: "order.games" },
  { name: "Voucher", icon: "fa-ticket", color: "text-white", bg: "bg-rose-500", route: "order.voucher" },
  { name: "Masa Aktif", icon: "fa-calendar-check", color: "text-white", bg: "bg-orange-500", route: "order.masa-aktif" },
  { name: "Akrab XLA", icon: "fa-users", color: "text-white", bg: "bg-purple-600", route: "order.akrab" },
  { name: "Akrab V8", icon: "fa-share-nodes", color: "text-white", bg: "bg-pink-600", url: "/order/akrabv8", isBlade: true },
  { name: "PO XLA", icon: "fa-fire", color: "text-white", bg: "bg-red-500", route: "war.xla.index" },
  { name: "Akrab XDA", icon: "fa-microchip", color: "text-white", bg: "bg-amber-600", route: "order.xda" },
  { name: "PO XDA", icon: "fa-rocket", color: "text-white", bg: "bg-violet-600", route: "order.po-xda.view" },
  { name: "Tool XL", icon: "fa-wrench", color: "text-white", bg: "bg-blue-500", route: "tools.xl" },
  { name: "API Docs", icon: "fa-laptop-code", color: "text-white", bg: "bg-slate-700", url: "/developer/payment-gateway-docs" }
];
const defaultFeaturedBanners = [
  {
    id: "feat-1",
    tag: "⚡ EVENT SPESIAL",
    title: "TRIBUTE JUARA TRANSAKSI",
    subtitle: "Perbanyak transaksi & menangkan bonus saldo jutaan rupiah!",
    bg: "from-rose-500 via-pink-600 to-amber-500",
    badgeColor: "bg-yellow-400 text-slate-900",
    icon: "fa-trophy",
    actionLabel: "Ikuti Event",
    actionUrl: "/riwayat"
  },
  {
    id: "feat-2",
    tag: "🚀 ENGINE SPEED V12",
    title: "WAR AKRAB XL & XDA OTOMATIS",
    subtitle: "Eksekusi antrean PO hitungan milidetik 24 jam nonstop",
    bg: "from-blue-600 via-indigo-600 to-cyan-500",
    badgeColor: "bg-cyan-300 text-slate-900",
    icon: "fa-bolt",
    actionLabel: "Buka War Engine",
    actionUrl: "/order/akrab"
  },
  {
    id: "feat-3",
    tag: "💳 AUTO DEPOSIT",
    title: "QRIS STANDAR NASIONAL (GPN)",
    subtitle: "Isi saldo instan tanpa biaya admin, scan semua e-wallet & bank",
    bg: "from-emerald-600 via-teal-600 to-sky-600",
    badgeColor: "bg-emerald-300 text-slate-900",
    icon: "fa-qrcode",
    actionLabel: "Isi Saldo",
    actionUrl: "/deposit"
  }
];
function Dashboard({ auth, recentTransactions = [], userBalance = 0 }) {
  const [maintConfig, setMaintConfig] = useState({ manual: false, start: "", end: "" });
  const [promos, setPromos] = useState([]);
  const [appTheme, setAppTheme] = useState({ bg_type: "color_dark", bg_value: "from-blue-600 to-indigo-700" });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [adminMenus, setAdminMenus] = useState(defaultAdminMenus);
  const [appMenus, setAppMenus] = useState(defaultAppMenus);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const displayBalance = userBalance || auth.user?.saldo || auth.user?.balance || 0;
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(n || 0);
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
    if (isAdmin) {
      axios.get("/admin/maintenance/status").then((res) => setMaintConfig(res.data)).catch(() => {
      });
    }
    axios.get("/api/active-promos").then((res) => setPromos(res.data || [])).catch(() => {
    });
    axios.get("/api/theme/status").then((res) => setAppTheme(res.data || { bg_type: "color_dark", bg_value: "from-blue-600 to-indigo-700" })).catch(() => {
    });
    axios.get("/api/menus/list").then((res) => {
      if (res.data?.status === "custom" && res.data?.data) {
        if (res.data.data.admin) setAdminMenus(res.data.data.admin);
        if (res.data.data.app) setAppMenus(res.data.data.app);
      }
    }).catch(() => {
    });
  }, [isAdmin]);
  const activeBanners = promos && promos.length > 0 ? promos : defaultFeaturedBanners;
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);
  useEffect(() => {
    if (isPaused || activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4e3);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, activeBanners.length]);
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevSlide();
    }
  };
  const showBannerDetail = (banner) => {
    Swal.fire({
      title: banner.title || "Informasi Promo",
      text: banner.description || banner.subtitle || "Dapatkan penawaran terbaik hanya di MilaStore!",
      icon: "info",
      confirmButtonColor: "#2563eb",
      confirmButtonText: "Tutup"
    });
  };
  const renderAppIcon = (iconString) => {
    if (!iconString) return /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle text-lg" });
    if (iconString.includes("/") || iconString.includes("http")) {
      return /* @__PURE__ */ jsx("img", { src: iconString, alt: "icon", className: "w-full h-full object-cover rounded-xl" });
    }
    return /* @__PURE__ */ jsx("i", { className: `fa-solid ${iconString} text-lg` });
  };
  const renderAdminIcon = (iconString) => {
    if (!iconString) return /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle text-sm" });
    if (iconString.includes("/") || iconString.includes("http")) {
      return /* @__PURE__ */ jsx("img", { src: iconString, alt: "icon", className: "w-full h-full object-cover rounded-lg" });
    }
    return /* @__PURE__ */ jsx("i", { className: `fa-solid ${iconString} text-sm` });
  };
  const openThemeSettings = async () => {
    const isSpace2 = appTheme.bg_value === "animated_space";
    const isClouds2 = appTheme.bg_value === "animated_clouds";
    const isDark = (appTheme.bg_type === "color_dark" || appTheme.bg_type === "color") && !isSpace2 && !isClouds2;
    const { value: formValues } = await Swal.fire({
      title: "🎨 Konfigurasi Tema",
      html: `
                <div class="text-left text-xs font-bold text-slate-500 uppercase mb-1">Mode Latar Header</div>
                <select id="theme-type" class="w-full border border-slate-200 rounded-xl mb-3 font-semibold text-slate-700 py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500" onchange="
                    const val = this.value;
                    document.getElementById('input-color').style.display = (val === 'color_dark' || val === 'color_light') ? 'block' : 'none';
                    document.getElementById('input-file').style.display = val === 'image_upload' ? 'block' : 'none';
                ">
                    <option value="color_dark" ${isDark ? "selected" : ""}>🌃 Gradient FinTech Modern</option>
                    <option value="color_light" ${appTheme.bg_type === "color_light" ? "selected" : ""}>🏙️ Minimalist Light Clean</option>
                    <option value="animated_space" ${isSpace2 ? "selected" : ""}>🚀 Antariksa Minimalis</option>
                    <option value="animated_clouds" ${isClouds2 ? "selected" : ""}>☁️ Sky Blue Horizon</option>
                    <option value="image_upload" ${appTheme.bg_type === "image" ? "selected" : ""}>📁 Upload Gambar Custom</option>
                </select>
                <div id="input-color" style="display: ${isDark || appTheme.bg_type === "color_light" ? "block" : "none"};">
                    <div class="text-left text-xs font-bold text-slate-500 uppercase mb-1">Tailwind Gradient Class</div>
                    <input id="theme-value" class="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-700 mb-2" value="${isDark || appTheme.bg_type === "color_light" ? appTheme.bg_value : "from-blue-600 to-indigo-700"}" />
                </div>
                <div id="input-file" style="display: ${appTheme.bg_type === "image" ? "block" : "none"};">
                    <div class="text-left text-xs font-bold text-slate-500 uppercase mb-1">Pilih File Banner</div>
                    <input type="file" id="theme-file" accept="image/*" class="w-full border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-600 bg-slate-50">
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Terapkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const type = document.getElementById("theme-type").value;
        const val = document.getElementById("theme-value").value;
        const file = document.getElementById("theme-file").files[0];
        if (type === "image_upload" && !file) {
          Swal.showValidationMessage("Silakan pilih file gambar terlebih dahulu!");
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
      Swal.fire({ title: "Menyimpan Tema...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const formData = new FormData();
        formData.append("bg_type", formValues.bg_type);
        if (formValues.bg_type === "image_upload") formData.append("bg_file", formValues.bg_file);
        else formData.append("bg_value", formValues.bg_value);
        const res = await axios.post("/admin/theme/save", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setAppTheme(res.data.theme);
        Swal.fire({ icon: "success", title: "Tema Diperbarui!", showConfirmButton: false, timer: 1200 });
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
  let themeClass = "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white";
  let themeStyle = {};
  if (isLightTheme) {
    themeClass = `bg-gradient-to-br ${appTheme.bg_value || "from-slate-100 to-slate-200"} text-slate-900`;
  } else if (actualThemeType === "animated_space") {
    themeClass = "bg-[#0b0f19] text-white";
  } else if (actualThemeType === "animated_clouds") {
    themeClass = "bg-[#0284c7] text-white";
  } else if (actualThemeType === "color_dark" || actualThemeType === "color") {
    themeClass = `bg-gradient-to-br ${appTheme.bg_value || "from-blue-600 to-indigo-700"} text-white`;
  } else if (actualThemeType === "image") {
    themeClass = "bg-slate-900 text-white";
    themeStyle = { backgroundImage: `url('${appTheme.bg_value}')`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user?.name || "User")}&background=0284c7&color=fff&bold=true`;
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Beranda" }),
    /* @__PURE__ */ jsx(PushRegister, {}),
    /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => setIsUserMenuOpen(!isUserMenuOpen),
              className: "flex items-center gap-3 cursor-pointer select-none group",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs", children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: auth.user?.avatar && auth.user?.avatar !== "test_avatar.jpg" ? `/storage/${auth.user.avatar}` : uiAvatarUrl,
                      onError: (e) => {
                        e.target.onerror = null;
                        e.target.src = uiAvatarUrl;
                      },
                      alt: "Avatar",
                      className: "w-full h-full object-cover"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx("h2", { className: "text-xs sm:text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors", children: auth.user?.name || "Pengguna" }),
                    /* @__PURE__ */ jsx("i", { className: `fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}` })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded mt-0.5", children: [
                    /* @__PURE__ */ jsx("i", { className: "fa-solid fa-shield-check text-[9px]" }),
                    " ",
                    auth.user?.level || "Member VIP"
                  ] })
                ] })
              ]
            }
          ),
          isUserMenuOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-12 left-0 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in duration-150", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("profile.edit"),
                className: "flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors",
                children: [
                  /* @__PURE__ */ jsx("i", { className: "fa-solid fa-user-gear text-slate-400 w-4 text-center" }),
                  "Pengaturan Akun"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("logout"),
                method: "post",
                as: "button",
                className: "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left",
                children: [
                  /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-right-from-bracket text-rose-500 w-4 text-center" }),
                  "Keluar Akun"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl border border-slate-200/90 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors", children: /* @__PURE__ */ jsx(NotificationBell, {}) }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/60 transition-all ${themeClass}`, style: themeStyle, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1 opacity-90", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider", children: "Saldo Akun" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowBalance(!showBalance),
                className: "opacity-75 hover:opacity-100 transition-opacity",
                children: /* @__PURE__ */ jsx("i", { className: `fa-regular ${showBalance ? "fa-eye-slash" : "fa-eye"} text-xs` })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-2xl sm:text-3xl font-extrabold tracking-tight flex items-baseline gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold opacity-80", children: "Rp" }),
            /* @__PURE__ */ jsx("span", { children: showBalance ? formatRp(displayBalance) : "•••••••" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2 sm:gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("deposit.index"),
              className: "flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-center group",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-white text-blue-600 flex items-center justify-center text-xs shadow-xs mb-1 group-hover:-translate-y-0.5 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-plus font-bold" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold leading-tight", children: "Top Up" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: "/statistik",
              className: "flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-center group",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-white text-emerald-600 flex items-center justify-center text-xs shadow-xs mb-1 group-hover:-translate-y-0.5 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chart-simple" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold leading-tight", children: "Statistik" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: "/riwayat",
              className: "flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-center group",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-white text-amber-600 flex items-center justify-center text-xs shadow-xs mb-1 group-hover:-translate-y-0.5 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-receipt" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold leading-tight", children: "Riwayat" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: "/bantuan",
              className: "flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-center group",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-white text-rose-600 flex items-center justify-center text-xs shadow-xs mb-1 group-hover:-translate-y-0.5 transition-transform", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-headset" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold leading-tight", children: "Bantuan" })
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "relative overflow-hidden rounded-3xl shadow-sm border border-slate-200/90 group select-none",
          onMouseEnter: () => setIsPaused(true),
          onMouseLeave: () => setIsPaused(false),
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex transition-transform duration-500 ease-out",
                style: { transform: `translateX(-${currentSlide * 100}%)` },
                children: activeBanners.map((banner, idx) => {
                  const hasImage = banner.image || banner.image_url || banner.banner_url;
                  const bgGradient = banner.bg || "from-indigo-600 via-blue-600 to-cyan-600";
                  return /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-full flex-shrink-0 relative min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex items-center",
                      children: hasImage ? /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: hasImage,
                          alt: banner.title || "Promo Banner",
                          className: "w-full h-full object-cover cursor-pointer",
                          onClick: () => showBannerDetail(banner)
                        }
                      ) : (
                        /* Stylized Banner Card */
                        /* @__PURE__ */ jsxs("div", { className: `w-full h-full bg-gradient-to-r ${bgGradient} text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden`, children: [
                          /* @__PURE__ */ jsx("div", { className: "absolute -right-6 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" }),
                          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" }),
                          /* @__PURE__ */ jsx("i", { className: `fa-solid ${banner.icon || "fa-award"} absolute -right-3 -bottom-3 text-7xl sm:text-8xl opacity-15 rotate-12 pointer-events-none` }),
                          /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-[70%] sm:max-w-[75%]", children: [
                            /* @__PURE__ */ jsx("span", { className: `inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs mb-2 ${banner.badgeColor || "bg-white text-slate-900"}`, children: banner.tag || "PROMO TERBARU" }),
                            /* @__PURE__ */ jsx("h3", { className: "text-sm sm:text-lg font-black tracking-tight leading-tight line-clamp-1", children: banner.title }),
                            /* @__PURE__ */ jsx("p", { className: "text-[11px] sm:text-xs text-white/90 font-medium line-clamp-2 mt-1 leading-relaxed", children: banner.subtitle || banner.description }),
                            banner.actionUrl && /* @__PURE__ */ jsxs(
                              Link,
                              {
                                href: banner.actionUrl,
                                className: "inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-[10px] sm:text-xs font-bold hover:bg-slate-100 transition-transform active:scale-95 shadow-sm",
                                children: [
                                  /* @__PURE__ */ jsx("span", { children: banner.actionLabel || "Lihat Penawaran" }),
                                  /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-right text-[9px]" })
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "relative z-10 hidden sm:flex items-center justify-center pr-4", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner", children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${banner.icon || "fa-fire"} text-white` }) }) })
                        ] })
                      )
                    },
                    banner.id || idx
                  );
                })
              }
            ),
            activeBanners.length > 1 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: prevSlide,
                  "aria-label": "Slide Sebelumnya",
                  className: "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm hidden sm:flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20",
                  children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-left" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: nextSlide,
                  "aria-label": "Slide Selanjutnya",
                  className: "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm hidden sm:flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20",
                  children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-chevron-right" })
                }
              )
            ] }),
            activeBanners.length > 1 && /* @__PURE__ */ jsx("div", { className: "absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full", children: activeBanners.map((_, dotIdx) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setCurrentSlide(dotIdx),
                "aria-label": `Buka slide ${dotIdx + 1}`,
                className: `transition-all duration-300 rounded-full ${currentSlide === dotIdx ? "w-5 h-1.5 bg-white shadow-xs" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`
              },
              dotIdx
            )) })
          ]
        }
      ),
      isAdmin && /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-shield-halved" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-white leading-tight", children: "Control Center Admin" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: "Remote tools & manajemen transaksi" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: openThemeSettings,
                className: "px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors border border-blue-500/30 flex items-center gap-1",
                children: [
                  /* @__PURE__ */ jsx("i", { className: "fa-solid fa-palette text-[10px]" }),
                  " Tema"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("admin.maintenance.index"),
                className: `px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors flex items-center gap-1 ${isMaintActive ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse" : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"}`,
                children: [
                  /* @__PURE__ */ jsx("i", { className: "fa-solid fa-lock text-[10px]" }),
                  " Kunci"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2", children: adminMenus.map((menu, i) => {
          const content = /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group h-full text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-700/60 text-slate-300 group-hover:text-white group-hover:bg-blue-600 flex items-center justify-center transition-colors mb-1.5", children: renderAdminIcon(menu.icon) }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-slate-300 group-hover:text-white leading-tight line-clamp-2", children: menu.name })
          ] });
          return menu.isBlade ? /* @__PURE__ */ jsx("a", { href: menu.url, className: "block", children: content }, i) : /* @__PURE__ */ jsx(Link, { href: menu.url ? menu.url : safeRoute(menu.route), className: "block", children: content }, i);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-1", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs sm:text-sm font-bold text-slate-900 tracking-tight", children: "Kategori Layanan" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400", children: "Pilih produk digital yang ingin ditransaksikan" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100", children: "24 Jam Nonstop" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3.5", children: appMenus.map((menu, i) => {
          const content = /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50/80 transition-all group active:scale-95 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: `w-12 h-12 ${menu.bg || "bg-blue-600"} text-white rounded-2xl flex items-center justify-center shadow-xs group-hover:-translate-y-1 transition-transform mb-1.5 p-1`, children: renderAppIcon(menu.icon) }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 leading-tight tracking-tight line-clamp-1", children: menu.name })
          ] });
          return menu.isBlade ? /* @__PURE__ */ jsx("a", { href: menu.url, className: "block", children: content }, i) : /* @__PURE__ */ jsx(Link, { href: menu.url ? menu.url : safeRoute(menu.route), className: "block", children: content }, i);
        }) })
      ] })
    ] }) })
  ] });
}
export {
  Dashboard as default
};
