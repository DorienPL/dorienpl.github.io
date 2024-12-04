const CACHE_NAME = 'route-planner-cache-v2';
const urlsToCache = [
    './',                  // Relatywna ścieżka główna
    './index.html',
    './style.css',
    './app.js',
    './routes.json',
    './waypoints.json',
    './icon-512x512.png'
];

// Instalacja Service Workera
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Aktywacja Service Workera
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Obsługa żądań (fetch)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Jeśli zasób znajduje się w cache, zwróć go
            if (cachedResponse) {
                return cachedResponse;
            }
            // W przeciwnym razie pobierz go z sieci i dodaj do cache
            return fetch(event.request).then((response) => {
                // Sprawdź, czy odpowiedź jest poprawna
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const clonedResponse = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clonedResponse);
                });
                return response;
            });
        })
    );
});
