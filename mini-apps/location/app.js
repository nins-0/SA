  let map, marker, circle, polygonLayer;
  let userLat = null;
  let userLng = null;
  let currentRadius = 200;
  let buildingData = [];
  let geofenceMode = 'building';
  let activePolygon = null;
  let shouldLog = false;

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

  function requestGeofencingZones() {
    sendToMainApp({ type: 'getGeofencingZones' });
  }

  function sendToMainApp(messageObj) {
    window.ReactNativeWebView.postMessage(JSON.stringify(messageObj));
  }

  function initMap(lat, lng) {
    map = L.map('map').setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup("You are here");

    requestGeofencingZones();

    // fetch('geofencing_zones_test01.geojson')
    // .then(res => res.json())
    // .then(geojson => {
    //   // Convert GeoJSON features to your old format
    //   buildingData = geojson.features.map(feature => {
    //     const name = feature.properties.name;

    //     // GeoJSON coords are [lng, lat], and MultiPolygon has an extra nesting
    //     const coords = feature.geometry.coordinates[0][0].map(([lng, lat]) => ({
    //       latitude: lat,
    //       longitude: lng
    //     }));

    //     return { name, polygon: coords };
    //   });

    //   // Now your existing UI code still works
    //   const buildingSelect = document.getElementById('buildingSelect');
    //   buildingData.forEach((b, i) => {
    //     const option = document.createElement('option');
    //     option.value = i;
    //     option.text = b.name;
    //     buildingSelect.appendChild(option);
    //   });
    // });

    document.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'geofencingZones') {
          const zones = data.zones.data; 

        buildingData = zones.map(feature => {
          const name = feature.name;
          const geom = feature.geometry;

          if (!geom || !geom.coordinates || !geom.coordinates[0] || !geom.coordinates[0][0]) {
            console.warn('Unexpected geometry format for feature:', feature);
            return { name, polygon: [] };
          }

          const coords = geom.coordinates[0][0].map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng
          }));

          return { name, polygon: coords };
        });

        // Populate buildingSelect dropdown
        const buildingSelect = document.getElementById('buildingSelect');
        
        if (!buildingSelect) {
          console.error('Dropdown element with ID "buildingSelect" not found.');
          return;
        }

        buildingSelect.innerHTML = ''; // Clear existing options

        buildingData.forEach((b, i) => {
          const option = document.createElement('option');
          option.value = i;
          option.text = b.name;
          buildingSelect.appendChild(option);
        });

        if (!window.polygonLayer) {
          window.polygonLayer = L.layerGroup().addTo(map);
        } else {
          window.polygonLayer.clearLayers();
        }

        buildingData.forEach(b => {
          if (b.polygon.length > 0) {
            const latlngs = b.polygon.map(coord => [coord.latitude, coord.longitude]);
            L.polygon(latlngs, {
              color: 'blue',
              weight: 2,
              fillColor: 'rgba(0, 0, 255, 0.3)',
              fillOpacity: 0.3
            }).bindPopup(b.name).addTo(window.polygonLayer);
          }
        });

        }
      } catch (e) {
        console.error('Invalid message received in mini app:', e);
      }
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

  document.getElementById('pastLocationBtn').addEventListener('click', () => {

    populateLocationList();

    document.getElementById('pastLocationModal').classList.remove('hidden');
  });

  toggleBtn.addEventListener('click', () => {
    shouldLog = !shouldLog;
    toggleBtn.textContent = shouldLog ? 'Stop Logging' : 'Start Logging';
    if (!shouldLog) {
      alert('Location logging stopped');
    }
  });

  function updateLocation(lat, lng) {
    userLat = lat;
    userLng = lng;

    if (!map) {
      initMap(lat, lng);
    } else {
      marker.setLatLng([lat, lng]);
      // map.setView([lat, lng]);
    }

    const banner = document.getElementById('statusBanner');

    let inside = false;
    let enteredFence = null;

    for (let b of buildingData) {
      if (b.polygon.length > 0) {
        const polygonCoords = b.polygon.map(p => [p.latitude, p.longitude]);
        if (pointInPolygon([lat, lng], polygonCoords)) {
          inside = true;
          enteredFence = b.name; 
          break;
        }
      }
    }

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

    if (shouldLog && enteredFence) {
      const timestamp = Date.now();
      saveUserInFence(enteredFence, timestamp);
    }

  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      updateLocation(latitude, longitude);

      if (shouldLog) {
        const timestamp = Date.now();
        saveLocation(latitude, longitude, timestamp);
      }
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

  function saveLocation(lat, lng, timestamp) {
    const data = sessionStorage.getItem('locations');
    const locations = data ? JSON.parse(data) : [];
    locations.push({ latitude: lat, longitude: lng, timestamp });
    sessionStorage.setItem('locations', JSON.stringify(locations));

    sendToMainApp({
      type: 'locationUpdate',
      latitude: lat,
      longitude: lng,
      timestamp: timestamp,
      userId:'1'
    });
  }

  function saveUserInFence(fence, timestamp) {

    sendToMainApp({
      type: 'userInFenceUpdate',
      userId:'1',
      fence: fence,
      timestamp: timestamp,
    });

  }

  function getAllLocations() {
    const data = sessionStorage.getItem('locations');
    return data ? JSON.parse(data) : [];
  }

  function populateLocationList() {
    const locationList = document.getElementById('locationList');
    locationList.innerHTML = ''; // Clear old entries

    const locations = getAllLocations();

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


