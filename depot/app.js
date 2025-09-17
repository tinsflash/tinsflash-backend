// -------------------------
// 🌍 TINSFLASH Frontend JS
// -------------------------
const API_BASE = "https://tinsflash-backend.onrender.com"; 

// Toggle cockpit mode
document.addEventListener("DOMContentLoaded", () => {
  const cockpitToggle = document.getElementById("cockpit-toggle");
  if (cockpitToggle) {
    cockpitToggle.addEventListener("click", () => {
      document.body.classList.toggle("cockpit");
    });
  }

  // Charger selon la page
  if (document.getElementById("forecast-premium")) loadForecast("premium");
  if (document.getElementById("forecast-pro")) loadForecast("pro");
  if (document.getElementById("forecast-proplus")) loadForecast("proplus");
});

// Charger prévisions
async function loadForecast(type) {
  const el = document.getElementById(`forecast-${type}`);
  el.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast/national?type=${type}`);
    const data = await res.json();
    if (data?.combined) {
      el.innerHTML = `
        🌡️ ${data.combined.temperature}°C<br>
        ${data.combined.description}<br>
        💨 Vent: ${data.combined.wind} km/h<br>
        ☔ Précipitation: ${data.combined.precipitation} mm<br>
        🔒 Fiabilité: ${data.combined.reliability}%
      `;
    } else {
      el.innerHTML = "❌ Erreur données météo";
    }
  } catch (err) {
    el.innerHTML = "❌ Erreur prévisions";
  }
}

// Charger podcast
async function loadPodcast(type) {
  const el = document.getElementById(`podcast-${type}`);
  el.innerHTML = "⏳ Génération podcast...";
  try {
    const res = await fetch(`${API_BASE}/podcast/generate?type=${type}-evening`);
    const data = await res.json();
    if (data?.forecast) {
      el.innerHTML = `
        ✅ ${data.forecast}<br>
        <audio controls>
          <source src="${data.audioUrl}" type="audio/mpeg">
        </audio>
      `;
    } else {
      el.innerHTML = "❌ Erreur podcast";
    }
  } catch (err) {
    el.innerHTML = "❌ Podcast indisponible";
  }
}
