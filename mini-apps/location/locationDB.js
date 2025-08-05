export function openLocationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocationDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore('locations', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('timestamp', 'timestamp', { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocation(latitude, longitude, timestamp) {
  const db = await openLocationDB();
  const tx = db.transaction('locations', 'readwrite');
  const store = tx.objectStore('locations');
  await store.add({ latitude, longitude, timestamp });
  return tx.complete;
}

export async function getAllLocations() {
  const db = await openLocationDB();
  const tx = db.transaction('locations', 'readonly');
  const store = tx.objectStore('locations');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
