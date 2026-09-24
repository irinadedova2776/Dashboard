const CACHE = 'strategy-2026-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    // Навигация (открытие страниц): сначала сеть, офлайн — кэш
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put('./index.html', copy));
                    return res;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Остальное (скрипты Firebase, иконки): сначала кэш, потом сеть
    e.respondWith(
        caches.match(e.request).then(hit => hit ||
            fetch(e.request).then(res => {
                const ok = res.ok && (
                    e.request.url.startsWith(self.location.origin) ||
                    e.request.url.includes('gstatic.com')
                );
                if (ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, copy));
                }
                return res;
            })
        )
    );
});