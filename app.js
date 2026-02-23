let clubsData = [];
let userLocation = null;
let locationSuggestions = [];

// Load clubs data
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
        showError('Failed to load clubs data. Please refresh the page.');
        return [];
    }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

// Build location suggestions from club data
function buildLocationSuggestions() {
    const locations = new Map();
    
    clubsData.forEach(club => {
        if (!club.latitude || !club.longitude) return;
        
        // Add town with coordinates
        if (club.town && !locations.has(club.town.toLowerCase())) {
            locations.set(club.town.toLowerCase(), {
                type: 'town',
                value: club.town,
                latitude: club.latitude,
                longitude: club.longitude
            });
        }
        
        // Add county with coordinates
        if (club.county && !locations.has(club.county.toLowerCase())) {
            locations.set(club.county.toLowerCase(), {
                type: 'county',
                value: club.county,
                latitude: club.latitude,
                longitude: club.longitude
            });
        }
        
        // Add postcode with coordinates
        if (club.postcode) {
            const fullPostcode = club.postcode.toLowerCase();
            if (!locations.has(fullPostcode)) {
                locations.set(fullPostcode, {
                    type: 'postcode',
                    value: club.postcode,
                    latitude: club.latitude,
                    longitude: club.longitude
                });
            }
            
            // Add postcode area
            const postcodeArea = club.postcode.split(' ')[0];
            const postcodeAreaLower = postcodeArea.toLowerCase();
            if (postcodeArea && !locations.has(postcodeAreaLower)) {
                locations.set(postcodeAreaLower, {
                    type: 'postcode',
                    value: postcodeArea,
                    latitude: club.latitude,
                    longitude: club.longitude
                });
            }
        }
    });
    
    locationSuggestions = Array.from(locations.values())
        .sort((a, b) => a.value.localeCompare(b.value));
    
    console.log(`Built ${locationSuggestions.length} location suggestions`);
}

// Show location suggestions
function showLocationSuggestions(query) {
    const dropdown = document.getElementById('suggestionsDropdown');
    
    if (!query || query.length < 2) {
        dropdown.style.display = 'none';
        return;
    }
    
    const queryLower = query.toLowerCase();
    const matches = locationSuggestions
        .filter(loc => loc.value.toLowerCase().startsWith(queryLower))
        .slice(0, 10);
    
    if (matches.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = matches.map(loc => 
        `<div class="suggestion-item" data-value="${loc.value}">
            <span class="suggestion-type">${loc.type}</span>
            ${loc.value}
        </div>`
    ).join('');
    
    dropdown.style.display = 'block';
    
    // Add click handlers to suggestions
    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            selectLocation(item.dataset.value);
        });
    });
}

// Select a location from suggestions
function selectLocation(value) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = value;
    document.getElementById('suggestionsDropdown').style.display = 'none';
    
    // Find the selected location's coordinates
    const location = locationSuggestions.find(loc => loc.value === value);
    
    if (location && location.latitude && location.longitude) {
        // Use coordinates to find nearest clubs
        const region = document.querySelector('input[name="region"]:checked').value;
        const results = findNearbyClubs(location.latitude, location.longitude, region);
        displayResults(results, true);
    } else {
        // Fallback to text search if no coordinates
        handleSearch();
    }
}

// Search clubs
function searchClubs(query, region = 'all') {
    query = query.toLowerCase().trim();
    
    let filtered = clubsData;
    
    // Filter by region
    if (region !== 'all') {
        filtered = filtered.filter(club => club.region === region);
    }
    
    // Filter by search query
    if (query) {
        filtered = filtered.filter(club => {
            const name = (club.name || '').toLowerCase();
            const address = (club.address || '').toLowerCase();
            const fullAddress = (club.full_address || '').toLowerCase();
            const town = (club.town || '').toLowerCase();
            const postcode = (club.postcode || '').toLowerCase();
            const county = (club.county || '').toLowerCase();
            
            return name.includes(query) || 
                   address.includes(query) || 
                   fullAddress.includes(query) ||
                   town.includes(query) ||
                   postcode.includes(query) ||
                   county.includes(query);
        });
    }
    
    return filtered.slice(0, 20);
}

