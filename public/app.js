const API_BASE = "https://tinsflash-backend.onrender.com/api";

// 📍 Prévisions locales
async function loadLocalForecast() {
  const c = document.getElementById("local-content");
  if (!c) return;
  c.innerHTML = "⏳ Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      c.innerHTML = `<strong>Votre position</strong><br>${data.combined.description}, ${data.combined.temperature}°C`;
      document.getElementById("bulletin-text").innerHTML =
        `Aujourd'hui, prévisions locales : ${data.combined.description}, avec une température proche de ${data.combined.temperature}°C.`;
    });
  } catch {
    c.innerHTML = "❌ Erreur prévisions locales";
  }
}

// 🏳️ Prévisions nationales
async function loadNationalForecast() {
  const c = document.getElementById("national-content");
  if (!c) return;
  c.innerHTML = "⏳ Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast/national?country=BE`);
    const data = await res.json();
    c.innerHTML = `<strong>Belgique</strong><br>${data.combined.description}, ${data.combined.temperature}°C`;
  } catch {
    c.innerHTML = "❌ Erreur prévisions nationales";
  }
}

// 📅 Prévisions 7 jours
async function load7Days() {
  const c = document.getElementById("days-container");
  if (!c) return;
  c.innerHTML = "⏳ Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast/7days?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      c.innerHTML = "";
      data.days.forEach(d => {
        c.innerHTML += `
          <div class="day-card">
            <strong>${d.jour}</strong>
            <div class="icon">${d.icone}</div>
            <div>${d.description}</div>
            <div>${d.temperature_min}°C / ${d.temperature_max}°C</div>
            <div>💨 ${d.vent} km/h</div>
            <div>🌧️ ${d.precipitation} mm</div>
          </div>
        `;
      });
    });
  } catch {
    c.innerHTML = "❌ Erreur prévisions 7 jours";
  }
}

// 🌧️ Radar
async function loadRadar() {
  const c = document.getElementById("radar-content");
  if (!c) return;
  c.innerHTML = "⏳ Chargement radar...";
  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();
    c.innerHTML = `<img src="${data.radarUrl}" alt="Radar météo">`;
  } catch {
    c.innerHTML = "❌ Erreur radar";
  }
}

// 🎙️ Podcasts gratuits
async function generatePodcast(type) {
  const status = document.getElementById("podcast-status");
  if (!status) return;
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
  } catch {
    status.innerHTML = "❌ Erreur podcast";
  }
}

// ⚠️ Alertes
async function loadAlerts() {
  const local = document.getElementById("alerts-local");
  const world = document.getElementById("alerts-world");
  if (!local || !world) return;
  local.innerHTML = "⏳ Chargement...";
  world.innerHTML = "⏳ Chargement...";
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    const data = await res.json();
    local.innerHTML = "";
    data.alerts.forEach(a => {
      local.innerHTML += `
        <div class="alert ${a.level}">
          ⚠️ [${a.level}] ${a.type} (${a.reliability}%)<br>${a.description}
        </div>
      `;
    });
    world.innerHTML = `🌍 ${data.external?.weather?.[0]?.description || "Pas d'alerte mondiale"}`;
  } catch {
    local.innerHTML = "❌ Erreur alertes locales";
    world.innerHTML = "❌ Erreur alertes mondiales";
  }
}

// 🛰️ Switch cockpit
document.addEventListener("click", (e) => {
  if (e.target.id === "toggle-cockpit") {
    document.body.classList.toggle("cockpit-active");
  }
});

// 🚀 Auto lancement
window.onload = () => {
  loadLocalForecast();
  loadNationalForecast();
  load7Days();
  loadRadar();
  loadAlerts();
};
