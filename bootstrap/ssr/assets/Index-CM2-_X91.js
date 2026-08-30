import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { A as AuthenticatedLayout } from "./AuthenticatedLayout-BMtUGg5W.js";
import { Head } from "@inertiajs/react";
import "moment";
function WhatsAppIndex(props) {
  const [loginMethod, setLoginMethod] = useState("pairing");
  const [botState, setBotState] = useState({
    status: "OFFLINE",
    number: null,
    queue_count: 0,
    uptime: 0,
    memory: "0 MB",
    qr: null
  });
  const [logs, setLogs] = useState([]);
  const [phone, setPhone] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("⚡ Tes Notifikasi WhatsApp MilaStore Berhasil!");
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const logContainerRef = useRef(null);
  const fetchStatusAndLogs = async () => {
    try {
      const [resStatus, resLogs] = await Promise.all([
        axios.get("/admin/whatsapp/status"),
        axios.get("/admin/whatsapp/logs")
      ]);
      if (resStatus.data) setBotState(resStatus.data);
      if (resLogs.data && resLogs.data.logs) setLogs(resLogs.data.logs);
    } catch (e) {
    }
  };
  useEffect(() => {
    fetchStatusAndLogs();
    const interval = setInterval(fetchStatusAndLogs, 2500);
    return () => clearInterval(interval);
  }, []);
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    return `${h}j ${m}m ${s}d`;
  };
  const handleRequestPairing = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActionMsg(null);
    setPairingCode("");
    try {
      const res = await axios.post("/admin/whatsapp/pairing", { phone });
      if (res.data.status && res.data.code) {
        setPairingCode(res.data.code);
        setActionMsg({ type: "success", text: `Kode Pairing Berhasil Dibuat: ${res.data.code}` });
      } else {
        setActionMsg({ type: "error", text: res.data.message || "Gagal membuat kode pairing." });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Koneksi ke gateway bot gagal." });
    } finally {
      setLoading(false);
    }
  };
  const handleSendTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActionMsg(null);
    try {
      const res = await axios.post("/admin/whatsapp/send-test", {
        phone: testPhone,
        message: testMessage
      });
      if (res.data.status) {
        setActionMsg({ type: "success", text: res.data.message });
      } else {
        setActionMsg({ type: "error", text: res.data.message });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Gagal mengirim pesan." });
    } finally {
      setLoading(false);
    }
  };
  const handleResetSession = async () => {
    if (!confirm("Apakah Anda yakin ingin MERESET TOTAL sesi WhatsApp? Sesi akan diputus dan data login dibersihkan.")) return;
    setLoading(true);
    setActionMsg(null);
    setPairingCode("");
    try {
      const res = await axios.post("/admin/whatsapp/logout");
      setActionMsg({ type: "success", text: res.data.message || "Sesi berhasil direset total!" });
      fetchStatusAndLogs();
    } catch (err) {
      setActionMsg({ type: "error", text: "Gagal mereset sesi." });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(AuthenticatedLayout, { auth: props.auth, errors: props.errors, children: [
    /* @__PURE__ */ jsx(Head, { title: "WhatsApp Command Center" }),
    /* @__PURE__ */ jsxs("div", { className: "py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-black text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "p-2 bg-emerald-500/20 text-emerald-400 rounded-xl", children: "📱" }),
            "WhatsApp Command Center"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Live Monitor Sesi, Antrean Transaksi, dan Gateway Notifikasi" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 md:mt-0 flex items-center gap-3", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleResetSession,
            disabled: loading,
            className: "px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold rounded-xl text-sm transition flex items-center gap-2",
            children: "🔄 Reset Sesi"
          }
        ) })
      ] }),
      actionMsg && /* @__PURE__ */ jsx("div", { className: `p-4 rounded-xl text-sm font-medium border ${actionMsg.type === "success" ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" : "bg-red-950/40 border-red-500/30 text-red-400"}`, children: actionMsg.text }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-900 border border-gray-800 p-4 rounded-xl", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Status Sesi" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `w-3 h-3 rounded-full ${botState.status === "ONLINE" ? "bg-emerald-400 animate-pulse" : botState.status === "SCAN_QR" ? "bg-amber-400 animate-ping" : "bg-red-500"}` }),
            /* @__PURE__ */ jsx("span", { className: `text-lg font-bold ${botState.status === "ONLINE" ? "text-emerald-400" : botState.status === "SCAN_QR" ? "text-amber-400" : "text-red-400"}`, children: botState.status })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 mt-1 block", children: botState.number ? `+${botState.number}` : "Belum Login" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-900 border border-gray-800 p-4 rounded-xl", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Antrean Notif" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xl font-black text-white", children: [
            botState.queue_count,
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-gray-400", children: "Pesan" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 mt-1 block", children: "Otomatis Eksekusi" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-900 border border-gray-800 p-4 rounded-xl", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "RAM Gateway" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-black text-cyan-400", children: botState.memory }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 mt-1 block", children: "Memory RSS Node.js" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-900 border border-gray-800 p-4 rounded-xl", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Uptime Bot" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-black text-amber-400", children: formatUptime(botState.uptime) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 mt-1 block", children: "Waktu Berjalan" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-white mb-4 flex items-center gap-2", children: "🔑 Sambungkan Perangkat" }),
          botState.status === "ONLINE" ? /* @__PURE__ */ jsxs("div", { className: "p-8 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "text-5xl", children: "✅" }),
            /* @__PURE__ */ jsx("div", { className: "text-emerald-400 font-bold text-lg", children: "WhatsApp Terhubung Aktif" }),
            /* @__PURE__ */ jsxs("div", { className: "text-gray-400 text-sm", children: [
              "Nomor Bot: ",
              /* @__PURE__ */ jsxs("b", { className: "text-white", children: [
                "+",
                botState.number
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 pt-2", children: "Gateway siap menembak notifikasi transaksi dan broadcast." })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex bg-gray-950 p-1 rounded-xl border border-gray-800", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setLoginMethod("pairing"),
                  className: `flex-1 py-2 text-xs font-bold rounded-lg transition ${loginMethod === "pairing" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"}`,
                  children: "🔢 Opsi 1: Kode Pairing"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setLoginMethod("qr"),
                  className: `flex-1 py-2 text-xs font-bold rounded-lg transition ${loginMethod === "qr" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"}`,
                  children: "📷 Opsi 2: Scan QR Barcode"
                }
              )
            ] }),
            loginMethod === "pairing" && /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2", children: [
              /* @__PURE__ */ jsxs("form", { onSubmit: handleRequestPairing, className: "space-y-3", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-300", children: "Masukkan Nomor WhatsApp yang Ingin Dijadikan Bot:" }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 081234567890 / 6281234567890",
                      value: phone,
                      onChange: (e) => setPhone(e.target.value),
                      className: "flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500",
                      required: true
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "submit",
                      disabled: loading,
                      className: "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition disabled:opacity-50",
                      children: loading ? "Proses..." : "Minta Kode"
                    }
                  )
                ] })
              ] }),
              pairingCode && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-1 mt-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 block", children: "Masukkan 8 Digit Kode Ini di WhatsApp HP Anda:" }),
                /* @__PURE__ */ jsx("span", { className: "text-3xl font-mono font-black text-emerald-400 tracking-widest selection:bg-emerald-500 selection:text-black", children: pairingCode }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block pt-1", children: "Buka WhatsApp > Perangkat Tertaut > Tautkan dengan Nomor Telepon Saja" })
              ] })
            ] }),
            loginMethod === "qr" && /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center justify-center p-6 bg-gray-950 rounded-xl border border-gray-800 text-center space-y-3", children: botState.qr ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("img", { src: botState.qr, alt: "Scan QR WhatsApp", className: "w-52 h-52 rounded-xl bg-white p-2 shadow-lg" }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-400", children: [
                "Buka WhatsApp > Titik 3 di kanan atas > ",
                /* @__PURE__ */ jsx("b", { children: "Perangkat Tertaut" }),
                " > ",
                /* @__PURE__ */ jsx("b", { children: "Tautkan Perangkat" })
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "py-12 space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "text-3xl animate-spin", children: "⏳" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-gray-300", children: "Menyiapkan QR Code Baru..." }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: "Jika tidak muncul dalam beberapa detik, klik tombol Reset Sesi." })
            ] }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-white mb-4 flex items-center gap-2", children: "✉️ Uji Coba Kirim Pesan" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSendTest, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-300 mb-1", children: "Nomor Tujuan Uji Coba" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Contoh: 081234567890",
                  value: testPhone,
                  onChange: (e) => setTestPhone(e.target.value),
                  className: "w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-300 mb-1", children: "Isi Pesan" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  rows: "3",
                  value: testMessage,
                  onChange: (e) => setTestMessage(e.target.value),
                  className: "w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: loading || botState.status !== "ONLINE",
                className: `w-full py-2.5 rounded-xl font-bold text-sm transition ${botState.status === "ONLINE" ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "bg-gray-800 text-gray-500 cursor-not-allowed"}`,
                children: botState.status === "ONLINE" ? "Kirim Pesan Uji Coba" : "WhatsApp Belum Terhubung"
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-gray-900 border border-gray-800 p-6 rounded-2xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-white flex items-center gap-2", children: "📟 Live Console Logs (Real-time)" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs bg-gray-800 text-emerald-400 px-3 py-1 rounded-full font-mono flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping" }),
            " Live Polling"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: logContainerRef, className: "bg-black border border-gray-800 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-1.5", children: logs.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-gray-600 text-center py-10", children: "Menunggu stream aktivitas log bot..." }) : logs.map((log, idx) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-gray-500", children: [
            "[",
            log.time,
            "]"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `font-bold ${log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-emerald-400"}`, children: [
            "[",
            log.type.toUpperCase(),
            "]"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: log.message })
        ] }, idx)) })
      ] })
    ] })
  ] });
}
export {
  WhatsAppIndex as default
};
