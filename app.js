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
let userLocationWatcher = null;
const proximityThreshold = 0.95; // Próg w stopniach (ok. 5.5 km)

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

function navigateRoute() {
    if (!currentWaypoints || currentWaypoints.length === 0) {
        alert('Brak punktów nawigacyjnych dla tej trasy.');
        return;
    }

    startTrackingUser(currentWaypoints);

    // Skierowanie użytkownika do Google Maps na podstawie pierwszego i ostatniego punktu
    const origin = currentWaypoints[0];
    const destination = currentWaypoints[currentWaypoints.length - 1];
    const intermediateWaypoints = currentWaypoints.slice(1, -1);

    const waypointParams = intermediateWaypoints
        .map(wp => `${wp.latitude},${wp.longitude}`)
        .join('|');

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypointParams}`;

    console.log('Google Maps URL:', googleMapsUrl);
    window.open(googleMapsUrl, '_blank');
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Promień Ziemi w kilometrach
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Odległość w kilometrach
}

function startTrackingUser(waypoints) {
    if (!navigator.geolocation) {
        alert("Twoja przeglądarka nie obsługuje geolokalizacji.");
        return;
    }

    userLocationWatcher = navigator.geolocation.watchPosition(
        position => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            for (let i = 0; i < waypoints.length; i++) {
                const waypoint = waypoints[i];
                const distance = calculateDistance(userLat, userLon, waypoint.latitude, waypoint.longitude);

                if (distance <= proximityThreshold) {
                    alert(`Dotarłeś na miejsce: ${waypoint.description}`);
                    stopTrackingUser();
                    break;
                }
            }
        },
        error => {
            console.error("Błąd podczas śledzenia lokalizacji:", error);
            alert("Nie udało się uzyskać lokalizacji użytkownika.");
        },
        { enableHighAccuracy: true }
    );
}
function stopTrackingUser() {
    if (userLocationWatcher !== null) {
        navigator.geolocation.clearWatch(userLocationWatcher);
        userLocationWatcher = null;
    }
}

loadRoutes();
