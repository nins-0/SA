function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    lat: parseFloat(params.get('lat')),
    lng: parseFloat(params.get('lng')),
  };
}

const { lat, lng } = getQueryParams();

if (!lat || !lng) {
  alert("Invalid location data");
} else {
  const map = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();
}
