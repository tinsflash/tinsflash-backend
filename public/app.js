// -------------------------
// 🌍 TINSFLASH Frontend
// -------------------------
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
      if (!data?.combined) throw new Error("Données locales indisponibles");
      c.innerHTML = `
        📍 Votre position<br>
        ${data.combined.description}, ${data.combined.temperature}°C<br>
        Fiabilité : ${data.combined.reliability}%
      `;
    });
  } catch (err) {
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
    if (!data?.combined) throw new Error("Données nationales indisponibles");
    c.innerHTML = `
      🇧🇪 Prévisions nationales<br>
      ${data.combined.description}, ${data.combined.temperature}°C<br>
      Fiabilité : ${data.combined.reliability}%
    `;
  } catch (err) {
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
      if (!data?.days) throw new Error("Données 7 jours indisponibles");
      c.innerHTML = "";
      data.days.forEach(d => {
        c.innerHTML += `
          <div class="day-card">
            <strong>${d.jour}</strong><br>
            <div class="icon">${d.icone}</div>
            <div>${d.description}</div>
            <div>🌡️ ${d.temperature_min}°C / ${d.temperature_max}°C</div>
            <div>💨 ${d.vent} km/h</div>
            <div>🌧️ ${d.precipitation} mm</div>
          </div>
        `;
      });
    });
  } catch (err) {
    c.innerHTML = "❌ Erreur prévisions 7 jours";
  }
}

// -------------------------
// Radar
// -------------------------
async function loadRadar() {
  const c = document.getElementById("radar-content");
  c.innerHTML = "⏳ Chargement radar...";
  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();
    if (!data?.radarUrl) throw new Error("Radar indisponible");
    c.innerHTML = `<img src="${data.radarUrl}" alt="Radar météo" style="width:100%;border-radius:10px;">`;
  } catch {
    c.innerHTML = "❌ Erreur radar";
  }
}

// -------------------------
// Podcasts
// -------------------------
async function generatePodcast(type) {
  const status = document.getElementById("podcast-status");
  status.innerHTML = "⏳ Génération...";
  try {
    const res = await fetch(`${API_BASE}/podcast/generate?type=${type}`);
    const data = await res.json();
    if (!data?.forecast) throw new Error("Erreur génération podcast");
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
  local.innerHTML = "⏳ Chargement...";
  world.innerHTML = "⏳ Chargement...";
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    const data = await res.json();
    if (!data?.alerts) throw new Error("Alertes indisponibles");

    local.innerHTML = "";
    data.alerts.forEach(a => {
      local.innerHTML += `
        <div class="alert ${a.level}">
          ⚠️ [${a.level.toUpperCase()}] ${a.type} (${a.reliability}%)<br>
          ${a.description}
        </div>
      `;
    });

    if (data?.external) {
      world.innerHTML = `🌍 ${data.external.weather?.[0]?.description || "n/a"}`;
    }
  } catch (err) {
    local.innerHTML = "❌ Erreur alertes locales";
    world.innerHTML = "❌ Erreur alertes mondiales";
  }
}

// -------------------------
// Auto lancement
// -------------------------
window.onload = () => {
  loadLocalForecast();
  loadNationalForecast();
  load7Days();
  loadRadar();
  loadAlerts();
};