// Find clubs near user location
function findNearbyClubs(latitude, longitude, region = 'all', limit = 20) {
    let filtered = clubsData.filter(club => club.latitude && club.longitude);
    
    // Filter by region
    if (region !== 'all') {
        filtered = filtered.filter(club => club.region === region);
    }
    
    // Calculate distances
    const clubsWithDistance = filtered.map(club => ({
        ...club,
        distance: calculateDistance(latitude, longitude, club.latitude, club.longitude)
    }));
    
    // Sort by distance
    clubsWithDistance.sort((a, b) => a.distance - b.distance);
    
    return clubsWithDistance.slice(0, limit);
}

// Display results
function displayResults(clubs, showDistance = false) {
    const resultsDiv = document.getElementById('results');
    const resultsInfo = document.getElementById('resultsInfo');
    const noResults = document.getElementById('noResults');
    
    if (clubs.length === 0) {
        resultsDiv.innerHTML = '';
        resultsInfo.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    resultsInfo.innerHTML = `Found ${clubs.length} club${clubs.length !== 1 ? 's' : ''}`;
    
    resultsDiv.innerHTML = clubs.map((club, index) => `
        <div class="club-card">
            <img src="${club.image || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop'}" 
                 alt="${club.name}" 
                 class="club-image"
                 onerror="this.src='https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop'">
            <div class="club-content">
                <div class="club-header">
                    <div>
                        <div class="club-name">${club.name || 'Unknown Club'}</div>
                        <span class="region-badge region-${club.region}">${club.region}</span>
                    </div>
                    ${showDistance && club.distance !== undefined ? 
                        `<div class="club-distance">${club.distance.toFixed(1)} mi</div>` : 
                        `<div class="club-distance">#${index + 1}</div>`
                    }
                </div>
                <div class="club-details">
                    ${club.address ? `<div class="club-detail">� ${club.address}</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Handle search
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        return;
    }
    
    const region = document.querySelector('input[name="region"]:checked').value;
    
    // Find the location in suggestions to get coordinates
    const location = locationSuggestions.find(loc => 
        loc.value.toLowerCase() === query.toLowerCase()
    );
    
    if (location && location.latitude && location.longitude) {
        // Use coordinates to find nearest clubs
        const results = findNearbyClubs(location.latitude, location.longitude, region);
        displayResults(results, true);
    } else {
        // Fallback to text search if no exact location match
        const results = searchClubs(query, region);
        displayResults(results, false);
    }
}

// Handle near me
async function handleNearMe() {
    const loadingMessage = document.getElementById('loadingMessage');
    const region = document.querySelector('input[name="region"]:checked').value;
    
    loadingMessage.style.display = 'block';
    document.getElementById('results').innerHTML = '';
    document.getElementById('resultsInfo').innerHTML = '';
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        loadingMessage.style.display = 'none';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            const results = findNearbyClubs(
                userLocation.latitude, 
                userLocation.longitude, 
                region
            );
            
            loadingMessage.style.display = 'none';
            displayResults(results, true);
        },
        (error) => {
            loadingMessage.style.display = 'none';
            alert('Unable to get your location. Please search by name or postcode instead.');
            console.error('Geolocation error:', error);
        }
    );
}

function showError(message) {
    document.getElementById('resultsInfo').innerHTML = 
        `<div style="color: #e53e3e; font-weight: 600;">${message}</div>`;
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', handleSearch);
document.getElementById('nearMeBtn').addEventListener('click', handleNearMe);

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    showLocationSuggestions(e.target.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('suggestionsDropdown').style.display = 'none';
        handleSearch();
    }
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('suggestionsDropdown');
    const searchBox = document.querySelector('.search-box');
    if (!searchBox.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Region filter change
document.querySelectorAll('input[name="region"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const query = document.getElementById('searchInput').value;
        if (query) {
            handleSearch();
        } else if (userLocation) {
            handleNearMe();
        }
    });
});

// Initialize
loadClubsData().then(() => {
    console.log('App ready!');
});

