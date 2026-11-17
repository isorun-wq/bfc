/* BFC service worker – cache versionné, hors-ligne, mises à jour propres */
const VERSION = "bfc-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const API_CACHE = `${VERSION}-api`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((c) => c.addAll([OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"]))
  );
  // La nouvelle version attend le message SKIP_WAITING (voir PWARegister)
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function limitCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    await cache.delete(keys[0]);
    return limitCache(name, max);
  }
}

// Stale-while-revalidate : réponse immédiate depuis le cache + mise à jour en fond
async function staleWhileRevalidate(request, cacheName, max = 80) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) {
        cache.put(request, res.clone()).then(() => limitCache(cacheName, max));
      }
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

// Network-first : données fraîches, cache en secours
async function networkFirst(request, cacheName, max = 40) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) {
      cache.put(request, res.clone()).then(() => limitCache(cacheName, max));
    }
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // on ne touche pas aux ressources tierces

  // Navigations (pages HTML) : réseau d'abord, puis cache, puis page hors-ligne
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          const res = preload || (await fetch(request));
          const cache = await caches.open(PAGES_CACHE);
          cache.put(request, res.clone()).then(() => limitCache(PAGES_CACHE, 30));
          return res;
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  // API BFC : réseau d'abord (résultats/événements à jour), cache en secours
  if (url.pathname.startsWith("/bfc-api/") && !url.pathname.startsWith("/bfc-api/uploads/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Assets statiques, images, uploads, polices : stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/bfc-api/uploads/") ||
    /\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE, 120));
  }
});

// Notifications push (optionnel – nécessite un backend Web Push)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "BFC", {
      body: data.body || "Nouveau contenu BFC",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) { c.navigate(target); return c.focus(); }
      return self.clients.openWindow(target);
    })
  );
});
