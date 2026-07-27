const CACHE_NAME = "baby-shower-nashly-v9";
const PRECACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/main.js",
  "/js/ocean-scene.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // La API y las peticiones POST/PUT/DELETE nunca se cachean, ni tampoco esquemas no-HTTP
  if (request.method !== "GET" || request.url.includes("/api/") || !request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
