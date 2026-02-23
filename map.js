// Replace with your Mapbox token: https://account.mapbox.com/access-tokens/
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE';

let clubsData = [];
let userLocation = null;
let locationSuggestions = [];
let map;
let markers = [];

async function loadClubsData() {
    try {
        const response = await fetch('data/clubs_index.json');
        const data = await response.json();
        clubsData = data.clubs;
        console.log(`Loaded ${clubsData.length} clubs`);
        buildLocationSuggestions();
        return clubsData;
    } catch (error) {
        console.error('Error loading clubs data:', error);
        return [];
    }
}

function initMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-2.5, 54.5],
        zoom: 5.5
    });

    map.addControl(new mapboxgl.NavigationControl());
    // Don't show any clubs on initial load
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

function buildLocationSuggestions() {
    const locations = new Map();
    clubsData.forEach(club => {
        if (!club.latitude || !club.longitude) return;
        if (club.town && !locations.has(club.town.toLowerCase())) {
            locations.set(club.town.toLowerCase(), { type: 'town', value: club.town, latitude: club.latitude, longitude: club.longitude });
        }
        if (club.county && !locations.has(club.county.toLowerCase())) {
            locations.set(club.county.toLowerCase(), { type: 'county', value: club.county, latitude: club.latitude, longitude: club.longitude });
        }
        if (club.postcode) {
            const fullPostcode = club.postcode.toLowerCase();
            if (!locations.has(fullPostcode)) {
                locations.set(fullPostcode, { type: 'postcode', value: club.postcode, latitude: club.latitude, longitude: club.longitude });
            }
        }
    });
    locationSuggestions = Array.from(locations.values()).sort((a, b) => a.value.localeCompare(b.value));
}

function showLocationSuggestions(query) {
    const dropdown = document.getElementById('suggestionsDropdown');
    if (!query || query.length < 2) {
        dropdown.style.display = 'none';
        return;
    }
    const queryLower = query.toLowerCase();
    const matches = locationSuggestions.filter(loc => loc.value.toLowerCase().startsWith(queryLower)).slice(0, 10);
    if (matches.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    dropdown.innerHTML = matches.map(loc => `<div class="suggestion-item" data-value="${loc.value}"><span class="suggestion-type">${loc.type}</span>${loc.value}</div>`).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => { selectLocation(item.dataset.value); });
    });
}

function selectLocation(value) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = value;
    document.getElementById('suggestionsDropdown').style.display = 'none';
    const location = locationSuggestions.find(loc => loc.value === value);
    if (location && location.latitude && location.longitude) {
        const region = document.querySelector('input[name="region"]:checked').value;
        const results = findNearbyClubs(location.latitude, location.longitude, region);
        displayClubsOnMap(results, location.latitude, location.longitude);
    }
}

function findNearbyClubs(latitude, longitude, region = 'all', limit = 20) {
    let filtered = clubsData.filter(club => club.latitude && club.longitude);
    if (region !== 'all') {
        filtered = filtered.filter(club => club.region === region);
    }
    const clubsWithDistance = filtered.map(club => ({ ...club, distance: calculateDistance(latitude, longitude, club.latitude, club.longitude) }));
    clubsWithDistance.sort((a, b) => a.distance - b.distance);
    return clubsWithDistance.slice(0, limit);
}

function showAllClubs() {
    clearMarkers();
    const region = document.querySelector('input[name="region"]:checked').value;
    let filtered = clubsData.filter(club => club.latitude && club.longitude);
    if (region !== 'all') {
        filtered = filtered.filter(club => club.region === region);
    }
    filtered.forEach(club => { addMarker(club); });
    document.getElementById('resultsInfo').innerHTML = `Showing ${filtered.length} clubs on map`;
}

function displayClubsOnMap(clubs, centerLat, centerLon) {
    clearMarkers();
    // Don't show the search location pin
    clubs.forEach(club => { addMarker(club, true); });
    if (clubs.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        clubs.forEach(club => { bounds.extend([club.longitude, club.latitude]); });
        map.fitBounds(bounds, { padding: 50 });
    }
    document.getElementById('resultsInfo').innerHTML = `Showing ${clubs.length} nearest clubs`;
}

function addMarker(club, showDistance = false) {
    const el = document.createElement('div');
    el.className = 'club-marker';
    el.innerHTML = '⛳';
    const popupContent = `<div class="popup-content"><h3>${club.name}</h3><p><strong>${club.region}</strong></p>${showDistance && club.distance ? `<p>Distance: ${club.distance.toFixed(1)} miles</p>` : ''}${club.address ? `<p>📍 ${club.address}</p>` : ''}${club.postcode ? `<p>📮 ${club.postcode}</p>` : ''}${club.phone ? `<p>📞 ${club.phone}</p>` : ''}<a href="https://www.google.com/maps?q=${club.latitude},${club.longitude}" target="_blank" style="color: #333; font-weight: 600;">🗺️ View on Google Maps</a></div>`;
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);
    const marker = new mapboxgl.Marker(el).setLngLat([club.longitude, club.latitude]).setPopup(popup).addTo(map);
    markers.push(marker);
}

function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
}

function handleSearch() {
    const query = document.getElementById('searchInput').value;
    if (!query) {
        // Don't show clubs when search is empty
        clearMarkers();
        document.getElementById('resultsInfo').innerHTML = '';
        return;
    }
    const location = locationSuggestions.find(loc => loc.value.toLowerCase() === query.toLowerCase());
    if (location) {
        selectLocation(location.value);
    }
}

async function handleNearMe() {
    const loadingMessage = document.getElementById('loadingMessage');
    const region = document.querySelector('input[name="region"]:checked').value;
    loadingMessage.style.display = 'block';
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        loadingMessage.style.display = 'none';
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            const results = findNearbyClubs(userLocation.latitude, userLocation.longitude, region);
            loadingMessage.style.display = 'none';
            displayClubsOnMap(results, userLocation.latitude, userLocation.longitude);
        },
        (error) => {
            loadingMessage.style.display = 'none';
            alert('Unable to get your location.');
            console.error('Geolocation error:', error);
        }
    );
}

document.getElementById('searchBtn').addEventListener('click', handleSearch);
document.getElementById('nearMeBtn').addEventListener('click', handleNearMe);
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => { showLocationSuggestions(e.target.value); });
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { document.getElementById('suggestionsDropdown').style.display = 'none'; handleSearch(); } });
document.addEventListener('click', (e) => { const dropdown = document.getElementById('suggestionsDropdown'); const searchBox = document.querySelector('.search-box'); if (!searchBox.contains(e.target)) { dropdown.style.display = 'none'; } });
document.querySelectorAll('input[name="region"]').forEach(radio => { radio.addEventListener('change', () => { const query = document.getElementById('searchInput').value; if (query) { handleSearch(); } else if (userLocation) { handleNearMe(); } }); });

loadClubsData().then(() => { console.log('App ready!'); initMap(); });
