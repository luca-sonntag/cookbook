import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kochbuddy.app',
  appName: 'KochBuddy',
  // Vite's build output directory — Capacitor copies this into the native app.
  webDir: 'dist',
};

export default config;
