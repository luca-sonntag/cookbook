// Custom service worker for Snagbite PWA
// Handles notification clicks for cooking timers

// The precache manifest will be injected here by vite-plugin-pwa
// @ts-ignore - __WB_MANIFEST is injected at build time
const manifest = self.__WB_MANIFEST;

// ─── Notification Click Handler ───────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const recipeId = data.recipeId;
  const stepNum = data.stepNum;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            recipeId,
            stepNum,
          });
          return;
        }
      }

      // No existing window — open a new one
      if (self.clients.openWindow) {
        const newClient = await self.clients.openWindow('/');
        if (newClient) {
          // Wait a moment for the app to initialize, then post the message
          // The app will listen for this message once it loads
          setTimeout(() => {
            newClient.postMessage({
              type: 'NOTIFICATION_CLICK',
              recipeId,
              stepNum,
            });
          }, 2000);
        }
      }
    })()
  );
});

// ─── Push Event (future-proofing) ─────────────────────────────────────────────

self.addEventListener('push', (event) => {
  // Placeholder for future push notification support
  if (event.data) {
    try {
      const payload = event.data.json();
      event.waitUntil(
        self.registration.showNotification(payload.title || 'Snagbite', {
          body: payload.body || '',
          icon: '/icon-512.png',
          badge: '/icon-192.png',
          tag: payload.tag || 'cooking-timer',
          vibrate: [200, 100, 200, 100, 400],
          data: payload.data || {},
          requireInteraction: true,
        })
      );
    } catch {
      // Ignore malformed push payloads
    }
  }
});