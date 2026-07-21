// Service Worker fuer Amelies Lernapp.
//
// Zwei Aufgaben:
//  1. Push-Benachrichtigungen anzeigen (wie bisher).
//  2. Zwischenspeicher, damit die App auf einem Handy im Mobilfunk nicht bei
//     jedem Oeffnen alles neu laedt. Amelie hat berichtet, dass die App sehr
//     langsam startet – vorher wurde nichts gecacht.
//
// Strategie (bewusst vorsichtig gewaehlt):
//  - Programmcode und Bilder (/_next/static, /_next/image, Dateien aus public/)
//    kommen SOFORT aus dem Cache und werden im Hintergrund erneuert
//    ("stale-while-revalidate"). Diese Dateien haben feste Namen bzw. einen
//    Hash im Namen, veralten koennen sie also praktisch nicht.
//  - Seiten (HTML) IMMER zuerst aus dem Netz, Cache nur als Notfall. So sieht
//    Amelie nie eine veraltete App-Version nach einem Deploy.
//  - Lerndaten (Supabase) und /api/ werden NIE gecacht – die muessen stimmen.
//
// Bei Aenderungen an der Strategie CACHE_VERSION hochzaehlen: alte Caches
// werden beim Aktivieren automatisch geloescht.

const CACHE_VERSION = "v1";
const ASSET_CACHE = `assets-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;

// ---------------------------------------------------------------------------
// Push (unveraendert)
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Amelies Lernapp 🐴";
  const options = {
    body: data.body || "Zeit für eine kleine Übung!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    lang: "de",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Wenn die App schon offen ist, dorthin fokussieren.
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});

// ---------------------------------------------------------------------------
// Lebenszyklus
// ---------------------------------------------------------------------------

self.addEventListener("install", () => {
  // Sofort uebernehmen, nicht auf das Schliessen aller Tabs warten.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== ASSET_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// ---------------------------------------------------------------------------
// Abrufe
// ---------------------------------------------------------------------------

/** Dateien, die sich unter gleichem Namen praktisch nie aendern. */
function isAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpg|jpeg|webp|avif|svg|ico|woff2?|ttf)$/i.test(url.pathname)
  );
}

/** Sofort aus dem Cache, parallel im Hintergrund erneuern. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      // Nur vollstaendige, erfolgreiche Antworten behalten.
      if (response && response.status === 200 && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await network;
  if (fresh) return fresh;
  return new Response("", { status: 504, statusText: "Offline" });
}

/** Seiten: erst Netz, Cache nur wenn das Netz nicht antwortet. */
async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Als letzte Rettung die Startseite aus dem Cache.
    const home = await cache.match("/");
    if (home) return home;
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Fremde Server (v. a. Supabase) nie anfassen – Lerndaten muessen frisch sein.
  if (url.origin !== self.location.origin) return;
  // Eigene API-Routen ebenfalls nicht cachen.
  if (url.pathname.startsWith("/api/")) return;

  if (isAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});
