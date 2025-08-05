// function startLocationUpdates() {
//   if (navigator.geolocation) {
//     watchId = navigator.geolocation.watchPosition(
//       (position) => {
//         const { latitude, longitude } = position.coords;
//         sendMessage({
//           event: "location_update",
//           latitude,
//           longitude,
//           timestamp: Date.now()
//         });
//       },
//       (error) => {
//         sendMessage({
//           event: "location_error",
//           code: error.code,
//           message: error.message
//         });
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 1000,
//         timeout: 10000,
//       }
//     );
//   } else {
//     sendMessage({
//       event: "location_error",
//       message: "Geolocation is not supported"
//     });
//   }
// }

// function stopLocationUpdates() {
//   if (watchId !== null) {
//     navigator.geolocation.clearWatch(watchId);
//     watchId = null;
//   }
// }

// let map, marker;

// function initMap(lat, lng) {
//   map = L.map('map').setView([lat, lng], 16);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   marker = L.marker([lat, lng])
//     .addTo(map)
//     .bindPopup("You are here");
// }

// function updateLocation(lat, lng) {
//   if (!map) {
//     initMap(lat, lng);
//   } else {
//     marker.setLatLng([lat, lng]);
//     map.setView([lat, lng]);
//   }
// }

// navigator.geolocation.watchPosition(
//   (pos) => {
//     const { latitude, longitude } = pos.coords;
//     updateLocation(latitude, longitude);
//   },
//   (err) => {
//     alert("Unable to get location: " + err.message);
//   },
//   {
//     enableHighAccuracy: true,
//     maximumAge: 1000,
//     timeout: 10000,
//   }
// );

import { saveLocation , getAllLocations } from './locationDB';

let map, marker, circle, polygonLayer;
let userLat = null;
let userLng = null;
let currentRadius = 200;
let buildingData = [];
let geofenceMode = 'radius';
let activePolygon = null;
let watchId = null;

const radiusInput = document.querySelector('input[value="radius"]');
const buildingInput = document.querySelector('input[value="building"]');
const radiusSelect = document.getElementById('radiusSelect');
const buildingSelect = document.getElementById('buildingSelect');
const toggleBtn = document.getElementById('toggleTracking');

radiusInput.addEventListener('change', () => {
  radiusSelect.disabled = false;
  buildingSelect.disabled = true;
});

buildingInput.addEventListener('change', () => {
  radiusSelect.disabled = true;
  buildingSelect.disabled = false;
});

function initMap(lat, lng) {
  map = L.map('map').setView([lat, lng], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  marker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("You are here");

  fetch('buildings.json')
  .then(res => res.json())
  .then(data => {
    buildingData = data;
    const buildingSelect = document.getElementById('buildingSelect');
    buildingData.forEach((b, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.text = b.name;
      buildingSelect.appendChild(option);
    });
  });

  document.getElementById('geofenceBtn').addEventListener('click', () => {
    const mode = document.querySelector('input[name="geofenceMode"]:checked').value;
    radiusSelect.disabled = mode !== 'radius';
    buildingSelect.disabled = mode !== 'building';

    document.getElementById('geofenceModal').classList.remove('hidden');
  });

  document.getElementById('cancelGeofenceBtn').addEventListener('click', () => {
    document.getElementById('geofenceModal').classList.add('hidden');
  });

  document.getElementById('applyGeofenceBtn').addEventListener('click', () => {
    document.getElementById('geofenceModal').classList.add('hidden');

    const mode = document.querySelector('input[name="geofenceMode"]:checked').value;

    if (circle) map.removeLayer(circle);
    if (polygonLayer) map.removeLayer(polygonLayer);
    geofenceMode = mode;

    if (mode === 'radius') {
      currentRadius = parseInt(document.getElementById('radiusSelect').value);
      circle = L.circle([userLat, userLng], {
        color: 'orange',
        fillColor: '#ff8c3fff',
        fillOpacity: 0.3,
        radius: currentRadius
      }).addTo(map);
    } else {
      const selectedIndex = parseInt(document.getElementById('buildingSelect').value);
        if (isNaN(selectedIndex) || !buildingData[selectedIndex]) return;
      const points = buildingData[selectedIndex].polygon.map(p => [p.latitude, p.longitude]);
      polygonLayer = L.polygon(points, {
        color: 'blue',
        fillColor: '#3b83bd',
        fillOpacity: 0.3
      }).addTo(map);
      activePolygon = points;
    }

    updateLocation(userLat, userLng);
  });

}

document.getElementById('cancelPastLocationBtn').addEventListener('click', () => {
  document.getElementById('pastLocationModal').classList.add('hidden');
});

document.getElementById('PastLocationBtn').addEventListener('click', () => {

  populateLocationList();

  document.getElementById('geofenceModal').classList.remove('hidden');
});

toggleBtn.addEventListener('click', () => {
  if (watchId === null) {
    // Start tracking
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const timestamp = Date.now();
        saveLocation(latitude, longitude, timestamp);
      },
      (err) => {
        alert('Unable to get location: ' + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  } else {
    // Stop tracking
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    alert('Location tracking stopped');
  }

  // ✅ Always update button text based on watchId
  toggleBtn.textContent = watchId === null ? 'Start Logging' : 'Stop Logging';
});


function updateLocation(lat, lng) {
  userLat = lat;
  userLng = lng;

  if (!map) {
    initMap(lat, lng);
  } else {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng]);
  }

  const banner = document.getElementById('statusBanner');

  let inside = false;

  if (geofenceMode === 'radius' && circle) {
    const distance = map.distance([lat, lng], circle.getLatLng());
    inside = distance <= currentRadius;
  } else if (geofenceMode === 'building' && activePolygon) {
    inside = pointInPolygon([lat, lng], activePolygon);
  } else {
    banner.textContent = "No geofence set yet";
    banner.style.backgroundColor = "#737575";
    banner.style.color = "#fff";
    return;
  }

  banner.textContent = inside
    ? "You are within the geofence"
    : "You are outside the geofence";

  banner.style.backgroundColor = inside ? "#7ea387" : "#c48989";
  banner.style.color = "#2b2b2b";

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

function pointInPolygon(point, polygon) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

async function populateLocationList() {
  const locationList = document.getElementById('locationList');
  locationList.innerHTML = ''; // Clear old entries

  const locations = await getAllLocations();

  if (!locations.length) {
    const li = document.createElement('li');
    li.textContent = 'No locations recorded.';
    locationList.appendChild(li);
    return;
  }

  locations.forEach(({ latitude, longitude, timestamp }) => {
    const li = document.createElement('li');
    li.textContent = `${new Date(timestamp).toLocaleString()} - [${latitude.toFixed(5)}, ${longitude.toFixed(5)}]`;
    locationList.appendChild(li);
  });
}
