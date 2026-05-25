/* Civil-Eng-AI service worker — offline reading shell.
 *
 * Strategy:
 *  - Precache a minimal app shell (root html, css, fonts hint).
 *  - HTML requests: network-first, fall back to cached copy (or offline shell).
 *  - Same-origin static assets (css/js/png/svg/woff2/json/xml): stale-while-revalidate.
 *  - Cross-origin (CDN fonts, Font Awesome): cache-first.
 *
 * Bump CACHE_VERSION to invalidate previous caches.
 */
const CACHE_VERSION = 'v1-2026-05-25';
const STATIC_CACHE = 'ceai-static-' + CACHE_VERSION;
const PAGES_CACHE = 'ceai-pages-' + CACHE_VERSION;
const RUNTIME_CACHE = 'ceai-runtime-' + CACHE_VERSION;

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/404.html',
    '/css/theme.css',
    '/css/style.css',
    '/css/chapters.css',
    '/css/enhancements.css',
    '/js/theme.js',
    '/js/main.js',
    '/js/sub-common.js',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => { /* some may 404, ignore */ }))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => !k.endsWith(CACHE_VERSION)).map((k) => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

function isHtmlRequest(req) {
    if (req.mode === 'navigate') return true;
    const accept = req.headers.get('accept') || '';
    return accept.includes('text/html');
}

function isStaticAsset(url) {
    return /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|json|xml|ico)$/i.test(url.pathname);
}

async function networkFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
    } catch (err) {
        const cached = await cache.match(req);
        if (cached) return cached;
        // Offline fallback
        const fallback = await cache.match('/index.html') || await caches.match('/index.html');
        if (fallback) return fallback;
        return new Response('<h1>Offline</h1><p>This page is not available offline yet.</p>', {
            status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

async function staleWhileRevalidate(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    const networkPromise = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
    }).catch(() => null);
    return cached || networkPromise || new Response('', { status: 504 });
}

async function cacheFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    if (url.origin === self.location.origin) {
        if (isHtmlRequest(req)) {
            event.respondWith(networkFirst(req, PAGES_CACHE));
            return;
        }
        if (isStaticAsset(url)) {
            event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
            return;
        }
        return; // default network handling
    }

    // Cross-origin: cache-first for fonts & FA, otherwise default
    if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host)) {
        event.respondWith(cacheFirst(req, RUNTIME_CACHE));
    }
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
