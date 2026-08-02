import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head, Link } from "@inertiajs/react";
import "axios";
import "moment";
function XlTools({ auth, userBalance }) {
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(Number(n) || 0);
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Cek Hutang & Tools - MilaStore" }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#F4F7FB] font-['Outfit'] pb-40", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 pb-20 text-white shadow-xl relative overflow-hidden rounded-b-[45px]", style: { background: "linear-gradient(135deg, #f97316 0%, #db2777 100%)" }, children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto flex justify-between items-center relative z-10", children: [
          /* @__PURE__ */ jsx(Link, { href: "/dashboard", className: "text-white w-8 h-8 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-md transition-transform hover:-translate-x-1", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left-long" }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-black tracking-tight m-0 uppercase drop-shadow-md", children: "Cek Hutang & Tools" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-inner", children: [
              "Saldo: Rp ",
              formatRp(userBalance)
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-8" })
        ] }),
        /* @__PURE__ */ jsx("i", { className: "fa-solid fa-toolbox absolute right-5 -bottom-5 text-8xl text-white opacity-10 -rotate-12" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto px-5 -mt-12 relative z-20 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-xl font-black", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-file-invoice-dollar" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-black text-slate-800 text-sm", children: "Cek Hutang Telkomsel" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-400", children: "Cek status pulsa siaga / hutang" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("a", { href: "tel:*805#", className: "bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all", children: "Dial *805#" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl font-black", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-sim-card" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-black text-slate-800 text-sm", children: "Cek Kuota XL / Axis" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-400", children: "Informasi sisa kuota reguler" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("a", { href: "tel:*808#", className: "bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all", children: "Dial *808#" })
        ] })
      ] })
    ] })
  ] });
}
export {
  XlTools as default
};
