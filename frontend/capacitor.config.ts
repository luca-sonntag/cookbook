import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'at.snagbite.app',
  appName: 'Snagbite',
  // Vite's build output directory — Capacitor copies this into the native app.
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // Match the app's brand color (#064e3b). We hide the splash manually from
      // JS once React has mounted, so keep autoHide off.
      launchAutoHide: false,
      backgroundColor: '#064e3b',
      androidSplashResourceName: 'splash',
      showSpinner: true,
    },
  },
};

export default config;
