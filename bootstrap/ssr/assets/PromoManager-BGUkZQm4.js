import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head, router } from "@inertiajs/react";
import Swal from "sweetalert2";
import "axios";
import "moment";
function PromoManager({ auth, promos = [] }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    badge: "",
    theme: "indigo",
    icon: "fa-bolt",
    url: "",
    is_active: 1,
    image: null,
    remove_image: "0"
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: "warning", title: "Ukuran Terlalu Besar", text: "Maksimal ukuran file adalah 5 MB." });
        e.target.value = "";
        return;
      }
      setForm((prev) => ({ ...prev, image: file, remove_image: "0" }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: null, remove_image: "1" }));
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description || "");
    formData.append("badge", form.badge || "");
    formData.append("theme", form.theme);
    formData.append("icon", form.icon);
    formData.append("url", form.url || "");
    formData.append("is_active", form.is_active);
    formData.append("remove_image", form.remove_image);
    if (form.image instanceof File) {
      formData.append("image", form.image);
    }
    const endpoint = isEditing ? `/admin/promo/update/${form.id}` : "/admin/promo";
    router.post(endpoint, formData, {
      forceFormData: true,
      onSuccess: () => {
        resetForm();
        setIsSubmitting(false);
        Swal.fire({ icon: "success", title: "Berhasil!", text: "Banner promo berhasil disimpan.", timer: 1500, showConfirmButton: false });
      },
      onError: (err) => {
        setIsSubmitting(false);
        const msg = Object.values(err)[0] || "Gagal memproses data.";
        Swal.fire({ icon: "error", title: "Gagal", text: msg });
      }
    });
  };
  const handleEdit = (p) => {
    setForm({
      id: p.id,
      title: p.title || "",
      description: p.description || "",
      badge: p.badge || "",
      theme: p.theme || "indigo",
      icon: p.icon || "fa-bolt",
      url: p.url || "",
      is_active: p.is_active ? 1 : 0,
      image: null,
      remove_image: "0"
    });
    setPreviewUrl(p.image ? p.image : null);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDelete = (id) => {
    Swal.fire({
      title: "Hapus Banner Promo?",
      text: "Banner ini akan dihapus permanen dari sistem.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    }).then((res) => {
      if (res.isConfirmed) {
        router.post(`/admin/promo/delete/${id}`, {}, {
          onSuccess: () => Swal.fire({ icon: "success", title: "Terhapus!", text: "Banner berhasil dihapus.", timer: 1500, showConfirmButton: false }),
          onError: () => Swal.fire({ icon: "error", title: "Gagal", text: "Tidak dapat menghapus banner." })
        });
      }
    });
  };
  const resetForm = () => {
    setForm({
      id: null,
      title: "",
      description: "",
      badge: "",
      theme: "indigo",
      icon: "fa-bolt",
      url: "",
      is_active: 1,
      image: null,
      remove_image: "0"
    });
    setPreviewUrl(null);
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Kelola Promo & Banner Iklan" }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "max-w-5xl mx-auto px-4 h-16 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-bullhorn" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm sm:text-base font-bold text-slate-900 leading-tight", children: "Manajemen Promo & Banner" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400", children: "Upload banner iklan interaktif langsung dari HP/PC" })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxs("main", { className: "max-w-5xl mx-auto px-4 pt-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-3 mb-4 border-b border-slate-100", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-pen-to-square text-blue-600" }),
              isEditing ? `Edit Promo #${form.id}` : "Tambah Banner Promo Baru"
            ] }),
            isEditing && /* @__PURE__ */ jsx("button", { onClick: resetForm, className: "text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1 rounded-lg transition-colors", children: "Batal Edit" })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-1", children: "Judul Promo / Iklan *" }),
                /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Cth: TRIBUTE JUARA TRANSAKSI", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), className: "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50", required: true })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-1", children: "Teks Lencana (Badge Tag)" }),
                /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Cth: ⚡ EVENT SPESIAL", value: form.badge, onChange: (e) => setForm({ ...form, badge: e.target.value }), className: "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-1", children: "Deskripsi Singkat" }),
              /* @__PURE__ */ jsx("textarea", { placeholder: "Keterangan singkat...", value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), className: "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50 resize-none", rows: "2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3", children: [
              /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-700 block", children: [
                /* @__PURE__ */ jsx("i", { className: "fa-regular fa-image mr-1 text-blue-600" }),
                " Upload Gambar Banner"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center gap-4", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    ref: fileInputRef,
                    accept: "image/jpeg, image/png, image/webp",
                    onChange: handleFileChange,
                    className: "text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  }
                ),
                previewUrl && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: handleRemoveImage,
                    className: "text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx("i", { className: "fa-solid fa-trash-can mr-1" }),
                      " Hapus Gambar"
                    ]
                  }
                )
              ] }),
              previewUrl && /* @__PURE__ */ jsx("div", { className: "relative rounded-xl overflow-hidden border border-slate-200 max-w-sm shadow-xs bg-slate-900 mt-2", children: /* @__PURE__ */ jsx("img", { src: previewUrl, alt: "Preview Banner", className: "w-full h-32 sm:h-40 object-cover" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-1", children: "Warna Default" }),
                /* @__PURE__ */ jsxs("select", { value: form.theme, onChange: (e) => setForm({ ...form, theme: e.target.value }), className: "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white", children: [
                  /* @__PURE__ */ jsx("option", { value: "indigo", children: "Ungu-Biru" }),
                  /* @__PURE__ */ jsx("option", { value: "rose", children: "Merah-Pink" }),
                  /* @__PURE__ */ jsx("option", { value: "emerald", children: "Hijau" }),
                  /* @__PURE__ */ jsx("option", { value: "sky", children: "Biru Muda" }),
                  /* @__PURE__ */ jsx("option", { value: "amber", children: "Oranye" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-1", children: "Ikon Default" }),
                /* @__PURE__ */ jsxs("select", { value: form.icon, onChange: (e) => setForm({ ...form, icon: e.target.value }), className: "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white", children: [
                  /* @__PURE__ */ jsx("option", { value: "fa-bolt", children: "⚡ Petir" }),
                  /* @__PURE__ */ jsx("option", { value: "fa-trophy", children: "🏆 Piala" }),
                  /* @__PURE__ */ jsx("option", { value: "fa-fire", children: "🔥 Api" }),
                  /* @__PURE__ */ jsx("option", { value: "fa-gamepad", children: "🎮 Gamepad" }),
                  /* @__PURE__ */ jsx("option", { value: "fa-gift", children: "🎁 Hadiah" }),
                  /* @__PURE__ */ jsx("option", { value: "fa-percent", children: "🏷️ Persen" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-1", children: "Tautan Aksi (URL)" }),
                /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Cth: /deposit", value: form.url, onChange: (e) => setForm({ ...form, url: e.target.value }), className: "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-600 block mb-1", children: "Status" }),
                /* @__PURE__ */ jsxs("select", { value: form.is_active, onChange: (e) => setForm({ ...form, is_active: parseInt(e.target.value) }), className: "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white", children: [
                  /* @__PURE__ */ jsx("option", { value: "1", children: "Aktif Tayang" }),
                  /* @__PURE__ */ jsx("option", { value: "0", children: "Sembunyikan" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-3", children: /* @__PURE__ */ jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2", children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-spinner fa-spin" }),
              /* @__PURE__ */ jsx("span", { children: "Menyimpan..." })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-cloud-arrow-up" }),
              /* @__PURE__ */ jsx("span", { children: isEditing ? "Simpan Perubahan" : "Terbitkan Banner" })
            ] }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs sm:text-sm font-bold text-slate-900", children: "Daftar Banner Promo" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full", children: [
              "Total: ",
              promos.length
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-100 overflow-x-auto", children: promos.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-xs text-slate-400 font-medium", children: "Belum ada promo aktif." }) : promos.map((p) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
              p.image ? /* @__PURE__ */ jsx("img", { src: p.image, alt: p.title, className: "w-20 h-12 rounded-lg object-cover border border-slate-200 shrink-0" }) : /* @__PURE__ */ jsx("div", { className: "w-14 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-base shrink-0 shadow-2xs", children: /* @__PURE__ */ jsx("i", { className: `fa-solid ${p.icon || "fa-bolt"}` }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-900 truncate", children: p.title }),
                  p.badge && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0", children: p.badge })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 truncate mt-0.5", children: p.description || "Tanpa deskripsi" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 shrink-0", children: [
              /* @__PURE__ */ jsx("span", { className: `text-[9px] font-bold px-2 py-1 rounded-full border ${p.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`, children: p.is_active ? "Tayang" : "Draft" }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleEdit(p), className: "w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center text-xs transition-colors", title: "Edit", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-pen" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(p.id), className: "w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center text-xs transition-colors", title: "Hapus", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-trash" }) })
            ] })
          ] }, p.id)) })
        ] })
      ] })
    ] })
  ] });
}
export {
  PromoManager as default
};
