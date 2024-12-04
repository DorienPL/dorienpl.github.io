if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(function (registration) {
            console.log('Service Worker zarejestrowany:', registration);
        })
        .catch(function (error) {
            console.log('Rejestracja Service Workera nie powiodła się:', error);
        });
}

let currentWaypoints = [];

// Ładowanie tras z pliku JSON
async function loadRoutes() {
    try {
        const response = await fetch('./routes.json');
        if (!response.ok) {
            throw new Error('Błąd podczas ładowania tras');
        }

        const routes = await response.json();
        const routesList = document.getElementById('routesList');
        routesList.innerHTML = '';

        if (routes.length === 0) {
            routesList.innerHTML = '<li>Brak tras do wyświetlenia.</li>';
            return;
        }

        routes.forEach(route => {
            const li = document.createElement('li');
            li.innerHTML = route.name;
            li.onclick = () => loadWaypoints(route.id);
            routesList.appendChild(li);
        });
    } catch (error) {
        console.error('Błąd:', error);
        document.getElementById('routesList').innerHTML = '<li>Nie udało się pobrać tras.</li>';
    }
}

// Ładowanie waypointów z pliku JSON
async function loadWaypoints(routeId) {
    try {
        const response = await fetch('./waypoints.json');
        if (!response.ok) {
            throw new Error('Błąd podczas ładowania waypointów');
        }

        const waypointsData = await response.json();
        const waypoints = waypointsData[routeId] || [];
        currentWaypoints = waypoints;

        initializeMap(waypoints);

        const navigationButtonContainer = document.getElementById('navigationButtonContainer');
        navigationButtonContainer.innerHTML = `
            <button onclick="navigateRoute()">Nawiguj</button>
        `;
    } catch (error) {
        console.error('Błąd:', error);
        alert('Nie udało się pobrać waypointów dla tej trasy.');
    }
}

// Inicjalizacja mapy za pomocą Leaflet.js
function initializeMap(waypoints) {
    const map = L.map('map').setView([waypoints[0].latitude, waypoints[0].longitude], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    waypoints.forEach(waypoint => {
        L.marker([waypoint.latitude, waypoint.longitude])
            .addTo(map)
            .bindPopup(waypoint.description);
    });
}

// Nawigacja od lokalizacji użytkownika do punktów trasy
function navigateRoute() {
    if (!currentWaypoints || currentWaypoints.length < 2) {
        alert('Brak wystarczającej liczby punktów nawigacyjnych dla tej trasy.');
        return;
    }

    if (!navigator.geolocation) {
        alert("Twoja przeglądarka nie obsługuje geolokalizacji.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            const origin = { latitude: userLat, longitude: userLon };
            const firstWaypoint = currentWaypoints[0];
            const secondWaypoint = currentWaypoints[1];

            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1` +
                `&origin=${origin.latitude},${origin.longitude}` +
                `&destination=${secondWaypoint.latitude},${secondWaypoint.longitude}` +
                `&waypoints=${firstWaypoint.latitude},${firstWaypoint.longitude}`;

            console.log('Google Maps URL:', googleMapsUrl);
            window.open(googleMapsUrl, '_blank');
        },
        error => {
            console.error("Błąd podczas uzyskiwania lokalizacji:", error);
            alert("Nie udało się uzyskać aktualnej lokalizacji użytkownika.");
        },
        { enableHighAccuracy: true }
    );
}

// Ładowanie tras na początku działania aplikacji
loadRoutes();
