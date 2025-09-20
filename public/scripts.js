const API_BASE = "https://tinsflash-backend.onrender.com/api";

// -------------------------
// Prévisions locales
// -------------------------
async function loadLocalForecast() {
  const c = document.getElementById("local-forecast");
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
  const c = document.getElementById("national-forecast");
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
  const c = document.getElementById("forecast-7days");
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

      generateForecastText(data.days);
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
    document.getElementById("bulletin").innerText = "⚠️ Données insuffisantes.";
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

  document.getElementById("bulletin").innerText = text;

  loadPodcast(text);
}

// -------------------------
// Alertes météo
// -------------------------
async function loadAlerts() {
  const c = document.getElementById("alerts");
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
    const res = await fetch(`${API_BASE}/podcast/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textBulletin })
    });
    const data = await res.json();

    const audio = document.getElementById("podcast");
    audio.src = data.audioUrl;
  } catch (err) {
    document.getElementById("podcast").innerText = "❌ Erreur podcast";
  }
}

// -------------------------
// INIT
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadLocalForecast();
  loadNationalForecast();
  load7Days();
  loadAlerts();
  loadRadar(); // vient de radar.js
});
