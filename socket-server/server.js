const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// 📡 SENSOR RADAR (Bisa dicek kapan saja lewat browser)
app.get('/status-radar', (req, res) => {
    res.json({
        status: "TOWER AKTIF 🟢",
        total_hp_tersambung: io.engine.clientsCount,
        waktu_cek: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    });
});

// 🛡️ API TRIGGER (DIKUNCI HANYA UNTUK LARAVEL LOKAL)
app.post('/trigger-notif', (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!clientIp.includes('127.0.0.1') && !clientIp.includes('::1')) {
        return res.status(403).json({ error: "Akses Ditolak!" });
    }
    const { judul, pesan, url } = req.body;
    io.emit('notif_global', { judul, pesan, url });
    console.log(`[MILASTORE TOWER] Rudal meluncur ke ${io.engine.clientsCount} Device!`);
    res.json({ success: true, target_tercapai: io.engine.clientsCount });
});

io.on('connection', (socket) => {
    // Biarkan kosong agar server tidak lag saat member membludak
});

server.listen(3001, '0.0.0.0', () => {
    console.log('🚀 TOWER MILASTORE BERHASIL DIPASANG RADAR!');
});
