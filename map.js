const map = L.map('map').setView([12.9716, 77.5946], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

function getStarRating(rating) {
  const safeRating = typeof rating === "number" ? rating : 10;
  let stars = Math.round((11 - safeRating) / 2);

  // Clamp stars to range [0, 5]
  stars = Math.max(0, Math.min(5, stars));

  return {
    stars,
    display: '★'.repeat(stars) + '☆'.repeat(5 - stars)
  };
}


function addPopupMarker(lat, lon, address, rating = 10) {
  const { display, stars } = getStarRating(rating);
  const popupHtml = `
    <div class="max-w-xs">
      <b>${address}</b><br>
      <span class="text-yellow-500 text-lg">${display}</span>
      <span class="text-sm">(${stars}/5)</span>
    </div>
  `;
  L.marker([lat, lon]).addTo(map).bindPopup(popupHtml).openPopup();
}

async function addTooltipMarker(lat, lon, avgRating, delay = 0) {
  await new Promise(resolve => setTimeout(resolve, delay));

  const safeRating = typeof avgRating === "number" ? avgRating : 10;
  const location = `(${lat.toFixed(3)}, ${lon.toFixed(3)})`;

  let stars = Math.round((11 - safeRating) / 2);
  stars = Math.max(0, Math.min(5, stars));
  const goldStars = `<span style="color: #FFD700;">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>`;
  const displayRating = ((11 - safeRating) / 2).toFixed(2);

  const circle = L.circle([lat, lon], {
    radius: 5000,
    color: 'transparent',
    fillColor: 'transparent',
    fillOpacity: 0,
    interactive: true,
    zIndexOffset: 1000
  }).addTo(map);

  const popupHtml = `<b>${location}</b><br>Rating: ${goldStars} <b>(${displayRating})</b>`;
  circle.bindPopup(popupHtml, { closeOnClick: false });

  circle.on('mouseover', function () {
    this.openPopup();
  });
  circle.on('mouseout', function () {
    this.closePopup();
  });
}
async function loadCrimeDataFromSupabase() {
  const { data, error } = await _supabase
    .from('CrimeDB')
    .select('latt, long, rating');


  // console.log('Supabase data loaded:', data); 

  const locationMap = new Map();



data.forEach(({ latt, long, rating }) => {
  if (
    typeof latt !== "number" ||
    typeof long !== "number" ||
    typeof rating !== "number" ||
    rating < 0 || rating > 10
  ) {
    return;
  }

  const key = `${latt.toFixed(9)}_${long.toFixed(9)}`;
  const adjustedRating = (11 - rating) / 2;

  if (!locationMap.has(key)) {
    locationMap.set(key, { latt, long, ratings: [adjustedRating] });
  } else {
    locationMap.get(key).ratings.push(adjustedRating);
  }
});


  const unsafePoints = [];
  locationMap.forEach(({ latt, long, ratings }) => {
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    if (avgRating < 3) {
      unsafePoints.push([latt, long, (11 - avgRating * 2) / 10]);
      addTooltipMarker(latt, long, 11 - avgRating * 2);
    }
  });

  if (unsafePoints.length) {
    const heatLayer = L.heatLayer(unsafePoints, {
      radius: 25,
      blur: 15,
      minOpacity: 0.6,
      gradient: {
        0.0: '#00ff00',
        0.5: '#ffff00',
        1.0: '#ff0000'
      },
      zIndex: 500
    }, { willReadFrequently: true }).addTo(map);
    // console.log('Heatmap added with', unsafePoints.length, 'points');
  } else {
    console.warn('No unsafe points found for heatmap');
  }
}

loadCrimeDataFromSupabase();

