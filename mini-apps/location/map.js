let map, marker;

function initMap(lat, lng) {
  map = L.map('map').setView([lat, lng], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  marker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("You are here")
    .openPopup();
}

function updateLocation(lat, lng) {
  if (!map) {
    initMap(lat, lng);
  } else {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng]);
  }
}

navigator.geolocation.watchPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    updateLocation(latitude, longitude);
  },
  (err) => {
    alert("Unable to get location: " + err.message);
  },
  {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 10000,
  }
);
