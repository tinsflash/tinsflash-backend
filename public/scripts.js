// ===============================
// 🌍 TINSFLASH FRONTEND APP
// ===============================

const API_BASE = "https://tinsflash-backend.onrender.com/api";

// -------------------------
// Détection type d’utilisateur (Free / Premium / Pro / Pro+)
// -------------------------
function getUserTier() {
  // Ici simplifié → à remplacer par authentification réelle
  // ex: récupérer depuis MongoDB ou JWT token
  return localStorage.getItem("userTier") || "free";
}

// -------------------------
// Prévisions locales
// -------------------------
async function loadLocalForecast() {
  const c = document.getElementById("local-forecast");
  c.innerHTML = "⏳ Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(
        `${API_BASE}/forecast/local?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
      );
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
// Radar multi-niveaux
// -------------------------
async function loadRadar() {
  const radarDiv = document.getElementById("radar-map");
  radarDiv.innerHTML = "⏳ Chargement radar...";

  try {
    const tier = getUserTier();
    const res = await fetch(`${API_BASE}/radar?tier=${tier}`);
    const radar = await res.json();

    const map = L.map("radar-map").setView([50.85, 4.35], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    let currentFrame = 0;
    let radarLayer;

    function showFrame(i) {
      if (radarLayer) map.removeLayer(radarLayer);
      radarLayer = L.tileLayer(
        `https://tilecache.rainviewer.com/v2/radar/${radar.frames[i].path}/256/{z}/{x}/{y}/2/1_1.png`,
        { opacity: 0.6 }
      ).addTo(map);

      document.getElementById("radar-time").innerText = new Date(
        radar.frames[i].time * 1000
      ).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
    }

    // Animation frames
    showFrame(currentFrame);
    setInterval(() => {
      currentFrame = (currentFrame + 1) % radar.frames.length;
      showFrame(currentFrame);
    }, 1000);

    // Infos selon le niveau
    let info = `✅ Radar (${radar.tier}) : ${radar.message}<br>`;

    if (radar.precipType) {
      info += `🌧️ Type précipitation : ${
        radar.precipType === "snow"
          ? "❄️ Neige"
          : radar.precipType === "rain"
          ? "☔ Pluie"
          : "🌨 Pluie/neige mêlées"
      }<br>`;
    }

    if (radar.wind) {
      info += `💨 Vent : ${radar.wind.speed} km/h (${radar.wind.direction}°)<br>`;
    }

    if (radar.anomaly) {
      info += `⚠️ Anomalie : ${radar.anomaly.message}<br>`;
    }

    document.getElementById("radar-info").innerHTML = info;
  } catch (err) {
    radarDiv.innerHTML = "❌ Erreur radar";
    console.error("Radar error:", err);
  }
}

// -------------------------
// INIT
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadLocalForecast();
  loadRadar();
});
