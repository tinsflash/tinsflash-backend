// public/index.js

// API base (ton backend Render)
const API_BASE = "https://tinsflash-backend.onrender.com/api";

// Fonction utilitaire
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

// === Prévisions locales ===
async function loadLocalForecast() {
  const el = document.getElementById("local-forecast");
  el.innerHTML = "Chargement...";
  const data = await fetchJSON(`${API_BASE}/forecast/local`);

  if (!data) {
    el.innerHTML = "⚠️ Erreur chargement prévisions locales";
    return;
  }

  el.innerHTML = `
    🌡 ${data.temperature_min}°C / ${data.temperature_max}°C <br>
    💨 Vent: ${data.wind} km/h <br>
    🌧 Précipitations: ${data.precipitation} mm <br>
    🔒 Fiabilité: ${data.reliability}% <br>
    📌 ${data.description || ""}
  `;
}

// === Prévisions nationales ===
async function loadNationalForecast() {
  const el = document.getElementById("national-forecast");
  el.innerHTML = "Chargement...";
  const data = await fetchJSON(`${API_BASE}/forecast/national`);

  if (!data) {
    el.innerHTML = "❌ Erreur prévisions nationales";
    return;
  }
  el.innerHTML = `
    📍 ${data.country}<br>
    🌡 ${data.temperature_min}°C / ${data.temperature_max}°C <br>
    💨 Vent: ${data.wind} km/h <br>
    🌧 ${data.precipitation} mm
  `;
}

// === Prévisions 7 jours ===
async function loadForecast7days() {
  const el = document.getElementById("forecast-7days");
  el.innerHTML = "Chargement...";

  const data = await fetchJSON(`${API_BASE}/forecast/7days`);
  if (!data || !Array.isArray(data)) {
    el.innerHTML = "❌ Erreur prévisions 7 jours";
    return;
  }

  el.innerHTML = data
    .map(
      (d) => `
      <div class="day-card">
        <h3>${d.date}</h3>
        <p>🌡 ${d.temperature_min}°C / ${d.temperature_max}°C</p>
        <p>💨 ${d.wind} km/h</p>
        <p>🌧 ${d.precipitation} mm</p>
        <p>🔒 ${d.reliability}%</p>
      </div>`
    )
    .join("");
}

// === Bulletin météo ===
async function loadBulletin() {
  const el = document.getElementById("bulletin");
  el.innerHTML = "Chargement...";
  const data = await fetchJSON(`${API_BASE}/forecast/bulletin`);
  if (!data) {
    el.innerHTML = "❌ Erreur bulletin météo";
    return;
  }
  el.innerHTML = `<p>${data.text}</p>`;
}

// === Alertes météo ===
async function loadAlerts() {
  const el = document.getElementById("alerts");
  el.innerHTML = "Chargement...";
  const data = await fetchJSON(`${API_BASE}/alerts`);
  if (!data || data.length === 0) {
    el.innerHTML = "✅ Aucune alerte en attente";
    return;
  }

  el.innerHTML = data
    .map(
      (a) => `
      <div class="card error">
        <b>⚠️ ${a.message}</b><br>
        Fiabilité: ${a.reliability}%<br>
        📅 ${new Date(a.time).toLocaleString()}
      </div>`
    )
    .join("");
}

// === Radar ===
async function loadRadar() {
  const el = document.getElementById("radar");
  el.innerHTML = "Chargement radar...";

  // RainViewer /api/radar
  const data = await fetchJSON(`${API_BASE}/radar`);
  if (!data || !data.url) {
    el.innerHTML = "❌ Erreur chargement radar";
    return;
  }

  el.innerHTML = `
    <iframe src="${data.url}" width="100%" height="300" style="border:none;border-radius:6px;"></iframe>
  `;
}

// === Podcast météo ===
async function loadPodcast() {
  const el = document.getElementById("podcast");
  const data = await fetchJSON(`${API_BASE}/podcast/latest`);

  if (!data || !data.url) {
    el.innerHTML = "❌ Aucun podcast généré";
    return;
  }

  el.src = data.url;
}

// === Lancer tout au chargement ===
document.addEventListener("DOMContentLoaded", () => {
  loadLocalForecast();
  loadNationalForecast();
  loadForecast7days();
  loadBulletin();
  loadAlerts();
  loadRadar();
  loadPodcast();
});
