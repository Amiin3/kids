import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { useForm, Head } from "@inertiajs/react";
import Swal from "sweetalert2";
import "axios";
import "moment";
const ultimateStyles = `
    .cyber-bg {
        background-color: #0f172a;
        background-image: radial-gradient(circle at 50% -20%, rgba(56, 189, 248, 0.15), transparent 60%);
        min-height: 100vh;
    }
    .cyber-card {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(56, 189, 248, 0.2);
        box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
    }
    .input-cyber {
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(51, 65, 85, 0.8);
        color: #e2e8f0;
        transition: all 0.3s ease;
    }
    .input-cyber:focus {
        border-color: #38bdf8;
        box-shadow: 0 0 15px -2px rgba(56, 189, 248, 0.3);
        background: rgba(15, 23, 42, 0.8);
        outline: none;
    }
    select.input-cyber {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2338bdf8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        background-size: 1.5em 1.5em;
    }
    .glow-text { text-shadow: 0 0 20px rgba(56, 189, 248, 0.8); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
`;
function BroadcastIndex({ auth }) {
  const { data, setData, post, processing, reset } = useForm({
    title: "",
    message: "",
    type: "info",
    is_autopilot: false,
    time: "08:00",
    hari: "Minggu",
    target_role: "all",
    action_url: ""
  });
  const applyTemplate = (templateType) => {
    if (templateType === "promo") {
      setData({ ...data, title: "🔥 PROMO GILA MILASTORE!", type: "promo", message: "Tembak Paket Data termurah se-Indonesia sekarang juga sebelum kehabisan! Stok server baru saja di-restock. Sikat Bosku!", action_url: "https://milastore.cloud/promo" });
    } else if (templateType === "gangguan") {
      setData({ ...data, title: "⚠️ INFO GANGGUAN PROVIDER", type: "warning", message: "Mohon maaf, saat ini sedang terjadi gangguan dari pusat untuk beberapa produk. Transaksi yang pending akan otomatis sukses ketika jalur normal.", action_url: "" });
    } else if (templateType === "maintenance") {
      setData({ ...data, title: "🛠️ MAINTENANCE SISTEM", type: "info", message: "Malam ini pukul 00:00 - 02:00 WIB MILASTORE akan melakukan peningkatan server (Maintenance). Mohon tidak melakukan transaksi pada jam tersebut.", action_url: "" });
    }
  };
  const submit = (e) => {
    e.preventDefault();
    let targetText = data.target_role === "all" ? "SEMUA MEMBER" : data.target_role === "reseller" ? "KHUSUS RESELLER" : "KHUSUS VIP";
    let confirmHtml = data.is_autopilot ? `<div class="text-sm text-slate-300 mt-2">Pesan akan ditembakkan otomatis ke <b class="text-sky-400">${targetText}</b><br/><b class="text-sky-400 text-lg">TIAP HARI ${data.hari.toUpperCase()} JAM ${data.time} WIB</b></div>` : `<div class="text-sm text-slate-300 mt-2">Pesan akan <b class="text-rose-400">LANGSUNG DITEMBAKKAN</b><br/>ke target <b class="text-rose-400">${targetText}</b> sekarang juga.</div>`;
    Swal.fire({
      title: '<div class="text-2xl font-black text-white tracking-widest uppercase mt-2">KONFIRMASI TEMBAKAN</div>',
      html: confirmHtml,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: data.is_autopilot ? '<i class="fa-solid fa-robot mr-2"></i> AKTIFKAN AUTOPILOT' : '<i class="fa-solid fa-rocket mr-2"></i> TEMBAK SEKARANG',
      cancelButtonText: "BATAL",
      reverseButtons: true,
      buttonsStyling: false,
      background: "#0f172a",
      customClass: {
        confirmButton: `w-full ${data.is_autopilot ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]" : "bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_15px_rgba(56,189,248,0.4)]"} text-white font-black rounded-2xl px-5 py-4 mt-5 transition-all text-xs tracking-widest uppercase active:scale-95`,
        cancelButton: "w-full bg-transparent hover:bg-slate-800 text-slate-400 border border-slate-700 font-black rounded-2xl px-5 py-3 mt-3 transition-all text-xs tracking-widest uppercase",
        popup: "rounded-[32px] p-6 w-full max-w-sm border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        post("/admin/broadcast/send", {
          preserveScroll: true,
          onSuccess: (page) => {
            const flashSuccess = page.props.flash?.success || "Instruksi berhasil dijalankan.";
            Swal.fire({
              title: '<div class="text-xl font-black text-white uppercase tracking-widest mt-2">BERHASIL! 🚀</div>',
              html: `<p class="text-sm text-emerald-400 font-bold">${flashSuccess}</p>`,
              icon: "success",
              background: "#0f172a",
              confirmButtonText: "TUTUP",
              buttonsStyling: false,
              customClass: { popup: "rounded-[32px] border border-slate-700", confirmButton: "w-full bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 font-black rounded-xl px-5 py-3 mt-4 text-xs tracking-widest uppercase" }
            });
            if (!data.is_autopilot) reset("title", "message", "action_url");
          }
        });
      }
    });
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Pusat Komando Broadcast" }),
    /* @__PURE__ */ jsx("style", { children: ultimateStyles }),
    /* @__PURE__ */ jsxs("div", { className: "cyber-bg pb-[140px] md:pb-32 font-['Outfit']", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative pt-12 pb-24 px-5 overflow-hidden border-b border-sky-500/20 bg-slate-900/50 backdrop-blur-md rounded-b-[45px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-sky-500/20 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none translate-y-1/2 -translate-x-1/4" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto relative z-10 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 shadow-inner mb-4", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-satellite-dish text-3xl text-sky-400 animate-pulse" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black tracking-tight uppercase text-white glow-text", children: "Pusat Komando" }),
          /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center px-4 py-1 mt-3 rounded-full bg-slate-800/80 border border-slate-700 text-sky-400 text-[10px] font-black uppercase tracking-widest", children: "MILASTORE Mass Broadcast System" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto px-5 -mt-12 relative z-50", children: [
        /* @__PURE__ */ jsxs("div", { className: "cyber-card p-4 rounded-[24px] mb-6 flex gap-3 overflow-x-auto no-scrollbar items-center border border-slate-700", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 ml-2", children: "Quick Template:" }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => applyTemplate("promo"), className: "shrink-0 bg-slate-800/50 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-orange-500/20 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-fire mr-1.5" }),
            " Promo"
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => applyTemplate("gangguan"), className: "shrink-0 bg-slate-800/50 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-rose-500/20 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-95", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-triangle-exclamation mr-1.5" }),
            " Gangguan"
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => applyTemplate("maintenance"), className: "shrink-0 bg-slate-800/50 text-sky-400 border border-sky-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-sky-500/20 hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-wrench mr-1.5" }),
            " Maintenance"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "cyber-card p-6 md:p-8 rounded-[32px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex bg-[#0f172a] p-1.5 rounded-2xl mb-6 border border-slate-700 shadow-inner", children: [
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setData("is_autopilot", false), className: `flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!data.is_autopilot ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]" : "text-slate-500 hover:text-slate-300"}`, children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-rocket mr-1.5" }),
              " Kirim Instan"
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setData("is_autopilot", true), className: `flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${data.is_autopilot ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]" : "text-slate-500 hover:text-slate-300"}`, children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-robot mr-1.5" }),
              " Mode Autopilot"
            ] })
          ] }),
          data.is_autopilot && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-5 bg-indigo-900/20 border border-indigo-500/30 rounded-[24px] animate-in zoom-in-95 duration-300 relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-24 h-24 bg-indigo-500/20 rounded-bl-full blur-xl" }),
            /* @__PURE__ */ jsxs("label", { className: "text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 block relative z-10 flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-regular fa-calendar-check text-base" }),
              " Jadwal Tembak Otomatis"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 relative z-10", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "input-cyber w-full border-2 border-indigo-500/50 rounded-xl p-3 text-sm font-black focus:border-indigo-400 focus:ring-0 transition-all text-center",
                  value: data.hari,
                  onChange: (e) => setData("hari", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "Senin", children: "Senin" }),
                    /* @__PURE__ */ jsx("option", { value: "Selasa", children: "Selasa" }),
                    /* @__PURE__ */ jsx("option", { value: "Rabu", children: "Rabu" }),
                    /* @__PURE__ */ jsx("option", { value: "Kamis", children: "Kamis" }),
                    /* @__PURE__ */ jsx("option", { value: "Jumat", children: "Jumat" }),
                    /* @__PURE__ */ jsx("option", { value: "Sabtu", children: "Sabtu" }),
                    /* @__PURE__ */ jsx("option", { value: "Minggu", children: "Minggu" }),
                    /* @__PURE__ */ jsx("option", { value: "Setiap Hari", children: "Setiap Hari" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "time",
                  className: "input-cyber w-full border-2 border-indigo-500/50 rounded-xl p-3 text-sm font-black focus:border-indigo-400 focus:ring-0 transition-all text-center tracking-widest shadow-inner",
                  value: data.time,
                  onChange: (e) => setData("time", e.target.value),
                  required: data.is_autopilot
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[9px] text-indigo-400/70 font-bold mt-3 text-center uppercase tracking-widest relative z-10", children: "*MILASTORE akan mengeksekusi pesan sesuai jadwal di atas." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block", children: "Target Penerima" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                className: "input-cyber w-full rounded-2xl p-4 text-sm font-bold focus:ring-0",
                value: data.target_role,
                onChange: (e) => setData("target_role", e.target.value),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "🌐 Semua Member MILASTORE" }),
                  /* @__PURE__ */ jsx("option", { value: "reseller", children: "💼 Khusus Reseller" }),
                  /* @__PURE__ */ jsx("option", { value: "vip", children: "👑 Khusus Agen VIP" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block", children: "Judul Pesan" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input-cyber w-full rounded-2xl p-4 text-sm font-bold placeholder-slate-600 focus:ring-0",
                placeholder: "Contoh: Promo Spesial Hari Ini!",
                value: data.title,
                onChange: (e) => setData("title", e.target.value),
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block", children: "Isi Pesan / Pengumuman" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "input-cyber w-full rounded-2xl p-4 text-sm font-medium placeholder-slate-600 focus:ring-0",
                rows: "5",
                placeholder: "Ketik detail informasi di sini...",
                value: data.message,
                onChange: (e) => setData("message", e.target.value),
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block", children: "Link Tujuan / URL Promo (Opsional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input-cyber w-full rounded-2xl p-4 text-sm font-bold placeholder-slate-600 focus:ring-0",
                placeholder: "Contoh: https://milastore.cloud/promo-xl",
                value: data.action_url,
                onChange: (e) => setData("action_url", e.target.value)
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-2", children: /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-bold text-slate-500 uppercase tracking-widest", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-link mr-1" }),
              " Kosongkan jika tidak ada link"
            ] }) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: processing,
              className: `w-full text-white py-5 rounded-2xl font-black text-xs shadow-lg hover:-translate-y-1 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2 border ${data.is_autopilot ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_10px_25px_rgba(147,51,234,0.4)] border-purple-500/50" : "bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_10px_25px_rgba(56,189,248,0.4)] border-sky-500/50"} ${processing ? "opacity-70 pointer-events-none" : ""}`,
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-circle-notch fa-spin text-lg" }),
                " MEMPROSES..."
              ] }) : data.is_autopilot ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-robot text-lg" }),
                " AKTIFKAN AUTOPILOT"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-rocket text-lg" }),
                " TEMBAK SEKARANG"
              ] })
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  BroadcastIndex as default
};
