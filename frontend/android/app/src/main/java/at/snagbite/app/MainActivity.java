package at.snagbite.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Safety net: if React never mounts (e.g. JS hydration error) we still hide
    // the splash after 6s so the user isn't trapped. See AGENTS.md "Splash-Hang".
    private static final long SPLASH_SAFETY_TIMEOUT_MS = 6000L;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable splashSafetyTimeout = new Runnable() {
        @Override
        public void run() {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView wv = getBridge().getWebView();
                    // Call the @capacitor/splash-screen plugin's hide() via JS, which
                    // dismisses both the native AndroidX splash and the WebView overlay.
                    wv.evaluateJavascript(
                        "(function(){try{if(window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.SplashScreen){Capacitor.Plugins.SplashScreen.hide().catch(function(){});}else{document.querySelector('html').classList.remove('splash-hide');}}catch(e){}})();",
                        null
                    );
                }
            } catch (Throwable ignored) { }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mainHandler.postDelayed(splashSafetyTimeout, SPLASH_SAFETY_TIMEOUT_MS);
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacks(splashSafetyTimeout);
        super.onDestroy();
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
