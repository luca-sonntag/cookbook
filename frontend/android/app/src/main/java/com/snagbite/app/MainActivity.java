package com.snagbite.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        publishSafeAreaInsets();
    }

    /**
     * Android WebViews report env(safe-area-inset-bottom) as 0 even under
     * edge-to-edge, so bottom-anchored web UI ends up under the gesture/nav bar.
     * Read the real system-bar bottom inset and expose it to CSS as
     * --safe-area-inset-bottom (in CSS px). The listener re-fires on rotation
     * and navigation-mode changes, keeping the value current.
     */
    private void publishSafeAreaInsets() {
        if (getBridge() == null) return;
        final WebView webView = getBridge().getWebView();
        if (webView == null) return;

        final float density = getResources().getDisplayMetrics().density;
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            float bottom = bars.bottom / density;
            String js = "document.documentElement.style.setProperty("
                    + "'--safe-area-inset-bottom','" + bottom + "px');";
            webView.evaluateJavascript(js, null);
            return insets;
        });
        ViewCompat.requestApplyInsets(webView);
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent); // so checkSendIntentReceived() reads the new share, not the launch intent
        if (getBridge() != null) {
            getBridge().triggerWindowJSEvent("sendIntentReceived");
        }
    }
}
