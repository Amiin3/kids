#!/bin/bash
while true; do
    # Tembak jalur tikus VIP secara diam-diam (ke dev/null biar gak menuhin log)
    curl -s -A "WarEngine-Auto" https://milastore.cloud/api/war-machine/trigger > /dev/null
    # Jeda 2 detik sebelum nembak lagi (agar VPS tidak jebol)
    sleep 2
done
