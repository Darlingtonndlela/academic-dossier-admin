// Keeps the app shell available offline. Pages and files are always fetched fresh
// when online; your data itself always comes live from the Google Sheet.
const CACHE = "nucleus-cv-v1";
const SHELL = ["admin.html", "admin.css", "admin.js", "cv.css", "cv.js", "manifest.webmanifest", "icons/icon-192.png"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
    e.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
    const url = new URL(e.request.url);
    if (e.request.method !== "GET" || url.origin !== location.origin) return; // Apps Script, fonts, etc. go straight to the network

    e.respondWith(fetch(e.request)
        .then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
            return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
