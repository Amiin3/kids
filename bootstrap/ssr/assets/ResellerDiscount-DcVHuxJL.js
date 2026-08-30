import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head, Link } from "@inertiajs/react";
function ResellerDiscount({ khfy = 0, adam = 0, kaje = 0, flash = {} }) {
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    khfy,
    adam,
    kaje
  });
  const [simulasiHarga, setSimulasiHarga] = useState(5e4);
  const [simulasiModal, setSimulasiModal] = useState(48e3);
  const [selectedProv, setSelectedProv] = useState("khfy");
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(num || 0);
  };
  const handlePreset = (provider, amount) => {
    const current = parseInt(data[provider]) || 0;
    setData(provider, Math.max(0, current + amount));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("admin.reseller.discounts.update"), {
      preserveScroll: true
    });
  };
  const diskonAktif = parseInt(data[selectedProv]) || 0;
  const hargaSetelahDiskon = Math.max(simulasiHarga - diskonAktif, simulasiModal > 0 ? simulasiModal : 1);
  const profit = hargaSetelahDiskon - simulasiModal;
  const providerList = [
    {
      key: "khfy",
      name: "KHFY PAYWAY",
      badge: "Fast Route",
      icon: "⚡",
      color: "from-blue-600 to-cyan-500",
      border: "border-cyan-500/30",
      bgGlow: "hover:shadow-cyan-500/10",
      desc: "Jalur instan transaksi XL, Axis, & Khfy Engine"
    },
    {
      key: "adam",
      name: "ADAM SERVER",
      badge: "Backup Gateway",
      icon: "🛡️",
      color: "from-purple-600 to-indigo-500",
      border: "border-purple-500/30",
      bgGlow: "hover:shadow-purple-500/10",
      desc: "Jalur cadangan failover & multi-payment"
    },
    {
      key: "kaje",
      name: "KAJE DIRECT (KJ)",
      badge: "Direct Host",
      icon: "👑",
      color: "from-amber-600 to-yellow-500",
      border: "border-amber-500/30",
      bgGlow: "hover:shadow-amber-500/10",
      desc: "Jalur Host-to-Host kuota murah & dor akrab"
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8 font-sans antialiased selection:bg-cyan-500 selection:text-black", children: [
    /* @__PURE__ */ jsx(Head, { title: "Reseller Discount Management - MILASTORE" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-2xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20", children: "🏷️" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-lg md:text-xl font-black tracking-tight text-white uppercase", children: "Reseller Discount Matrix" }),
              /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20", children: "V2 Smart Cache" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Atur margin potongan harga otomatis khusus akun level Reseller & Admin." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2.5", children: /* @__PURE__ */ jsx(
          Link,
          {
            href: "/admin",
            className: "px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700/60 transition",
            children: "← Dashboard"
          }
        ) })
      ] }),
      recentlySuccessful && /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/20 animate-fade", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping" }),
        "✅ Potongan harga reseller berhasil diperbarui & cache server telah disegarkan!"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-4", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          providerList.map((item) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `bg-slate-900/50 backdrop-blur-xl border ${item.border} p-5 rounded-3xl transition-all duration-300 ${item.bgGlow} relative overflow-hidden`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-2xl", children: item.icon }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-white tracking-wide", children: item.name }),
                        /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700", children: item.badge })
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400", children: item.desc })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 uppercase font-semibold block", children: "Potongan Aktif" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-sm font-extrabold text-cyan-400 font-mono", children: [
                      "- ",
                      formatRupiah(data[item.key])
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2 border-t border-slate-800/80", children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500", children: "Rp" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "0",
                        step: "50",
                        value: data[item.key],
                        onChange: (e) => setData(item.key, e.target.value),
                        className: "w-full bg-slate-950/70 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition",
                        placeholder: "0"
                      }
                    )
                  ] }),
                  errors[item.key] && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-rose-400 font-medium", children: errors[item.key] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5 pt-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 font-semibold mr-1", children: "Preset Cepat:" }),
                    [50, 100, 200, 500, 1e3].map((amt) => /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => handlePreset(item.key, amt),
                        className: "px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold font-mono border border-slate-700/60 transition active:scale-95",
                        children: [
                          "+",
                          amt
                        ]
                      },
                      amt
                    )),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setData(item.key, 0),
                        className: "px-2.5 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 text-[10px] font-bold border border-rose-800/30 transition active:scale-95 ml-auto",
                        children: "Reset (0)"
                      }
                    )
                  ] })
                ] })
              ]
            },
            item.key
          )),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all duration-300 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2",
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" }),
                /* @__PURE__ */ jsx("span", { children: "Menyimpan & Reset Cache..." })
              ] }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("span", { children: "💾 Terapkan Diskon Reseller" }) })
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl space-y-4 sticky top-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-base", children: "🧮" }),
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-slate-300", children: "Simulator Safety Net" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 leading-relaxed", children: "Uji kalkulasi pemotongan harga secara langsung untuk memastikan diskon tidak membuat harga jual minus atau berada di bawah harga modal." }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Provider Target" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: selectedProv,
                  onChange: (e) => setSelectedProv(e.target.value),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 mt-1",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "khfy", children: "KHFY PAYWAY" }),
                    /* @__PURE__ */ jsx("option", { value: "adam", children: "ADAM SERVER" }),
                    /* @__PURE__ */ jsx("option", { value: "kaje", children: "KAJE DIRECT" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Harga Katalog Normal" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "500",
                  value: simulasiHarga,
                  onChange: (e) => setSimulasiHarga(Number(e.target.value)),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 mt-1"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Harga Modal H2H" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "500",
                  value: simulasiModal,
                  onChange: (e) => setSimulasiModal(Number(e.target.value)),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 mt-1"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2 mt-4 font-mono text-xs", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-400", children: [
              /* @__PURE__ */ jsx("span", { children: "Harga Awal:" }),
              /* @__PURE__ */ jsx("span", { children: formatRupiah(simulasiHarga) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-cyan-400", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Diskon (",
                selectedProv.toUpperCase(),
                "):"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "- ",
                formatRupiah(diskonAktif)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-400", children: [
              /* @__PURE__ */ jsx("span", { children: "Batas Modal:" }),
              /* @__PURE__ */ jsx("span", { children: formatRupiah(simulasiModal) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white", children: [
              /* @__PURE__ */ jsx("span", { children: "Harga Reseller:" }),
              /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: formatRupiah(hargaSetelahDiskon) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[11px] pt-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "Margin Profit:" }),
              /* @__PURE__ */ jsx("span", { className: profit >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold", children: formatRupiah(profit) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[10px] text-cyan-300/80 leading-relaxed", children: [
            "💡 ",
            /* @__PURE__ */ jsx("strong", { children: "Fitur Anti-Rugi Aktif:" }),
            " Sistem secara otomatis membatasi harga reseller agar tidak tembus lebih murah dari harga modal produk."
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  ResellerDiscount as default
};
