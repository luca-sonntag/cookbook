import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Single source of truth for the user-facing app version: the same
// android/version.properties the release script (scripts/release.ps1) bumps and
// Gradle reads for the Play Store build. Injected at build time so web and
// native stay in sync without a hardcoded string.
const configDir = dirname(fileURLToPath(import.meta.url))
function readAppVersion(): { name: string; code: string } {
  try {
    const text = readFileSync(resolve(configDir, 'android/version.properties'), 'utf-8')
    const name = text.match(/VERSION_NAME=(.+)/)?.[1]?.trim() ?? '0.0.0'
    const code = text.match(/VERSION_CODE=(.+)/)?.[1]?.trim() ?? '0'
    return { name, code }
  } catch {
    return { name: '0.0.0', code: '0' }
  }
}
const appVersion = readAppVersion()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion.name),
    __APP_BUILD__: JSON.stringify(appVersion.code),
  },
  server: {
    // Bind to 0.0.0.0 so a physical device / emulator can reach the dev server
    // during Capacitor live-reload (`npm run cap:live`).
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Use injectManifest to include our custom sw.js with notificationclick handler
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      manifest: {
        name: 'Snagbite - Dein Reel-Rezeptbuch',
        short_name: 'Snagbite',
        description: 'Verwandle Instagram Reels in interaktive Kochrezepte',
        theme_color: '#064e3b',
        background_color: '#064e3b',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/share',
          method: 'GET',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      }
    })
  ]
})
