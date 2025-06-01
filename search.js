
function showLoading(isLoading) {
  const loader = document.getElementById('loadingIndicator');
  loader.style.display = isLoading ? 'block' : 'none';
}

function clearSuggestions() {
  const list = document.getElementById('suggestionsList');
  list.innerHTML = '';
  list.classList.add('hidden');
}

function showSuggestions(data) {
  const list = document.getElementById('suggestionsList');
  list.innerHTML = '';

  if (!data.length) return clearSuggestions();

  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.display_name;
    li.className = 'suggestion-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm';
    li.onclick = () => {
      document.getElementById('searchInput').value = item.display_name;
      clearSuggestions();
      searchLocation();
    };
    list.appendChild(li);
  });

  list.classList.remove('hidden');
}

function getSuggestions(query) {
  if (!query.trim()) return clearSuggestions();

  showLoading(true);
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
    .then(res => res.json())
    .then(showSuggestions)
    .catch(err => console.error('Suggestion fetch error:', err))
    .finally(() => showLoading(false));
}

async function searchLocation() {
  const query = document.getElementById('searchInput').value;
  if (!query) return;

  showLoading(true);
  try {
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

    const { data: dbData } = await _supabase.from('CrimeDB').select('latt, long, rating');

    let matched = dbData.find(
      d => d.latt?.toFixed(9) === parsedLat && d.long?.toFixed(9) === parsedLon
    );

    let finalRating = 10;
    if (matched) finalRating = (10 - matched.rating);

    addPopupMarker(+parsedLat, +parsedLon, display_name, finalRating);
  } catch (err) {
    console.error('Search error:', err);
  } finally {
    showLoading(false);
    clearSuggestions();
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
        addPopupMarker(latitude, longitude, address, 0);
      });
  });
}

// Auto-dismiss suggestion box on outside click
window.addEventListener('click', (e) => {
  const input = document.getElementById('searchInput');
  const suggestions = document.getElementById('suggestionsList');
  if (!input.contains(e.target) && !suggestions.contains(e.target)) {
    clearSuggestions();
  }
});
