async function searchLocation() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    alert('Please enter a location');
    return;
  }

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await response.json();

    console.log('Search result:', data); // 👈 DEBUG LINE

    if (!Array.isArray(data) || data.length === 0) {
      alert('Location not found.');
      return;
    }

    const { lat, lon, display_name } = data[0];
    const parsedLat = parseFloat(lat).toFixed(9);
    const parsedLon = parseFloat(lon).toFixed(9);

    map.setView([+parsedLat, +parsedLon], 14);

    // Try Supabase fetch
    const { data: dbData, error } = await _supabase
      .from('CrimeDB')
      .select('latt, long, rating');

    if (error) {
      console.error('Supabase error:', error);
    }

    let matched = dbData.find(d => {
  if (d.latt == null || d.long == null) return false;
  return (
    parseFloat(d.latt).toFixed(9) === parsedLat &&
    parseFloat(d.long).toFixed(9) === parsedLon
  );
});


    let finalRating = 10; // default to 5 stars
    if (matched) {
      const adjusted = 10 - matched.rating;
      finalRating = adjusted;
    }

    addPopupMarker(+parsedLat, +parsedLon, display_name, finalRating);
  } catch (err) {
    console.error('Search error:', err);
    alert('Something went wrong while searching. Try again later.');
  }
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
