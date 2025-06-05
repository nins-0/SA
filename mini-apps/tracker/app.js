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

function openMapPage() {
  window.location.href = "map.html";
}

function exitApp() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ event: "exit" }));
  } else {
    alert("Running outside React Native.");
  }
}
