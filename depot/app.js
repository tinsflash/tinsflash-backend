// -------------------------
// 🌍 TINSFLASH Frontend JS
// -------------------------
const API_BASE = "https://tinsflash-backend.onrender.com"; 

// -------------------------
// Prévisions locales
// -------------------------
async function loadLocalForecast() {
  const container = document.getElementById("forecast-local");
  container.innerHTML = "Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const res = await fetch(`${API_BASE}/forecast/local?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      container.innerHTML = `
        <strong>Votre position</strong><br>
        🌡️ ${data.combined.temperature}°C<br>
        ${data.combined.description}<br>
        💨 Vent: ${data.combined.wind} km/h<br>
        ☔ Précipitations: ${data.combined.precipitation} mm
      `;
    });
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions locales";
  }
}

// -------------------------
// Prévisions nationales
// -------------------------
async function loadNationalForecast() {
  const container = document.getElementById("forecast-national");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast/national?country=BE`);
    const data = await res.json();
    container.innerHTML = `
      🌍 National: ${data.combined.description}<br>
      🌡️ ${data.combined.temperature}°C
    `;
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions nationales";
  }
}

// -------------------------
// Prévisions 7 jours
// -------------------------
async function load7DaysForecast() {
  const container = document.getElementById("forecast-7days");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast/7days?lat=50.5&lon=4.5`);
    const data = await res.json();
    container.innerHTML = data.days.map(day => `
      <div>
        📅 ${day.jour}: ${day.temperature_min}°C → ${day.temperature_max}°C
        (${day.description}) ${day.icone}
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions 7 jours";
  }
}

// -------------------------
// Radar
// -------------------------
async function loadRadar() {
  const container = document.getElementById("radar");
  container.innerHTML = "Chargement radar...";
  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();
    container.innerHTML = `<img src="${data.radarUrl}" alt="Radar météo">`;
  } catch (err) {
    container.innerHTML = "❌ Radar indisponible";
  }
}

// -------------------------
// Podcasts météo
// -------------------------
async function generatePodcast(type) {
  const status = document.getElementById("podcast-status");
  status.innerHTML = "⏳ Génération...";
  try {
    const res = await fetch(`${API_BASE}/podcast/generate?type=${type}`);
    const data = await res.json();
    status.innerHTML = `
      ✅ ${data.forecast}<br>
      <audio controls>
        <source src="${data.audioUrl}" type="audio/mpeg">
      </audio>
    `;
  } catch (err) {
    status.innerHTML = "❌ Erreur podcast";
  }
}

// -------------------------
// Alertes
// -------------------------
async function loadAlerts() {
  const local = document.getElementById("alerts-local");
  const world = document.getElementById("alerts-world");
  local.innerHTML = "Chargement...";
  world.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    const data = await res.json();
    local.innerHTML = data.alerts.map(a => `
      <div class="alert ${a.level}">
        ⚠️ [${a.level.toUpperCase()}] ${a.type} 
        (fiabilité ${a.reliability}%)<br>
        Région: ${a.region}
      </div>
    `).join("");
    world.innerHTML = "🌍 Sources externes analysées...";
  } catch (err) {
    local.innerHTML = "❌ Erreur alertes locales";
    world.innerHTML = "❌ Erreur alertes mondiales";
  }
}

// -------------------------
// Auto-load
// -------------------------
window.onload = () => {
  loadLocalForecast();
  loadNationalForecast();
  load7DaysForecast();
  loadRadar();
  loadAlerts();
};
