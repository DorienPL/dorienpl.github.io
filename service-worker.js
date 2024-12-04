const CACHE_NAME = 'route-planner-cache-v2';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './routes.json',
    './waypoints.json',
    './icon-512x512.png'
];

// Funkcja do aktualizacji cache
async function updateCache(request) {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
        await cache.put(request, response.clone());
    }
    return response;
}

// Instalacja Service Workera
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
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
        caches.match(event.request).then(async (cachedResponse) => {
            if (cachedResponse) {
                // Sprawdź, czy zasób w cache wymaga aktualizacji
                fetch(event.request).then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, response.clone());
                        });
                    }
                }).catch(() => console.log('Offline - nie można zaktualizować pliku:', event.request.url));
                return cachedResponse; // Zwróć z cache natychmiast
            }
            // Jeśli brak zasobu w cache, pobierz z sieci
            return updateCache(event.request);
        })
    );
});
