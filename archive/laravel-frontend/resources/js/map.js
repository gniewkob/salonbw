export function initMap(lat, lng, popupText = '', elementId = 'map') {
    if (!(lat && lng && window.L)) {
        console.error('Missing latitude, longitude or Leaflet library', { lat, lng, L: window.L });
        return null;
    }

    const map = L.map(elementId).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map)
        .bindPopup(popupText)
        .openPopup();

    return map;
}

// Make function accessible globally for inline scripts
window.initMap = initMap;
