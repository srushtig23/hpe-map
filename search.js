function searchLocation() {
  const query = document.getElementById('searchInput').value;
  if (!query) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        alert('Location not found.');
        return;
      }
      const { lat, lon, display_name } = data[0];
      map.setView([parseFloat(lat), parseFloat(lon)], 14);
      const rating = Math.floor(Math.random() * 11);
      addPopupMarker(parseFloat(lat), parseFloat(lon), display_name, rating);
    });
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
        const rating = Math.floor(Math.random() * 11);
        addPopupMarker(latitude, longitude, address, rating);
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
