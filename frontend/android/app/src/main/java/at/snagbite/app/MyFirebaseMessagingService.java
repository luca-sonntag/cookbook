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
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "onMessageReceived triggered: " + remoteMessage.getData());

        Map<String, String> data = remoteMessage.getData();
        String title = data.get("title");
        String body = data.get("body");
        String imageUrl = data.get("imageUrl");
        if (imageUrl == null) imageUrl = data.get("image");

        if (title == null && body == null) {
            if (remoteMessage.getNotification() != null) {
                title = remoteMessage.getNotification().getTitle();
                body = remoteMessage.getNotification().getBody();
                if (remoteMessage.getNotification().getImageUrl() != null) {
                    imageUrl = remoteMessage.getNotification().getImageUrl().toString();
                }
            }
        }

        if (title == null && body == null) return;

        showNotification(title, body, imageUrl, data);
    }

    private void showNotification(String title, String body, String imageUrl, Map<String, String> data) {
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
            for (Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }

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

        if (imageUrl != null && !imageUrl.isEmpty()) {
            Bitmap bannerBitmap = fetchBitmap(imageUrl);
            if (bannerBitmap != null) {
                NotificationCompat.BigPictureStyle style = new NotificationCompat.BigPictureStyle()
                        .bigPicture(bannerBitmap)
                        .bigLargeIcon((Bitmap) null);
                builder.setStyle(style);
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
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            Log.e(TAG, "Failed to download notification image: " + e.getMessage());
            return null;
        }
    }
}
