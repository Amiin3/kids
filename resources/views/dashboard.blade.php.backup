<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Friends VPS</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0b0e11; --bg-card: #151a21; --text-gray: #848e9c;
            --text-light: #eaecef; --up: #0ecb81; --down: #f6465d;
            --primary: #3b82f6; --orange: #f97316; --blue: #3b82f6;
            --purple: #a855f7; --cyan: #06b6d4; --pink: #ec4899;
        }
        body { background-color: var(--bg-dark); color: var(--text-light); font-family: 'Rajdhani', sans-serif; padding-bottom: 60px; }
        .navbar-custom { background: var(--bg-card); border-bottom: 1px solid #2b3139; padding: 15px 0; }
        .brand-logo { font-size: 22px; font-weight: 700; color: var(--primary); text-decoration: none; letter-spacing: 1px; }
        .menu-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
        .menu-box {
            background: #1e2329; border-radius: 8px; padding: 18px 10px;
            text-align: center; text-decoration: none; color: var(--text-gray);
            border: 1px solid transparent; transition: 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .menu-box:hover { background: #2b3139; color: var(--primary); border-color: var(--text-gray); transform: scale(1.02); }
        .menu-icon { font-size: 22px; margin-bottom: 8px; display: block; }
        .menu-text { font-size: 10px; font-weight: 700; text-transform: uppercase; }
        @media (max-width: 768px) { .menu-grid { grid-template-columns: repeat(2, 1fr); } }
    </style>
</head>
<body>
    <nav class="navbar-custom sticky-top">
        <div class="container d-flex justify-content-between align-items-center">
            <a href="#" class="brand-logo"><i class="fa-solid fa-server me-2"></i>FRIENDS<span class="text-white">VPS</span></a>
            <div class="d-flex align-items-center gap-3">
                <a href="#" class="text-light text-decoration-none small fw-bold"><i class="fa-solid fa-globe"></i> WEB</a>
                <a href="#" class="text-danger text-decoration-none small fw-bold"><i class="fa-solid fa-power-off"></i> EXIT</a>
            </div>
        </div>
    </nav>
    <div class="container py-4">
        <h6 class="mt-2 mb-3" style="color:var(--primary); font-weight:700; border-left:4px solid var(--primary); padding-left:10px;">MANAGEMENT CONSOLE</h6>
        <div class="menu-grid">
            <a href="kelola_produk.php" class="menu-box" style="border: 1px dashed var(--orange);"><i class="fa-solid fa-box-open menu-icon" style="color:var(--orange)"></i><span class="menu-text text-warning">Kelola Produk</span></a>
            <a href="kelola_stok.php" class="menu-box" style="border: 1px dashed #0ecb81;"><i class="fa-solid fa-boxes-stacked menu-icon" style="color:#0ecb81"></i><span class="menu-text text-success">Input Stok</span></a>
            <a href="transaksi.php" class="menu-box"><i class="fa-solid fa-receipt menu-icon" style="color:#fff"></i><span class="menu-text">Riwayat Trx</span></a>
            <a href="deposits.php" class="menu-box"><i class="fa-solid fa-money-bill-transfer menu-icon" style="color:var(--primary)"></i><span class="menu-text">Deposit</span></a>
            <a href="kelola_promo.php" class="menu-box"><i class="fa-solid fa-bullhorn menu-icon" style="color:#f59e0b"></i><span class="menu-text">Update Promo</span></a>
            <a href="users.php" class="menu-box"><i class="fa-solid fa-users-gear menu-icon" style="color:var(--purple)"></i><span class="menu-text">Data Member</span></a>
            <a href="admin_tema.php" class="menu-box"><i class="fa-solid fa-palette menu-icon" style="color:var(--pink)"></i><span class="menu-text">Tema</span></a>
            <a href="/admin/keuangan" class="menu-box"><i class="fa-solid fa-sack-dollar menu-icon" style="color:var(--blue)"></i><span class="menu-text text-info">Keuangan</span></a>
            
            <a href="/admin/akrab" class="menu-box" style="border: 1px dashed var(--cyan);"><i class="fa-solid fa-network-wired menu-icon" style="color:var(--cyan)"></i><span class="menu-text text-info">Kelola Akrab</span></a>
            <a href="/order/akrabnew" class="menu-box" style="border: 1px dashed var(--purple); background: rgba(168, 85, 247, 0.05);"><i class="fa-solid fa-wifi menu-icon" style="color:var(--purple)"></i><span class="menu-text" style="color:#d8b4fe">Order Akrab</span></a>
        </div>

        <h6 class="mt-5 mb-3" style="color:#0ecb81; font-weight:700; border-left:4px solid #0ecb81; padding-left:10px;">DATA PRODUK DIGIFLAZZ</h6>
        <div class="table-responsive" style="background: #151a21; border-radius: 12px; border: 1px solid #2b3139; padding: 15px;">
            <table class="table table-dark table-hover mb-0" style="font-size: 14px;">
                <thead>
                    <tr>
                        <th style="color: var(--text-gray);">LAYANAN / PRODUK</th>
                        <th style="color: var(--text-gray);">SKU DIGIFLAZZ</th>
                        <th style="color: var(--text-gray);">HARGA</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($products as $p)
                    <tr>
                        <td class="text-light fw-bold">{{ $p->layanan ?? $p->product_name ?? 'Tanpa Nama' }}</td>
                        <td class="text-muted" style="font-family: 'Roboto Mono', monospace;">{{ $p->kode ?? $p->buyer_sku_code ?? '-' }}</td>
                        <td class="text-success fw-bold">Rp {{ number_format($p->harga ?? $p->price ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="3" class="text-center text-muted py-4">Data Produk Digiflazz belum tersedia (Belum disinkronisasi).</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="text-center mt-5 mb-3 text-gray small">
            FRIENDS VPS SYSTEM &bull; <span class="text-success">STOK MANUAL AKTIF</span>
        </div>
    </div>
</body>
</html>
