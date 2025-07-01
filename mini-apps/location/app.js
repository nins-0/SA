let watchId = null;

function sendMessage(data) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  } else {
    console.log("Not running inside React Native. Data:", data);
  }
}

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

