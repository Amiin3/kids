import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import Swal from "sweetalert2";
/* empty css                      */
import "axios";
import "moment";
const ProviderIcon = ({ provider }) => {
  if (!provider) return /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-wifi" }) });
  const brands = {
    "TELKOMSEL": { bg: "bg-gradient-to-br from-red-500 to-red-700", text: "Tsel", icon: "fa-signal" },
    "BY.U": { bg: "bg-gradient-to-br from-blue-500 to-cyan-500", text: "By.U", icon: "fa-b" },
    "INDOSAT": { bg: "bg-gradient-to-br from-yellow-400 to-amber-500", text: "Isat", icon: "fa-globe" },
    "XL": { bg: "bg-gradient-to-br from-blue-500 to-blue-700", text: "XL", icon: "fa-bolt" },
    "AXIS": { bg: "bg-gradient-to-br from-purple-500 to-purple-700", text: "Axis", icon: "fa-location-arrow" },
    "TRI": { bg: "bg-gradient-to-br from-slate-800 to-black", text: "Tri", icon: "fa-3" },
    "SMARTFREN": { bg: "bg-gradient-to-br from-pink-500 to-rose-600", text: "SF", icon: "fa-podcast" }
  };
  const b = brands[provider] || { bg: "bg-gradient-to-br from-indigo-500 to-purple-600", text: provider.substring(0, 3) };
  return /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-full flex flex-col items-center justify-center text-white shadow-md border border-white/20 ${b.bg} shrink-0`, children: /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider mt-0.5", children: b.text }) });
};
function Data({ auth, groupedProducts, userBalance }) {
  const { flash } = usePage().props;
  const [variant, setVariant] = useState("DIGIFLAZZ");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState(null);
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const fakeMarkup = 0.05;
  const { transform, post, processing } = useForm({ tujuan: "", kode_layanan: "", server: "" });
  const formatRp = (n) => new Intl.NumberFormat("id-ID").format(Number(n) || 0);
  useEffect(() => {
    if (phone.length >= 4) {
      const p4 = phone.substring(0, 4);
      const p5 = phone.substring(0, 5);
      if (["08515", "08516", "08517"].includes(p5)) setProvider("BY.U");
      else if (["0811", "0812", "0813", "0821", "0822", "0823", "0851", "0852", "0853"].includes(p4)) setProvider("TELKOMSEL");
      else if (["0814", "0815", "0816", "0855", "0856", "0857", "0858"].includes(p4)) setProvider("INDOSAT");
      else if (["0817", "0818", "0819", "0859", "0877", "0878", "0879"].includes(p4)) setProvider("XL");
      else if (["0831", "0832", "0833", "0838"].includes(p4)) setProvider("AXIS");
      else if (["0895", "0896", "0897", "0898", "0899"].includes(p4)) setProvider("TRI");
      else if (["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"].includes(p4)) setProvider("SMARTFREN");
      else setProvider(null);
    } else {
      setProvider(null);
      setSelected(null);
    }
  }, [phone]);
  const handleContactPicker = async () => {
    if (window.AndroidBridge && typeof window.AndroidBridge.bukaKontak === "function") {
      window._contactResolve = (data) => {
        if (data && data.length > 0) {
          let number = data[0].tel[0].replace(/\D/g, "");
          if (number.startsWith("62")) number = "0" + number.substring(2);
          setPhone(number);
        }
      };
      window.AndroidBridge.bukaKontak();
    }
  };
  const { categories, productsByCategory } = useMemo(() => {
    if (!provider || !groupedProducts) return { categories: [], productsByCategory: {} };
    const keys = Object.keys(groupedProducts);
    let matchingKey = keys.find((k) => k.toLowerCase() === provider.toLowerCase().replace(".", ""));
    if (!matchingKey) matchingKey = keys.find((k) => k.toLowerCase().includes(provider.toLowerCase().replace(".", "")));
    const activeProducts = matchingKey ? groupedProducts[matchingKey].filter((p) => p.server === variant) : [];
    if (activeProducts.length === 0) return { categories: [], productsByCategory: {} };
    const groups = { "Semua": activeProducts };
    const catSet = /* @__PURE__ */ new Set(["Semua"]);
    activeProducts.forEach((p) => {
      let name = p.nama_layanan;
      const safeProvider = provider.replace(".", "\\.");
      const regexJunk = new RegExp(`\\b(${safeProvider}|Telkomsel|Tsel|Byu|Indosat|Isat|XL|Axis|Tri|Three|Smartfren|Data|Paket|Internet|Promo|Inject|Kuota)\\b`, "gi");
      name = name.replace(regexJunk, "").trim();
      const match = name.match(/^([a-zA-Z\s\-]+)/);
      let categoryName = match ? match[1].trim() : "Reguler";
      if (categoryName.length < 3 || categoryName.toLowerCase() === "hari" || categoryName.toLowerCase() === "bulan") {
        categoryName = "Reguler";
      } else {
        categoryName = categoryName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      }
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(p);
      catSet.add(categoryName);
    });
    return {
      categories: Array.from(catSet).sort((a, b) => a === "Semua" ? -1 : b === "Semua" ? 1 : a.localeCompare(b)),
      productsByCategory: groups
    };
  }, [provider, groupedProducts, variant]);
  const handleOrder = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!selected || cleanPhone.length < 10) return;
    if (Number(userBalance) < Number(selected.harga_jual)) return Swal.fire({ icon: "error", title: "Saldo Kurang", text: "Top up dompet dulu!", confirmButtonColor: "#6366f1", customClass: { popup: "rounded-[20px]" } });
    const safeProvider = provider.replace(".", "\\.");
    let cleanItemName = selected.nama_layanan.replace(new RegExp(`\\b(${safeProvider})\\b`, "gi"), "").trim();
    Swal.fire({
      title: `<div class="text-xl font-black text-slate-800 mt-2">Konfirmasi Order</div>`,
      html: `
                <div class="text-left mt-3 space-y-3">
                    <div class="bg-slate-50 p-4 flex justify-between items-center rounded-[16px] border border-slate-100 shadow-sm">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Tujuan</span>
                        <span class="text-sm font-black text-slate-800 font-mono tracking-widest">${cleanPhone}</span>
                    </div>
                    <div class="bg-slate-50 p-4 flex justify-between items-center rounded-[16px] border border-slate-100 shadow-sm">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Paket</span>
                        <span class="text-xs font-bold text-purple-600 text-right w-2/3 leading-tight">${cleanItemName}</span>
                    </div>
                    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 flex justify-between items-center rounded-[16px] shadow-lg shadow-purple-500/30 mt-4 relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        <span class="text-xs font-black text-white/80 uppercase tracking-widest relative z-10">Total Bayar</span>
                        <span class="text-xl font-black text-white relative z-10 drop-shadow-md">Rp ${formatRp(selected.harga_jual)}</span>
                    </div>
                </div>
            `,
      showCancelButton: true,
      cancelButtonText: "BATAL",
      confirmButtonText: "BAYAR SEKARANG",
      buttonsStyling: false,
      reverseButtons: true,
      customClass: {
        confirmButton: "w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest rounded-xl px-4 py-4 mt-4 transition-all text-xs uppercase shadow-xl",
        cancelButton: "w-full bg-transparent text-slate-400 font-black tracking-widest rounded-xl px-4 py-3 mt-2 hover:bg-slate-50 border border-slate-200 transition-all text-xs uppercase",
        popup: "rounded-[28px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl"
      }
    }).then((res) => {
      if (res.isConfirmed) {
        transform((data) => ({ ...data, tujuan: cleanPhone, kode_layanan: selected.kode_layanan, server: variant }));
        post(route("order.data.store"), {
          preserveScroll: true,
          preserveState: true,
          onStart: () => {
            Swal.fire({
              html: `
                                <div class="mt-4 flex flex-col items-center">
                                    <div class="w-16 h-16 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin shadow-lg shadow-purple-500/20"></div>
                                    <p class="text-sm font-black tracking-widest uppercase text-slate-600 mt-6">Memproses...</p>
                                </div>
                            `,
              allowOutsideClick: false,
              showConfirmButton: false,
              buttonsStyling: false,
              customClass: { popup: "rounded-[32px] p-8 w-full max-w-[250px] shadow-2xl" }
            });
          },
          onSuccess: (page) => {
            const flashMessage = page.props.flash || {};
            if (flashMessage.error) {
              Swal.fire({ icon: "error", title: "Gagal", text: flashMessage.error, confirmButtonColor: "#ef4444", customClass: { popup: "rounded-[24px]" } });
            } else {
              Swal.fire({ icon: "success", title: '<div class="text-xl font-black text-slate-800">Berhasil!</div>', timer: 1500, showConfirmButton: false, customClass: { popup: "rounded-[28px] p-6 shadow-2xl" } }).then(() => router.visit("/riwayat"));
            }
          },
          onError: (err) => {
            Swal.fire({ icon: "error", title: "Error", text: Object.values(err)[0] || "Kesalahan internal.", confirmButtonColor: "#ef4444", customClass: { popup: "rounded-[24px]" } });
          }
        });
      }
    });
  };
  const currentViewProducts = productsByCategory[activeCategory] || [];
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Paket Data" }),
    /* @__PURE__ */ jsx("style", { children: `.no-scrollbar::-webkit-scrollbar { display: none; }` }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50 font-['Outfit'] pb-32", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-5 pt-8 pb-20 rounded-b-[40px] shadow-lg shadow-purple-900/20 relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-2xl" }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center relative z-10", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => router.visit("/dashboard"), className: "w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/30 active:scale-95 transition-all", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-arrow-left-long" }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-white tracking-widest uppercase drop-shadow-md", children: "Paket Data" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-inner", children: [
              /* @__PURE__ */ jsx("i", { className: "fa-solid fa-wallet text-fuchsia-300 text-[10px]" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-white tracking-widest", children: [
                "Rp ",
                formatRp(userBalance)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-10" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto px-4 -mt-10 relative z-20", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-6 animate-in slide-in-from-bottom-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2 px-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Nomor Tujuan" }),
            provider && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md animate-in fade-in", children: provider })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-[16px] p-2 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-50 transition-all", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                className: "flex-1 border-none bg-transparent focus:ring-0 font-mono text-xl font-black text-slate-800 px-3 tracking-widest placeholder-slate-300",
                placeholder: "0812xxxx",
                value: phone,
                onChange: (e) => setPhone(e.target.value.replace(/\D/g, "")),
                maxLength: "15"
              }
            ),
            /* @__PURE__ */ jsx("button", { onClick: handleContactPicker, className: "w-11 h-11 bg-white shadow-sm border border-slate-200 text-purple-600 rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-purple-50", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-address-book" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-200/50 p-1.5 rounded-[16px] flex mb-6", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setVariant("DIGIFLAZZ");
                setSelected(null);
              },
              className: `flex-1 py-2.5 text-[11px] font-black rounded-[12px] transition-all tracking-widest uppercase ${variant === "DIGIFLAZZ" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`,
              children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-bolt mr-1" }),
                " Reguler"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setVariant("OKECONNECT");
                setSelected(null);
              },
              className: `flex-1 py-2.5 text-[11px] font-black rounded-[12px] transition-all tracking-widest uppercase ${variant === "OKECONNECT" ? "bg-white text-fuchsia-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`,
              children: [
                /* @__PURE__ */ jsx("i", { className: "fa-solid fa-fire mr-1" }),
                " Promo"
              ]
            }
          )
        ] }),
        categories.length > 1 && phone.length >= 4 && /* @__PURE__ */ jsx("div", { className: "flex overflow-x-auto gap-2 mb-6 no-scrollbar pb-1 snap-x", children: categories.map((cat) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setActiveCategory(cat);
              setSelected(null);
            },
            className: `snap-center shrink-0 px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all border ${activeCategory === cat ? "bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent text-white shadow-md shadow-purple-500/20" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`,
            children: cat
          },
          cat
        )) }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: phone.length < 4 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-white border border-dashed border-slate-200 rounded-[24px] mt-2 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 text-2xl", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-keyboard" }) }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 font-bold uppercase tracking-widest", children: [
            "Ketik Nomor",
            /* @__PURE__ */ jsx("br", {}),
            "Memunculkan Paket"
          ] })
        ] }) : currentViewProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-white rounded-[24px] border border-slate-100 shadow-sm animate-in zoom-in", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 text-2xl", children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-box-open" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 font-bold uppercase tracking-widest", children: "Paket Kosong" })
        ] }) : currentViewProducts.map((p) => {
          const isSelected = selected?.kode_layanan === p.kode_layanan;
          const safeProvider = provider.replace(".", "\\.");
          let displayName = p.nama_layanan.replace(new RegExp(`\\b(${safeProvider})\\b`, "gi"), "").trim();
          const hargaCoret = Math.round(p.harga_jual * (1 + fakeMarkup));
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => setSelected(p),
              className: `p-3 rounded-[20px] transition-all cursor-pointer border relative overflow-hidden flex items-center gap-3 bg-white ${isSelected ? "border-purple-500 bg-purple-50/30 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500 scale-[1.02] z-10" : "border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md"}`,
              children: [
                /* @__PURE__ */ jsx(ProviderIcon, { provider }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 pr-1", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[9px] font-black text-slate-400 mb-0.5 tracking-widest", children: p.kode_layanan }),
                  /* @__PURE__ */ jsx("div", { className: `font-bold text-[13px] leading-tight ${isSelected ? "text-purple-800" : "text-slate-700"}`, children: displayName })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right flex flex-col justify-center items-end min-w-[85px] pl-2 border-l border-slate-100", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-400 line-through font-bold", children: [
                    "Rp ",
                    formatRp(hargaCoret)
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: `text-[15px] font-black tracking-tight ${isSelected ? "text-purple-600" : "text-slate-800"}`, children: [
                    "Rp ",
                    formatRp(p.harga_jual)
                  ] })
                ] })
              ]
            },
            p.kode_layanan
          );
        }) })
      ] }),
      selected && phone.length >= 10 && /* @__PURE__ */ jsx("div", { className: "fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-5", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-slate-900 to-slate-800 rounded-[24px] p-2 pl-6 pr-2 shadow-2xl flex justify-between items-center border border-slate-700", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center py-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5", children: "Total Bayar" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xl font-black text-white leading-none drop-shadow-md", children: [
            "Rp ",
            formatRp(selected.harga_jual)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: handleOrder, disabled: processing, className: "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/40 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 border border-white/10", children: [
          processing ? "PROSES..." : "BAYAR",
          " ",
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-fingerprint" })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  Data as default
};
