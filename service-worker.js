const CACHE_NAME = 'route-planner-cache-v3'; // Zmień wersję cache
const urlsToCache = [
    './',
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
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Cache otwarty podczas instalacji');
            return cache.addAll(urlsToCache);
        })
    );
});

// Aktywacja Service Workera
self.addEventListener('activate', (event) => {
    console.log('Service Worker aktywowany');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log(`Usuwanie starego cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Nowa wersja Service Workera aktywna');
            return self.clients.claim(); // Natychmiastowa aktywacja nowego SW
        })
    );
});

// Obsługa żądań (fetch)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const clonedResponse = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clonedResponse);
                });

                return response;
            })
            .catch(() => caches.match(event.request)) // Zwracaj z cache w razie offline
    );
});
