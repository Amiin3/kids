import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import Swal from "sweetalert2";
import "moment";
function MenuManager({ auth, adminMenus, appMenus, resellerMenus = [], h2hMenus = [], webSettings }) {
  const [activeTab, setActiveTab] = useState("all");
  const [webName, setWebName] = useState(webSettings?.name || "MILASTORE");
  const [webLogo, setWebLogo] = useState(null);
  const colorOptions = [
    "bg-gradient-to-br from-blue-500 to-indigo-600",
    "bg-gradient-to-br from-emerald-400 to-teal-600",
    "bg-gradient-to-br from-cyan-400 to-blue-500",
    "bg-gradient-to-br from-indigo-400 to-purple-600",
    "bg-gradient-to-br from-yellow-400 to-amber-500",
    "bg-gradient-to-br from-rose-400 to-red-600",
    "bg-gradient-to-br from-orange-400 to-rose-500",
    "bg-slate-800"
  ];
  let colorPaletteHtml = '<div class="flex flex-wrap gap-2 mb-3 mt-1">';
  colorOptions.forEach((bg) => {
    colorPaletteHtml += `<div class="w-8 h-8 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform ${bg}" onclick="document.getElementById('m_bg').value='${bg}'"></div>`;
  });
  colorPaletteHtml += "</div>";
  const buildFormHtml = (menu = {}) => `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <div class="text-left text-[10px] font-black text-slate-500 uppercase mb-1">Target Penempatan</div>
                <select id="m_type" class="w-full border-2 p-2 mb-3 rounded-xl font-bold text-slate-800 text-sm">
                    <option value="app" ${menu.type === "app" ? "selected" : ""}>📱 Menu User</option>
                    <option value="admin" ${menu.type === "admin" ? "selected" : ""}>🛡️ Menu Admin</option>
                    <option value="reseller" ${menu.type === "reseller" ? "selected" : ""}>💼 Menu Reseller</option>
                    <option value="h2h" ${menu.type === "h2h" ? "selected" : ""}>🔗 Menu H2H</option>
                </select>
            </div>
            <div>
                <div class="text-left text-[10px] font-black text-slate-500 uppercase mb-1">Status Visibilitas</div>
                <select id="m_active" class="w-full border-2 p-2 mb-3 rounded-xl font-bold text-slate-800 text-sm">
                    <option value="1" ${menu.is_active !== 0 ? "selected" : ""}>✅ Aktif (Tampilkan)</option>
                    <option value="0" ${menu.is_active === 0 ? "selected" : ""}>❌ Sembunyikan (Hide)</option>
                </select>
            </div>
        </div>
        
        <div class="text-left text-xs font-black text-slate-500 uppercase mb-1">Nama Menu</div>
        <input id="m_name" class="w-full border-2 p-2.5 mb-3 rounded-xl font-bold text-slate-800" value="${menu.name || ""}" placeholder="Contoh: Pulsa Murah">
        
        <div class="text-left text-xs font-black text-slate-500 uppercase mb-1">Ikon FontAwesome (Opsional)</div>
        <input id="m_icon" class="w-full border-2 p-2.5 mb-3 rounded-xl font-mono text-xs text-slate-800" value="${menu.icon && !menu.icon.includes("/storage/") ? menu.icon : ""}" placeholder="fa-wifi">
        
        <div class="text-left text-xs font-black text-indigo-500 uppercase mb-1">🔥 ATAU Upload Logo Sendiri (Rekomendasi)</div>
        <input id="m_icon_file" type="file" accept="image/*" class="w-full border-2 p-2 rounded-xl text-xs bg-slate-50 text-slate-800 mb-3 cursor-pointer" />
        
        <div class="grid grid-cols-2 gap-4">
            <div>
                <div class="text-left text-[10px] font-black text-slate-500 uppercase mb-1">Route Laravel</div>
                <input id="m_route" class="w-full border-2 p-2.5 mb-3 rounded-xl font-mono text-xs text-slate-800" value="${menu.route || ""}" placeholder="order.pulsa">
            </div>
            <div>
                <div class="text-left text-[10px] font-black text-slate-500 uppercase mb-1">Atau URL Langsung</div>
                <input id="m_url" class="w-full border-2 p-2.5 mb-3 rounded-xl font-mono text-xs text-slate-800" value="${menu.url || ""}" placeholder="https://...">
            </div>
        </div>

        <div class="text-left text-xs font-black text-slate-500 uppercase mb-1">Background Gradient (Pilih Warna)</div>
        ${colorPaletteHtml}
        <input id="m_bg" class="w-full border-2 p-2.5 mb-3 rounded-xl font-mono text-xs text-slate-800" value="${menu.bg || "bg-gradient-to-br from-blue-500 to-indigo-600"}">
        
        <div class="text-left text-xs font-black text-slate-500 uppercase mb-1">Nomor Urut</div>
        <input id="m_order" type="number" class="w-full border-2 p-2.5 rounded-xl font-bold text-slate-800" value="${menu.order_num || 0}">
    `;
  const handleFormSubmit = async (result, isEdit = false) => {
    if (result.isConfirmed && result.value) {
      Swal.fire({ title: "Menyimpan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const formData = new FormData();
        Object.keys(result.value).forEach((key) => {
          if (result.value[key] !== null) formData.append(key, result.value[key]);
        });
        await axios.post("/admin/menus/store", formData, { headers: { "Content-Type": "multipart/form-data" } });
        Swal.fire({ icon: "success", title: "Tersimpan!", showConfirmButton: false, timer: 1e3 });
        router.reload();
      } catch (e) {
        Swal.fire("Error", "Gagal menyimpan data", "error");
      }
    }
  };
  const handleEditMenu = async (menu) => {
    const result = await Swal.fire({
      title: `✏️ Kelola Menu: ${menu.name}`,
      width: "600px",
      html: buildFormHtml(menu),
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "💾 Simpan",
      denyButtonText: "🗑️ Hapus",
      cancelButtonText: "Batal",
      preConfirm: () => ({
        id: menu.id,
        type: document.getElementById("m_type").value,
        name: document.getElementById("m_name").value,
        icon: document.getElementById("m_icon").value,
        icon_file: document.getElementById("m_icon_file").files[0] || null,
        route_name: document.getElementById("m_route").value,
        url: document.getElementById("m_url").value,
        bg: document.getElementById("m_bg").value,
        is_active: document.getElementById("m_active").value,
        order_num: document.getElementById("m_order").value
      })
    });
    if (result.isDenied) {
      const delConfirm = await Swal.fire({ title: "Yakin hapus menu ini?", icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Hapus!" });
      if (delConfirm.isConfirmed) {
        Swal.fire({ title: "Menghapus...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
          await axios.post("/admin/menus/delete", { id: menu.id });
          Swal.fire({ icon: "success", title: "Terhapus!", showConfirmButton: false, timer: 1e3 });
          router.reload();
        } catch (e) {
          Swal.fire("Error", "Gagal menghapus", "error");
        }
      }
    } else {
      handleFormSubmit(result, true);
    }
  };
  const handleCreateMenu = async () => {
    const result = await Swal.fire({
      title: "➕ Tambah Menu Baru",
      width: "600px",
      html: buildFormHtml(),
      showCancelButton: true,
      confirmButtonText: "🚀 Daftarkan Menu",
      confirmButtonColor: "#16a34a",
      preConfirm: () => {
        const name = document.getElementById("m_name").value;
        if (!name) {
          Swal.showValidationMessage("Nama menu wajib diisi!");
          return false;
        }
        return {
          id: null,
          type: document.getElementById("m_type").value,
          name,
          icon: document.getElementById("m_icon").value,
          icon_file: document.getElementById("m_icon_file").files[0] || null,
          route_name: document.getElementById("m_route").value,
          url: document.getElementById("m_url").value,
          bg: document.getElementById("m_bg").value,
          is_active: document.getElementById("m_active").value,
          order_num: document.getElementById("m_order").value
        };
      }
    });
    handleFormSubmit(result);
  };
  const renderIcon = (iconString) => {
    if (!iconString) return /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle text-lg" });
    if (iconString.includes("/") || iconString.includes("http")) {
      return /* @__PURE__ */ jsx("img", { src: iconString, alt: "icon", className: "w-full h-full object-cover" });
    }
    return /* @__PURE__ */ jsx("i", { className: `fa-solid ${iconString} text-xl` });
  };
  const renderMenuGrid = (menus, title, colorClass) => /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx("span", { className: `w-2 h-2 rounded-full ${colorClass} animate-pulse` }),
      /* @__PURE__ */ jsx("h3", { className: "font-black text-sm uppercase tracking-widest text-slate-400", children: title })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 bg-slate-800/30 p-5 rounded-3xl border border-slate-800", children: menus.map((menu) => /* @__PURE__ */ jsxs("div", { onClick: () => handleEditMenu(menu), className: `flex flex-col items-center group cursor-pointer bg-slate-800/50 p-4 rounded-2xl border border-slate-700/40 hover:border-indigo-500/80 hover:bg-slate-800 transition-all transform hover:-translate-y-1 ${menu.is_active === 0 ? "opacity-40 grayscale" : ""}`, children: [
      /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md relative overflow-hidden mb-2 ${menu.bg || "bg-slate-700"}`, children: renderIcon(menu.icon) }),
      /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black text-slate-300 text-center leading-tight tracking-tight group-hover:text-white line-clamp-1", children: [
        menu.is_active === 0 && "👁️‍🗨️ ",
        " ",
        menu.name
      ] })
    ] }, menu.id)) })
  ] });
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "CMS Navigasi MILASTORE" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-900 min-h-screen text-white font-sans", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-black text-2xl tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400", children: "Pusat Kendali Navigasi MILASTORE" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-bold mt-1", children: "Sembunyikan menu, atur warna, dan kelola logo layanan dengan 1 klik." })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: handleCreateMenu, className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform", children: "➕ Buat Menu Baru" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-8 bg-slate-800/60 p-2 rounded-2xl border border-slate-700/50 w-max", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setActiveTab("all"), className: `px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${activeTab === "all" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`, children: "✨ Semua" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setActiveTab("app"), className: `px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${activeTab === "app" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`, children: [
          "📱 User (",
          appMenus.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setActiveTab("reseller"), className: `px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${activeTab === "reseller" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`, children: [
          "💼 Reseller (",
          resellerMenus.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setActiveTab("h2h"), className: `px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${activeTab === "h2h" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`, children: [
          "🔗 H2H (",
          h2hMenus.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setActiveTab("admin"), className: `px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${activeTab === "admin" ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`, children: [
          "🛡️ Admin (",
          adminMenus.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-10", children: [
        (activeTab === "all" || activeTab === "app") && renderMenuGrid(appMenus, "Deretan Menu Aplikasi (User)", "bg-indigo-500"),
        (activeTab === "all" || activeTab === "reseller") && resellerMenus.length > 0 && renderMenuGrid(resellerMenus, "Deretan Menu Khusus Reseller", "bg-amber-500"),
        (activeTab === "all" || activeTab === "h2h") && h2hMenus.length > 0 && renderMenuGrid(h2hMenus, "Deretan Menu H2H Server", "bg-purple-500"),
        (activeTab === "all" || activeTab === "admin") && renderMenuGrid(adminMenus, "Deretan Menu Kendali (Admin)", "bg-rose-500")
      ] })
    ] })
  ] });
}
export {
  MenuManager as default
};
