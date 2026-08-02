import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import "moment";
function Dashboard({ auth, stats, recent_logs, banned_list }) {
  const [osintTarget, setOsintTarget] = useState("");
  const [osintResult, setOsintResult] = useState(null);
  const [osintType, setOsintType] = useState("");
  const [osintError, setOsintError] = useState("");
  const [isOsintRunning, setIsOsintRunning] = useState(false);
  const [malwareResult, setMalwareResult] = useState(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [isMalwareRunning, setIsMalwareRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4e3);
  };
  const runOsint = async () => {
    if (!osintTarget) return;
    setIsOsintRunning(true);
    setOsintResult(null);
    setOsintError("");
    setOsintType("");
    try {
      const response = await axios.post("/admin/cyber-security/osint", { target: osintTarget });
      if (response.data.status === "success") {
        setOsintResult(response.data.data);
        setOsintType(response.data.type);
        showToast("Pelacakan selesai!");
      } else {
        setOsintError(response.data.message);
      }
    } catch (error) {
      setOsintError("Terjadi kesalahan jaringan OSINT.");
    }
    setIsOsintRunning(false);
  };
  const runMalwareScan = async () => {
    setIsMalwareRunning(true);
    setMalwareResult(null);
    try {
      const response = await axios.post("/admin/cyber-security/malware-scan");
      setMalwareResult(response.data.infected_files);
      setScannedCount(response.data.scanned_count);
      showToast("Pemindaian mendalam selesai!");
    } catch (error) {
      alert("Gagal menjalankan pemindaian Malware!");
    }
    setIsMalwareRunning(false);
  };
  const deleteFile = async (path) => {
    if (!confirm("Yakin ingin memusnahkan file berbahaya ini dari server?")) return;
    try {
      const res = await axios.post("/admin/cyber-security/malware-delete", { path });
      if (res.data.status === "success") {
        showToast("File berhasil dimusnahkan!");
        setMalwareResult(malwareResult.filter((f) => f.path !== path));
      }
    } catch (e) {
      alert("Gagal menghapus file.");
    }
  };
  const unblockIp = async (id) => {
    try {
      await axios.post("/admin/cyber-security/unblock", { id });
      showToast("IP berhasil di-unblock!");
      router.reload();
    } catch (e) {
      alert("Gagal unblock IP.");
    }
  };
  const clearLogs = async () => {
    if (!confirm("Hapus seluruh log riwayat serangan?")) return;
    try {
      await axios.post("/admin/cyber-security/clear-logs");
      showToast("Log berhasil dibersihkan!");
      router.reload();
    } catch (e) {
      alert("Gagal membersihkan log.");
    }
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { user: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Pusat Keamanan Siber - CY STORE" }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#07090e] text-slate-200 p-4 md:p-8 font-mono pb-24", children: [
      toastMessage && /* @__PURE__ */ jsxs("div", { className: "fixed bottom-5 right-5 z-50 bg-emerald-500 text-slate-950 px-6 py-3 rounded-xl font-bold shadow-2xl border border-emerald-400 animate-bounce", children: [
        "⚡ ",
        toastMessage
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center mb-8 bg-[#111620] border border-slate-800 p-6 rounded-2xl shadow-2xl", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-emerald-500 animate-ping" }),
            /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-black text-emerald-400 tracking-wider", children: "CYBER COMMAND CENTER" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "NASA-Grade WAF, OSINT Tracker & Malware Hunter Active" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 md:mt-0 flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-[#181f2d] border border-rose-500/30 px-5 py-3 rounded-xl text-center shadow-inner", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-[10px] text-slate-400 uppercase tracking-widest", children: "Serangan Dicegat" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-rose-500", children: stats?.total_attacks || 0 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-[#181f2d] border border-amber-500/30 px-5 py-3 rounded-xl text-center shadow-inner", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-[10px] text-slate-400 uppercase tracking-widest", children: "IP Banned Active" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-amber-400", children: stats?.banned_ips || 0 })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-blue-400 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-satellite-dish" }),
            " OSINT / Digital Footprint Tracker"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-4", children: "Lacak jejak IP, bedah nomor HP penipu, atau cek reputasi Email di Dark Web." }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-4", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                value: osintTarget,
                onChange: (e) => setOsintTarget(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && runOsint(),
                type: "text",
                placeholder: "Ketik IP / No HP (0812...) / Email...",
                className: "w-full bg-[#181f2d] border border-slate-700 rounded-xl px-4 py-2.5 text-emerald-400 text-sm focus:border-blue-500 outline-none"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: runOsint,
                disabled: isOsintRunning,
                className: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase transition disabled:opacity-50",
                children: isOsintRunning ? "Melacak..." : "Lacak"
              }
            )
          ] }),
          osintError && /* @__PURE__ */ jsx("div", { className: "text-rose-400 text-xs mb-4 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20", children: osintError }),
          osintResult && /* @__PURE__ */ jsxs("div", { className: "bg-[#181f2d] border border-blue-500/30 p-4 rounded-xl text-xs text-slate-300", children: [
            osintType === "phone" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Nomor Target" }),
              /* @__PURE__ */ jsx("div", { className: "font-bold text-amber-400 text-sm", children: osintResult.phone }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Negara Asal" }),
              /* @__PURE__ */ jsx("div", { children: osintResult.country }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Jaringan / Operator" }),
              /* @__PURE__ */ jsx("div", { className: "font-bold text-blue-400", children: osintResult.provider }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Status Keamanan" }),
              /* @__PURE__ */ jsx("div", { children: osintResult.is_virtual ? /* @__PURE__ */ jsx("span", { className: "bg-rose-500/20 text-rose-400 px-2 py-1 rounded", children: "⚠️ Virtual Number / Scam" }) : /* @__PURE__ */ jsx("span", { className: "bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded", children: "✅ Nomor Registrasi Nasional" }) }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500 mt-2", children: "Lacak Nama Asli" }),
              /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx("a", { href: osintResult.getcontact_link, target: "_blank", className: "text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-lg", children: "🔍 Cek Tag GetContact" }) })
            ] }),
            osintType === "email" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Target Email" }),
              /* @__PURE__ */ jsx("div", { className: "font-bold text-blue-400", children: osintResult.email }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Reputasi" }),
              /* @__PURE__ */ jsx("div", { children: osintResult.suspicious ? /* @__PURE__ */ jsx("span", { className: "bg-rose-500/20 text-rose-400 px-2 py-1 rounded font-bold", children: "⚠️ MENCURIGAKAN" }) : /* @__PURE__ */ jsx("span", { className: "bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold", children: "✅ BAIK" }) }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Pernah Bocor?" }),
              /* @__PURE__ */ jsx("div", { children: osintResult.credentials_leaked ? "🔴 YA (Di Darkweb)" : "🟢 TIDAK" }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Akun Terhubung" }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: osintResult.profiles && osintResult.profiles.length > 0 ? osintResult.profiles.map((p) => /* @__PURE__ */ jsx("span", { className: "bg-slate-700 px-2 py-0.5 rounded text-[10px]", children: p }, p)) : "-" })
            ] }),
            osintType === "ip" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Target IP" }),
              /* @__PURE__ */ jsx("div", { className: "font-bold text-white font-mono", children: osintResult.query }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Lokasi" }),
              /* @__PURE__ */ jsxs("div", { children: [
                osintResult.city,
                ", ",
                osintResult.country
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "ISP / Jaringan" }),
              /* @__PURE__ */ jsx("div", { className: "truncate", children: osintResult.isp }),
              /* @__PURE__ */ jsx("div", { className: "text-slate-500", children: "Status Node" }),
              /* @__PURE__ */ jsx("div", { children: osintResult.proxy || osintResult.hosting ? /* @__PURE__ */ jsx("span", { className: "bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 text-[10px] font-bold", children: "⚠️ DATACENTER / VPN" }) : /* @__PURE__ */ jsx("span", { className: "bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px] font-bold", children: "✅ RESIDENTIAL (AMAN)" }) })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-purple-400 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-virus-covid-slash" }),
            " Deep Malware & Shell Hunter"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-4", children: "Pindai folder publik dan direktori upload dari script backdoor, trojan, dan gambar beracun." }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: runMalwareScan,
              disabled: isMalwareRunning,
              className: "w-full bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 shadow-lg shadow-purple-600/20 mb-4",
              children: isMalwareRunning ? "Menganalisis Direktori Server..." : "Mulai Pemindaian Mendalam"
            }
          ),
          malwareResult && /* @__PURE__ */ jsx("div", { children: malwareResult.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-center text-xs font-bold", children: [
            "✅ Sistem Bersih! ",
            scannedCount,
            " file telah dipindai tanpa ancaman."
          ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl max-h-40 overflow-y-auto", children: [
            /* @__PURE__ */ jsxs("strong", { className: "text-xs", children: [
              "⚠️ Ditemukan ",
              malwareResult.length,
              " Ancaman:"
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-2 text-xs", children: malwareResult.map((file, i) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between items-center bg-[#181f2d] p-2 rounded-lg border border-rose-500/30", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: file.file }),
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-rose-400 text-[10px]", children: file.threat })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => deleteFile(file.path), className: "px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase", children: "Hapus" })
            ] }, i)) })
          ] }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-black text-rose-400 uppercase tracking-widest border-l-4 border-rose-500 pl-3", children: "Live WAF Intercept Logs" }),
            recent_logs?.length > 0 && /* @__PURE__ */ jsx("button", { onClick: clearLogs, className: "px-3 py-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition border border-slate-700", children: "Bersihkan Log" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-[#181f2d] text-slate-400 uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-3", children: "Waktu" }),
              /* @__PURE__ */ jsx("th", { className: "p-3", children: "IP Penyerang" }),
              /* @__PURE__ */ jsx("th", { className: "p-3", children: "Pola Ancaman & Target" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-800/60", children: recent_logs?.length > 0 ? recent_logs.map((log) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-[#181f2d]/40", children: [
              /* @__PURE__ */ jsx("td", { className: "p-3 whitespace-nowrap text-slate-400", children: new Date(log.created_at).toLocaleTimeString("id-ID") }),
              /* @__PURE__ */ jsx("td", { className: "p-3 font-bold text-rose-400 font-mono", children: log.ip }),
              /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                /* @__PURE__ */ jsx("div", { className: "text-amber-400 font-bold", children: log.pattern }),
                /* @__PURE__ */ jsx("div", { className: "text-slate-500 truncate max-w-xs md:max-w-md", children: log.url })
              ] })
            ] }, log.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "3", className: "p-8 text-center text-slate-500 font-bold uppercase", children: "Belum ada serangan terekam." }) }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#111620] border border-slate-800 rounded-2xl p-6 shadow-xl", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-sm font-black text-amber-400 uppercase tracking-widest border-l-4 border-amber-400 pl-3 mb-4", children: [
            "Active Banned IPs (",
            banned_list?.length || 0,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-[380px] overflow-y-auto pr-1", children: banned_list?.length > 0 ? banned_list.map((banned) => /* @__PURE__ */ jsxs("div", { className: "bg-[#181f2d] border border-slate-800 p-3.5 rounded-xl flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-mono font-bold text-rose-400 text-xs", children: banned.ip }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]", children: banned.reason })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => unblockIp(banned.id),
                className: "px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition border border-emerald-500/30",
                children: "Unblock"
              }
            )
          ] }, banned.id)) : /* @__PURE__ */ jsx("div", { className: "text-center text-slate-500 text-xs py-10 uppercase font-bold", children: "Tidak ada IP terblokir" }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  Dashboard as default
};
