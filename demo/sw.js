const VERSION = "bfc-demo-v2";
const ASSETS = ["./", "./index.html", "./offline.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("message", (e) => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const u = new URL(req.url);
  const remoteImg = req.destination === "image" && /(^|\.)berberfc\.com$/.test(u.hostname);
  if (req.method !== "GET" || (u.origin !== location.origin && !remoteImg)) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { caches.open(VERSION).then((c) => c.put(req, r.clone())); return r; })
      .catch(() => caches.match(req).then((r) => r || caches.match("./offline.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    caches.open(VERSION).then((c) => c.put(req, r.clone())); return r;
  })));
});
