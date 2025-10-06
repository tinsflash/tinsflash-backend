// PATH: public/index.js
// ⚙️ TINSFLASH – Interface publique 100% réelle et connectée

const API_BASE = "https://tinsflash-backend.onrender.com/api";

// === Utils ===
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Erreur fetch:", err);
    return null;
  }
}

// === Chargement prévisions ===
async function loadForecasts() {
  const localEl = document.getElementById("local-forecast");
  const natEl = document.getElementById("national-forecast");
  const weekEl = document.getElementById("forecast-7days");

  localEl.textContent = "Chargement...";
  natEl.textContent = "Chargement...";
  weekEl.textContent = "Chargement...";

  const [local, national, week] = await Promise.all([
    fetchJSON(`${API_BASE}/forecast/local`),
    fetchJSON(`${API_BASE}/forecast/national`),
    fetchJSON(`${API_BASE}/forecast/7days`),
  ]);

  if (local) {
    localEl.innerHTML = `
      🌡 ${local.temperature_min}°C / ${local.temperature_max}°C<br>
      💨 Vent: ${local.wind} km/h<br>
      🌧 Pluie: ${local.precipitation} mm<br>
      🔒 Fiabilité: ${local.reliability}%<br>
      📍 ${local.description || "Prévision locale réelle"}
    `;
  } else {
    localEl.textContent = "⚠️ Prévision locale indisponible.";
  }

  if (national) {
    natEl.innerHTML = `
      🇪🇺 ${national.country}<br>
      🌡 ${national.temperature_min}°C / ${national.temperature_max}°C<br>
      💨 Vent: ${national.wind} km/h<br>
      🌧 ${national.precipitation} mm
    `;
  } else {
    natEl.textContent = "⚠️ Prévision nationale indisponible.";
  }

  if (week && Array.isArray(week)) {
    weekEl.innerHTML = week
      .map(
        (d) => `
        <div class="forecast-box">
          <b>${d.date}</b><br>
          🌡 ${d.temperature_min}°C / ${d.temperature_max}°C<br>
          💨 ${d.wind} km/h<br>
          🌧 ${d.precipitation} mm<br>
          🔒 ${d.reliability}%
        </div>`
      )
      .join("");
  } else {
    weekEl.textContent = "⚠️ Prévisions 7 jours non disponibles.";
  }
}

// === Chargement alertes ===
async function loadAlerts() {
  const el = document.getElementById("alerts");
  el.textContent = "Chargement...";
  const data = await fetchJSON(`${API_BASE}/alerts`);
  if (!data || data.length === 0) {
    el.textContent = "✅ Aucune alerte en cours.";
    return;
  }
  el.innerHTML = data
    .map(
      (a) => `
      <p>⚠️ <b>${a.zone || a.country}</b> – ${a.title || a.type || "Alerte"} (${a.level || "info"})
      <br><small>Fiabilité: ${a.reliability || 0}%</small></p>`
    )
    .join("");
}

// === Cartes ===
async function loadMaps(lat = 20, lon = 10) {
  const state = await fetchJSON(`${API_BASE}/status`);
  if (!state) return;

  // Prévisions couvertes
  const mapF = L.map("map-forecast").setView([lat, lon], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapF);
  (state.checkup?.coveredPoints || []).forEach(pt => {
    L.circle([pt.lat, pt.lon], {
      color: "green",
      fillColor: "green",
      fillOpacity: 0.4,
      radius: 70000
    }).addTo(mapF);
  });

  // Alertes mondiales
  const mapA = L.map("map-alerts").setView([lat, lon], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapA);
  (state.alertsWorld || []).forEach(a => {
    L.circle([a.lat, a.lon], {
      color: "red",
      fillColor: "red",
      fillOpacity: 0.6,
      radius: 100000
    }).addTo(mapA).bindPopup(a.title || "Alerte");
  });
}

// === Gestion avatar selon météo ===
async function updateAvatar() {
  const avatar = document.getElementById("jeanAvatar");
  const data = await fetchJSON(`${API_BASE}/status`);
  if (!data) return;

  const f = data.forecasts?.local || data.forecasts?.national || {};
  const hasRain = f?.today?.rain > 0 || f?.rain > 0;
  const hasAlert = (data.alertsLocal?.length || 0) > 0;
  let img = "jean-default.png";

  if (hasAlert) img = "jean-alert.png";
  else if (hasRain) img = "jean-rain.png";
  else if (f?.today?.sun || f?.sun) img = "jean-sun.png";

  avatar.src = `avatars/${img}`;
}

// === Géolocalisation ===
async function initGeo() {
  const locEl = document.getElementById("user-location");
  if (!navigator.geolocation) {
    locEl.textContent = "❌ Géolocalisation non supportée.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      locEl.innerHTML = `Latitude : ${latitude.toFixed(2)}, Longitude : ${longitude.toFixed(2)}`;
      await loadMaps(latitude, longitude);
      await loadForecasts();
      await loadAlerts();
      await updateAvatar();
    },
    () => {
      locEl.textContent = "⚠️ Géolocalisation refusée. Encodez une adresse manuellement.";
      loadMaps();
      loadForecasts();
      loadAlerts();
      updateAvatar();
    }
  );
}

// === Lancement ===
document.addEventListener("DOMContentLoaded", async () => {
  await initGeo();
});
