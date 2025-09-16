// -------------------------
// 🌍 TINSFLASH Frontend JS
// -------------------------
const API_BASE = "https://tinsflash-backend.onrender.com"; // adapte si besoin

// =========================
// Icônes météo animées
// =========================
function getWeatherIcon(idx) {
  const icons = {
    1: "☀️", // soleil
    2: "🌤", // soleil voilé
    3: "⛅", // nuages épars
    4: "☁️", // nuageux
    5: "🌧", // pluie
    6: "⛈", // orage
    7: "❄️", // neige
    8: "🌫"  // brouillard
  };
  return icons[idx] || "❔";
}

// =========================
// Prévisions locales
// =========================
async function loadLocalForecast() {
  const container = document.getElementById("forecast-local");
  container.innerHTML = "Chargement...";

  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (!data || !data.data) {
        container.innerHTML = "❌ Erreur données locales";
        return;
      }

      const forecast = data.data[0];
      const temp = forecast.t_2m.C;
      const symbol = getWeatherIcon(forecast.weather_symbol_1h.idx);

      container.innerHTML = `
        <div>
          <strong>Votre position</strong><br>
          ${symbol} ${temp}°C
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions locales";
  }
}

// =========================
// Prévisions nationales (Belgique par défaut)
// =========================
async function loadNationalForecast() {
  const container = document.getElementById("forecast-national");
  container.innerHTML = "Chargement...";

  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();

    if (!data || !data.data) {
      container.innerHTML = "❌ Erreur données nationales";
      return;
    }

    const forecast = data.data[0];
    const temp = forecast.t_2m.C;
    const symbol = getWeatherIcon(forecast.weather_symbol_1h.idx);

    container.innerHTML = `
      <div>
        Prévisions Belgique : ${symbol} ${temp}°C
      </div>
    `;
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions nationales";
  }
}

// =========================
// Prévisions 7 jours
// =========================
async function load7DaysForecast() {
  const container = document.getElementById("forecast-7days");
  container.innerHTML = "Chargement...";

  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (!data || !data.data) {
        container.innerHTML = "❌ Erreur données 7 jours";
        return;
      }

      const today = new Date();
      let html = "<div class='days-grid'>";

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i + 1);

        const forecast = data.data[i * 24]; // toutes les 24h
        if (!forecast) continue;

        const temp = forecast.t_2m.C;
        const symbol = getWeatherIcon(forecast.weather_symbol_1h.idx);

        html += `
          <div class="day-card">
            <strong>${date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}</strong><br>
            ${symbol} ${temp}°C
          </div>
        `;
      }

      html += "</div>";
      container.innerHTML = html;
    });
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions 7 jours";
  }
}

// =========================
// Radar pluie/neige/vent
// =========================
function loadRadar() {
  const container = document.getElementById("radar");

  const map = L.map("radar").setView([50.5, 4.5], 6);

  // Fond de carte
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 10,
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // Exemple couche pluie (Meteomatics ou radar externe)
  L.tileLayer.wms("https://nowcast.meteomatics.com/radar", {
    layers: "radar",
    format: "image/png",
    transparent: true
  }).addTo(map);
}

// =========================
// Podcasts météo
// =========================
async function generatePodcast(type) {
  const status = document.getElementById("podcast-status");
  status.innerHTML = "⏳ Génération...";

  try {
    const res = await fetch(`${API_BASE}/podcast/generate?type=${type}`);
    const data = await res.json();

    if (data && data.audioUrl) {
      status.innerHTML = `
        ✅ Podcast généré<br>
        <audio controls>
          <source src="${data.audioUrl}" type="audio/mpeg">
          Votre navigateur ne supporte pas l'audio.
        </audio>
      `;
    } else {
      status.innerHTML = "❌ Erreur génération podcast";
    }
  } catch (err) {
    status.innerHTML = "❌ Erreur podcast";
  }
}

// =========================
// Alertes météo
// =========================
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
            Fiabilité ${alert.reliability}%<br>
            ${alert.description}
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

// =========================
// Lancement auto
// =========================
window.onload = () => {
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("forecast-7days")) load7DaysForecast();
  if (document.getElementById("radar")) loadRadar();
  if (document.getElementById("alerts-local")) loadAlerts();
};
