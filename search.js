async function searchLocation() {
  const query = document.getElementById('searchInput').value;
  if (!query) return;

  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
  const data = await response.json();

  if (!data.length) {
    alert('Location not found.');
    return;
  }

  const { lat, lon, display_name } = data[0];
  const parsedLat = parseFloat(lat).toFixed(9);
  const parsedLon = parseFloat(lon).toFixed(9);

  map.setView([+parsedLat, +parsedLon], 14);

  // Try to fetch rating from Supabase if location matches
  const { data: dbData, error } = await _supabase
    .from('CrimeDB')
    .select('latt, long, rating');

  let matched = dbData.find(
    d =>
      d.latt.toFixed(9) === parsedLat &&
      d.long.toFixed(9) === parsedLon
  );

  let finalRating = 10; // Default to 5 stars
  if (matched) {
    const adjusted = (10 - matched.rating); // Convert to 0–10 scale
    finalRating = adjusted;
  }

  addPopupMarker(+parsedLat, +parsedLon, display_name, finalRating);
}


function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported.');
    return;
  }
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    map.setView([latitude, longitude], 14);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
      .then(res => res.json())
      .then(data => {
        const address = data.display_name || 'Your Location';
        // Simulate rating (0-10)
        // const rating = Math.floor(Math.random() * 11);
        addPopupMarker(latitude, longitude, address, rating=0);
      });
  });
}

function getSuggestions(query) {
  if (query.length < 3) return;
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
    .then(res => res.json())
    .then(data => {
      const datalist = document.getElementById('suggestions');
      datalist.innerHTML = '';
      data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.display_name;
        datalist.appendChild(option);
      });
    });
}
