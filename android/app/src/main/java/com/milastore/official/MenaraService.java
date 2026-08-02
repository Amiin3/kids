package com.milastore.official;

import android.app.*;
import android.content.*;
import android.media.RingtoneManager;
import android.os.*;
import androidx.core.app.NotificationCompat;
import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONObject;

public class MenaraService extends Service {
    private Socket mSocket;
    private static final String CH_ID = "mila_official_bg";

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel c = new NotificationChannel(CH_ID, "MILASTORE System", NotificationManager.IMPORTANCE_MIN);
            c.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(c);
        }
        
        int iconId = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (iconId == 0) iconId = android.R.drawable.ic_dialog_info;

        startForeground(999, new NotificationCompat.Builder(this, CH_ID)
            .setContentTitle("MILASTORE Siaga")
            .setContentText("Menjaga kelancaran transaksi Anda...")
            .setSmallIcon(iconId).build());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        connectSocket();
        return START_STICKY;
    }

    private void connectSocket() {
        if (mSocket != null && mSocket.connected()) return;
        try {
            IO.Options opts = new IO.Options();
            opts.reconnection = true;
            
            // JALUR TOL LANGSUNG KE IP VPS (BEBAS HAMBATAN)
            mSocket = IO.socket("http://159.223.185.13:3001", opts);
            
            mSocket.on("notif_global", args -> {
                try {
                    JSONObject d = args[0] instanceof JSONObject ? (JSONObject) args[0] : new JSONObject(args[0].toString());
                    showRealNotification(d.optString("judul", "MILASTORE"), d.optString("pesan", "Pemberitahuan Baru"));
                } catch(Exception e){}
            });
            mSocket.connect();
        } catch(Exception e){}
    }

    private void showRealNotification(String title, String msg) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(new NotificationChannel("mila_official_real", "Transaksi", NotificationManager.IMPORTANCE_HIGH));
        }
        
        int iconId = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (iconId == 0) iconId = android.R.drawable.ic_dialog_info;

        nm.notify((int)System.currentTimeMillis(), new NotificationCompat.Builder(this, "mila_official_real")
            .setSmallIcon(iconId)
            .setContentTitle(title)
            .setContentText(msg)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
            .build());
    }
    
    @Override public IBinder onBind(Intent i) { return null; }
}
