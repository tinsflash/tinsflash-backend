// ===============================
// 🌍 TINSFLASH FRONTEND APP
// ===============================

const API_BASE = "https://tinsflash-backend.onrender.com/api";

// -------------------------
// Prévisions locales
// -------------------------
async function loadLocalForecast() {
  const c = document.getElementById("local-content");
  c.innerHTML = "⏳ Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast/local?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      const f = data.combined;

      c.innerHTML = `
        <strong>${f.description}</strong><br>
        🌡️ ${f.temperature}°C (min: ${f.temperature_min}°C / max: ${f.temperature_max}°C)<br>
        💨 Vent: ${f.wind} km/h<br>
        🌧️ Pluie: ${f.precipitation} mm<br>
        🔒 Fiabilité: ${f.reliability}%<br>
        ⚠️ ${f.anomaly?.message || "Conditions normales"}<br>
      `;
    });
  } catch {
    c.innerHTML = "❌ Erreur prévisions locales";
  }
}

// -------------------------
// Prévisions nationales
// -------------------------
async function loadNationalForecast() {
  const c = document.getElementById("national-content");
  c.innerHTML = "⏳ Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast/national?country=BE`);
    const data = await res.json();
    const f = data.combined;

    c.innerHTML = `
      <strong>${f.description}</strong><br>
      🌡️ ${f.temperature}°C (min: ${f.temperature_min}°C / max: ${f.temperature_max}°C)<br>
      💨 Vent: ${f.wind} km/h<br>
      🌧️ Pluie: ${f.precipitation} mm<br>
      🔒 Fiabilité: ${f.reliability}%<br>
      ⚠️ ${f.anomaly?.message || "Conditions normales"}<br>
    `;
  } catch {
    c.innerHTML = "❌ Erreur prévisions nationales";
  }
}

// -------------------------
// Prévisions 7 jours
// -------------------------
async function load7Days() {
  const c = document.getElementById("days-container");
  c.innerHTML = "⏳ Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast/7days?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      c.innerHTML = "";

      data.days.forEach(d => {
        c.innerHTML += `
          <div class="day-card">
            <strong>${d.jour}</strong><br>
            ${d.description}<br>
            🌡️ ${d.temperature_min}°C / ${d.temperature_max}°C<br>
            💨 ${d.vent} km/h<br>
            🌧️ ${d.precipitation} mm<br>
            🔒 ${d.fiabilité}%<br>
            ⚠️ ${d.anomalie}
          </div>
        `;
      });

      generateForecastText(data.days); // ✅ Génère le texte bulletin
    });
  } catch {
    c.innerHTML = "❌ Erreur prévisions 7 jours";
  }
}

// -------------------------
// Bulletin météo texte
// -------------------------
function generateForecastText(daysData) {
  if (!daysData || daysData.length === 0) {
    document.getElementById("forecast-text").innerText = "⚠️ Données insuffisantes.";
    return;
  }

  const today = daysData[0];
  const tomorrow = daysData[1];
  const rest = daysData.slice(2);

  let text = `Bulletin météo TINSFLASH :\n\n`;

  text += `🌙 Aujourd'hui (${today.jour}) : ${today.description}, températures ${today.temperature_min}°C à ${today.temperature_max}°C.\n\n`;
  text += `☀️ Demain (${tomorrow.jour}) : ${tomorrow.description}, min ${tomorrow.temperature_min}°C / max ${tomorrow.temperature_max}°C.\n\n`;

  if (rest.length > 0) {
    const minTemp = Math.min(...rest.map(d => d.temperature_min));
    const maxTemp = Math.max(...rest.map(d => d.temperature_max));
    text += `📅 Ensuite : tendance ${rest[0].description.toLowerCase()}, températures entre ${minTemp}°C et ${maxTemp}°C.\n\n`;
  }

  document.getElementById("forecast-text").innerText = text;

  // ✅ Lance aussi le podcast basé sur ce texte
  loadPodcast(text);
}

// -------------------------
// Radar interactif
// -------------------------
async function loadRadar() {
  const radarDiv = document.getElementById("radar-map");
  radarDiv.innerHTML = "⏳ Chargement radar...";
  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();

    const map = L.map("radar-map").setView([50.85, 4.35], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    const framesRes = await fetch(data.timestampsUrl);
    const frames = await framesRes.json();

    let currentFrame = frames.length - 1;
    let radarLayer;

    function showFrame(i) {
      if (radarLayer) map.removeLayer(radarLayer);
      radarLayer = L.tileLayer(data.tilesUrl.replace("{time}", frames[i]), { opacity: 0.6 });
      radarLayer.addTo(map);
    }

    showFrame(currentFrame);
    setInterval(() => {
      currentFrame = (currentFrame + 1) % frames.length;
      showFrame(currentFrame);
    }, 1000);

  } catch (err) {
    radarDiv.innerHTML = "❌ Erreur radar";
    console.error("Radar error:", err);
  }
}

// -------------------------
// Alertes météo
// -------------------------
async function loadAlerts() {
  const c = document.getElementById("alerts-content");
  c.innerHTML = "⏳ Chargement...";
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    const data = await res.json();

    c.innerHTML = data
      .map(a => `<div>⚠️ ${a.level.toUpperCase()} - ${a.message} (Fiabilité: ${a.reliability}%)</div>`)
      .join("");
  } catch {
    c.innerHTML = "❌ Erreur alertes";
  }
}

// -------------------------
// Podcast météo
// -------------------------
async function loadPodcast(textBulletin) {
  try {
    const res = await fetch(`${API_BASE}/podcast/generate?type=daily`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textBulletin })
    });
    const data = await res.json();

    document.getElementById("podcast-container").innerHTML = `
      <div>✅ Podcast généré</div>
      <audio controls src="${data.audioUrl}"></audio>
    `;
  } catch (err) {
    document.getElementById("podcast-container").innerText = "❌ Erreur podcast";
  }
}

// -------------------------
// INIT
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadLocalForecast();
  loadNationalForecast();
  load7Days();
  loadRadar();
  loadAlerts();
});
