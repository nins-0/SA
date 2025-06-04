function sendMessage(data) {
  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendMessage({ event: 'location', latitude, longitude });

        // Redirect to map page with location in URL
        window.location.href = `map.html?lat=${latitude}&lng=${longitude}`;
      },
      (error) => {
        alert("Location error: " + error.message);
        sendMessage({ event: 'location_error', code: error.code, message: error.message });
      }
    );
  } else {
    alert("Geolocation not supported.");
    sendMessage({ event: 'location_error', message: 'Geolocation not supported.' });
  }
}
