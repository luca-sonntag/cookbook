package at.snagbite.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFcmService";
    private static final String CHANNEL_ID = "ai-suggestions";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "onNewToken triggered: " + token);
        PushNotificationsPlugin.onNewToken(token);
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "onMessageReceived triggered: " + remoteMessage.getData());

        // Forward to Capacitor plugin so in-app listeners fire if app is open
        PushNotificationsPlugin.sendRemoteMessage(remoteMessage);

        // Don't post a system notification while the app is in the foreground —
        // the UI already reacts to the in-app event (job polling / banner).
        if (isAppInForeground()) {
            Log.d(TAG, "App is in foreground — skipping system notification");
            return;
        }

        Map<String, String> data = remoteMessage.getData();
        String title = data.get("title");
        String body = data.get("body");

        if (title == null && body == null) {
            if (remoteMessage.getNotification() != null) {
                title = remoteMessage.getNotification().getTitle();
                body = remoteMessage.getNotification().getBody();
            }
        }

        if (title == null && body == null) return;

        showNotification(title, body, data, remoteMessage);
    }

    /** Returns true when this process is currently visible to the user. */
    private boolean isAppInForeground() {
        android.app.ActivityManager activityManager =
                (android.app.ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (activityManager == null) return false;
        java.util.List<android.app.ActivityManager.RunningAppProcessInfo> processes =
                activityManager.getRunningAppProcesses();
        if (processes == null) return false;
        String packageName = getPackageName();
        for (android.app.ActivityManager.RunningAppProcessInfo process : processes) {
            if (process.importance ==
                    android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                && java.util.Arrays.asList(process.pkgList).contains(packageName)) {
                return true;
            }
        }
        return false;
    }

    private void showNotification(String title, String body, Map<String, String> data, RemoteMessage remoteMessage) {
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Recipe suggestions",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Personalized recipe ideas from your cookbook");
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (data != null) {
            android.os.Bundle dataBundle = new android.os.Bundle();
            for (Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
                dataBundle.putString(entry.getKey(), entry.getValue());
            }
            intent.putExtra("data", dataBundle);
            intent.putExtra("pushNotificationData", dataBundle);
        }

        // Essential FCM identification extras required by Capacitor's PushNotificationsPlugin
        // to recognize the intent as a notification tap event and trigger pushNotificationActionPerformed
        String msgId = remoteMessage != null && remoteMessage.getMessageId() != null
                ? remoteMessage.getMessageId()
                : "msg_" + System.currentTimeMillis();
        intent.putExtra("google.message_id", msgId);
        intent.putExtra("message_id", msgId);
        intent.putExtra("google.sent_time", System.currentTimeMillis());

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                (int) System.currentTimeMillis(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_icon)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        String iconUrl = data != null ? data.get("iconUrl") : null;
        if (iconUrl != null && !iconUrl.isEmpty()) {
            Bitmap iconBitmap = fetchBitmap(iconUrl);
            if (iconBitmap != null) {
                builder.setLargeIcon(iconBitmap);
            }
        }

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }

    private Bitmap fetchBitmap(String src) {
        try {
            URL url = new URL(src);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.connect();
            int resCode = connection.getResponseCode();
            if (resCode != 200) {
                Log.e(TAG, "HTTP " + resCode + " downloading image: " + src);
                return null;
            }
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            Log.e(TAG, "Failed to download notification image: " + e.getMessage());
            return null;
        }
    }
}
