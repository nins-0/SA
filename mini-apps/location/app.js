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

let map, marker, circle;
let userLat = null;
let userLng = null;
const RADIUS_METERS = 200;

function initMap(lat, lng) {
  map = L.map('map').setView([lat, lng], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  marker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("You are here");
}

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

  if (circle) {
    const distance = map.distance([lat, lng], circle.getLatLng());
    if (distance <= RADIUS_METERS) {
      banner.textContent = "You are within the geofence";
      banner.style.backgroundColor = "#7ea387"; 
      banner.style.color = "#2b2b2b";
    } else {
      banner.textContent = "You are outside the geofence";
      banner.style.backgroundColor = "#c48989"; 
      banner.style.color = "#2b2b2b";
    }
  } else {
    banner.textContent = "No geofence set yet";
    banner.style.backgroundColor = "#737575"; 
    banner.style.color = "#fff";
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

document.getElementById('geofenceBtn').addEventListener('click', () => {
  if (userLat === null || userLng === null) {
    alert("Waiting for GPS...");
    return;
  }

  if (circle) {
    map.removeLayer(circle); 
  }

  circle = L.circle([userLat, userLng], {
    color: 'orange',
    fillColor: '#ff8c3fff',
    fillOpacity: 0.3,
    radius: RADIUS_METERS
  }).addTo(map);

  updateLocation(userLat, userLng);
});
