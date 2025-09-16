// -------------------------
// 🌍 TINSFLASH Frontend JS
// Connexion API backend
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
      const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (data && data.combined) {
        const desc = data.combined.description;
        const temp = data.combined.temperature;
        const wind = data.combined.wind;
        const prec = data.combined.precipitation;
        const reliability = data.combined.reliability;

        container.innerHTML = `
          <strong>Votre localisation</strong><br>
          🌡️ ${temp}°C | 💨 ${wind} m/s | ☔ ${prec} mm<br>
          ${desc}<br>
          🔒 Fiabilité : ${reliability}%
        `;
      } else {
        container.innerHTML = "❌ Erreur données locales";
      }
    });
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions locales";
  }
}

// -------------------------
// Prévisions nationales (par défaut = Belgique, mais mondial si user change IP)
// -------------------------
async function loadNationalForecast() {
  const container = document.getElementById("forecast-national");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();
    if (data && data.combined) {
      const desc = data.combined.description;
      const temp = data.combined.temperature;
      container.innerHTML = `
        Prévisions nationales (Belgique) :<br>
        🌡️ ${temp}°C, ${desc}
      `;
    } else {
      container.innerHTML = "❌ Erreur données nationales";
    }
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions nationales";
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
    if (data && data.radarUrl) {
      container.innerHTML = `<img src="${data.radarUrl}" alt="Radar météo" style="width:100%">`;
    } else {
      container.innerHTML = "❌ Erreur radar";
    }
  } catch (err) {
    container.innerHTML = "❌ Radar indisponible";
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
    if (data && data.forecast) {
      status.innerHTML = `
        ✅ ${data.forecast}<br>
        <audio controls>
          <source src="${data.audioUrl}" type="audio/mpeg">
        </audio>
      `;
    } else {
      status.innerHTML = "❌ Erreur podcast";
    }
  } catch (err) {
    status.innerHTML = "❌ Erreur podcast";
  }
}

// -------------------------
// Alertes météo
// -------------------------
async function loadAlerts() {
  const local = document.getElementById("alerts-local");
  const world = document.getElementById("alerts-world");
  local.innerHTML = "Chargement...";
  world.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    const data = await res.json();
    if (data && data.alerts) {
      local.innerHTML = "";
      data.alerts.forEach(alert => {
        local.innerHTML += `
          <div class="alert ${alert.level}">
            ⚠️ [${alert.level.toUpperCase()}] ${alert.type}<br>
            ${alert.description} (Fiabilité ${alert.reliability}%)
          </div>
        `;
      });
    }
    if (data && data.external) {
      world.innerHTML = `
        🌍 Source externe : ${data.external.weather?.[0]?.description || "n/a"}
      `;
    }
  } catch (err) {
    local.innerHTML = "❌ Erreur alertes locales/nationales";
    world.innerHTML = "❌ Erreur alertes mondiales";
  }
}

// -------------------------
// Auto lancement
// -------------------------
window.onload = () => {
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("radar")) loadRadar();
  if (document.getElementById("alerts-local")) loadAlerts();
};
