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

// Reszta kodu pozostaje bez zmian...
// Funkcje: initializeMap, navigateRoute, calculateDistance, startTrackingUser, stopTrackingUser

loadRoutes();
