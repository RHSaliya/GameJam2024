const CACHE = 'quarrel-cosmos-v4';
const SHELL = ['/', '/index.html', '/font.css', '/assets/menu-space-v2.png', '/assets/space/Spaceship.png'];
const NATIVE_WEBVIEW = self.navigator.userAgent.includes('; wv');

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => NATIVE_WEBVIEW || key !== CACHE).map(key => caches.delete(key)));
        if (NATIVE_WEBVIEW) await self.registration.unregister();
        await self.clients.claim();
        if (NATIVE_WEBVIEW) {
            const clients = await self.clients.matchAll({ type: 'window' });
            await Promise.all(clients.map(client => client.navigate(client.url)));
        }
    })());
});

self.addEventListener('fetch', event => {
    if (NATIVE_WEBVIEW || event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
    event.respondWith(caches.match(event.request).then(cached => {
        const network = fetch(event.request).then(response => {
            if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
            return response;
        }).catch(() => cached || caches.match('/index.html'));
        return cached || network;
    }));
});
