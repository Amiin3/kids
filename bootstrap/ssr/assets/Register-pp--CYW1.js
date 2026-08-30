import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { G as GuestLayout } from "./GuestLayout-Cu_YTx-F.js";
import { T as TextInput, I as InputError } from "./TextInput-BP-vnUns.js";
import { I as InputLabel } from "./InputLabel-CE_n4Upz.js";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
function Register() {
  const { flash } = usePage().props;
  const params = new URLSearchParams(window.location.search);
  const urlRef = params.get("ref") || "";
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    password_confirmation: "",
    referral_code: urlRef
  });
  useEffect(() => {
    return () => {
      reset("password", "password_confirmation");
    };
  }, []);
  useEffect(() => {
    if (flash?.error) {
      Swal.fire({
        title: "Eitss! Gagal Bosku",
        text: flash.error,
        icon: "error",
        confirmButtonColor: "#4f46e5",
        background: "#ffffff",
        customClass: { popup: "rounded-3xl shadow-2xl border border-slate-100" }
      });
    }
  }, [flash]);
  const submit = (e) => {
    e.preventDefault();
    post(route("register"), {
      // JIKA ADA ERROR DARI JALUR INERTIA NORMAL
      onError: (err) => {
        const firstMsg = Object.values(err)[0];
        if (firstMsg) {
          Swal.fire({
            title: "Periksa Data Lagi!",
            text: firstMsg,
            icon: "warning",
            confirmButtonColor: "#4f46e5",
            customClass: { popup: "rounded-3xl" }
          });
        }
      }
    });
  };
  return /* @__PURE__ */ jsxs(GuestLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Daftar Akun Baru - MilaStore" }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-4 overflow-hidden rounded-[2.5rem] bg-white/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 p-8 md:p-12 animate-[fadeInUp_0.6s_ease-out]", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[80px] pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-rose-500/20 to-orange-500/20 blur-[80px] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-10 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-xl shadow-indigo-500/40 mb-6 transform transition hover:scale-110 hover:rotate-6", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-user-plus text-white text-3xl" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-4xl font-[900] bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent tracking-tighter", children: "Bergabung Sekarang" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-400 mt-2 tracking-wide uppercase", children: "MilaStore Premium Digital Apps" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mb-10", children: /* @__PURE__ */ jsxs("a", { href: "/auth/google", className: "group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 font-black text-slate-700 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.97]", children: [
          /* @__PURE__ */ jsx("img", { src: "https://www.svgrepo.com/show/475656/google-color.svg", alt: "Google", className: "h-6 w-6" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-widest", children: "Daftar Instan via Google" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "relative mb-10 flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-slate-300", children: "Atau Input Manual" }),
          /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-transparent" })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "name", value: "Nama Lengkap", className: "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1" }),
              /* @__PURE__ */ jsx(TextInput, { id: "name", value: data.name, onChange: (e) => setData("name", e.target.value), required: true, className: "w-full rounded-2xl border-2 h-14 px-5 font-bold focus:border-indigo-600 focus:bg-white" }),
              /* @__PURE__ */ jsx(InputError, { message: errors.name, className: "mt-1 font-bold text-[10px]" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "email", value: "Email Aktif", className: "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1" }),
              /* @__PURE__ */ jsx(TextInput, { id: "email", type: "email", value: data.email, onChange: (e) => setData("email", e.target.value), required: true, className: "w-full rounded-2xl border-2 h-14 px-5 font-bold focus:border-indigo-600 focus:bg-white" }),
              /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-1 font-bold text-[10px]" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "whatsapp", value: "WhatsApp (08xxx)", className: "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1" }),
              /* @__PURE__ */ jsx(TextInput, { id: "whatsapp", value: data.whatsapp, onChange: (e) => setData("whatsapp", e.target.value), required: true, className: "w-full rounded-2xl border-2 h-14 px-5 font-bold focus:border-indigo-600 focus:bg-white" }),
              /* @__PURE__ */ jsx(InputError, { message: errors.whatsapp, className: "mt-1 font-bold text-[10px]" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "referral_code", value: "Kode Referral (Opsional)", className: "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1" }),
              /* @__PURE__ */ jsx(TextInput, { id: "referral_code", value: data.referral_code, onChange: (e) => setData("referral_code", e.target.value), className: "w-full rounded-2xl border-2 bg-slate-50 h-14 px-5 font-bold focus:border-indigo-600 focus:bg-white" }),
              /* @__PURE__ */ jsx(InputError, { message: errors.referral_code, className: "mt-1 font-bold text-[10px]" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Password", className: "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1" }),
              /* @__PURE__ */ jsx(TextInput, { id: "password", type: "password", value: data.password, onChange: (e) => setData("password", e.target.value), required: true, className: "w-full rounded-2xl border-2 h-14 px-5 font-bold focus:border-indigo-600" }),
              /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-1 font-bold text-[10px]" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password_confirmation", value: "Konfirmasi Password", className: "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1" }),
              /* @__PURE__ */ jsx(TextInput, { id: "password_confirmation", type: "password", value: data.password_confirmation, onChange: (e) => setData("password_confirmation", e.target.value), required: true, className: "w-full rounded-2xl border-2 h-14 px-5 font-bold focus:border-indigo-600" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col-reverse sm:flex-row items-center justify-between gap-6 mt-10", children: [
            /* @__PURE__ */ jsxs(Link, { href: route("login"), className: "text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left mr-2" }),
              "Ke Login"
            ] }),
            /* @__PURE__ */ jsx("button", { type: "submit", disabled: processing, className: "w-full sm:w-auto px-12 h-16 bg-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3", children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-spinner animate-spin" }),
              " Memproses..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-rocket" }),
              " Daftar Sekarang"
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }` })
  ] });
}
export {
  Register as default
};
