// LY10 reliability reset.
// This worker intentionally does not intercept network requests.
// It removes the earlier offline cache layer that could cause Safari/iOS
// to report "network connection was lost" on otherwise working connections.

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ly10-')).map(key => caches.delete(key)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
