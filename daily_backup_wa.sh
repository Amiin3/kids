#!/bin/bash

# LOAD CONFIG DARI .ENV
source /www/wwwroot/milastore.cloud/.env

# SETTING NAMA FILE & TUJUAN
DATE=$(date +%Y%m%d_%H%M)
FILE_NAME="MilaStore_DB_$DATE.sql.gz"
BACKUP_PATH="/www/wwwroot/milastore.cloud/storage/backups/$FILE_NAME"
ADMIN_WA="0859106609838"
API_KEY="MILA_SEC_v9B4xK8mP2qL7jW5nC3zR1hT6fD0yX5g"

# BUAT FOLDER BACKUP JIKA BELUM ADA
mkdir -p /www/wwwroot/milastore.cloud/storage/backups/

# PROSES DUMP DATABASE & COMPRESS
mysqldump --no-tablespaces -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" 2>/dev/null | gzip > "$BACKUP_PATH"

# VERIFIKASI UKURAN FILE
FILE_SIZE_BYTES=$(stat -c%s "$BACKUP_PATH" 2>/dev/null || echo 0)
FILE_SIZE_HUMAN=$(du -h "$BACKUP_PATH" | awk '{print $1}')

if [ "$FILE_SIZE_BYTES" -lt 1000 ]; then
  CAPTION="🚨 *ALARM! BACKUP GAGAL KOSONG!* 🚨\nDatabase $DB_DATABASE gagal ditarik. Segera cek server Bosku!"
else
  # 🚀 JUDUL DIUPDATE JADI PERIODIC BACKUP (2 JAM SEKALI)
  CAPTION="📦 *PERIODIC BACKUP MILASTORE*\n📅 Tanggal: $(date '+%d %B %Y')\n⏰ Waktu: $(date '+%H:%M') WIB\n💾 Ukuran: *$FILE_SIZE_HUMAN*\n\n_Data terproteksi setiap 2 jam sekali!_"
fi

# KIRIM KE WHATSAPP ADMIN VIA BOT
curl -s -X POST http://127.0.0.1:3333/send-file \
  -H "Content-Type: application/json" \
  -d "{
    \"target\": \"$ADMIN_WA\",
    \"filePath\": \"$BACKUP_PATH\",
    \"fileName\": \"$FILE_NAME\",
    \"caption\": \"$CAPTION\",
    \"key\": \"$API_KEY\"
  }"
