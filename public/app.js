// -------------------------
// 🌍 TINSFLASH Frontend JS
// -------------------------
const API_BASE = "https://tinsflash-backend.onrender.com"; 
const API_KEY = "caa7e7cf852152448c239c001a1cf98f"; // OpenWeather

// -------------------------
// Radar interactif avec timeline
// -------------------------
let radarMap, radarLayers = [], radarInterval, currentFrame = 0;

function initRadar() {
  radarMap = L.map("radar-map").setView([20, 0], 2); // Vue monde

  // Fond carte sombre
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OSM",
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(radarMap);

  // Génère 7 frames (maintenant + 6 heures futures)
  for (let i = 0; i <= 6; i++) {
    const timestamp = Math.floor(Date.now() / 1000) + i * 3600;
    const layer = L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}&ts=${timestamp}`,
      { opacity: 0 }
    ).addTo(radarMap);
    radarLayers.push(layer);
  }

  updateRadarFrame(0);
}

// Met à jour frame affichée
function updateRadarFrame(frame) {
  radarLayers.forEach((layer, i) => layer.setOpacity(i === frame ? 0.7 : 0));
  currentFrame = frame;
  document.getElementById("radar-slider").value = frame;
  document.getElementById("radar-time").innerText =
    frame === 0 ? "Maintenant" : `+${frame}h`;
}

function playRadar() {
  clearInterval(radarInterval);
  radarInterval = setInterval(() => {
    let nextFrame = (currentFrame + 1) % radarLayers.length;
    updateRadarFrame(nextFrame);
  }, 1000);
}

function pauseRadar() {
  clearInterval(radarInterval);
}

document.getElementById("radar-slider").addEventListener("input", (e) => {
  updateRadarFrame(parseInt(e.target.value));
});

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

      if (data && data.data) {
        const city = data.data.city?.name || "Votre position";
        const list = data.data.list?.slice(0, 7) || [];
        container.innerHTML = `<h3>${city}</h3>`;
        list.forEach((f, i) => {
          const date = new Date(f.dt * 1000);
          const day = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
          const desc = f.weather?.[0]?.description || "n/a";
          const temp = f.main?.temp || "N/A";
          container.innerHTML += `<div>📅 ${day} → ${desc}, ${temp}°C</div>`;
        });
      } else {
        container.innerHTML = "❌ Erreur données locales";
      }
    });
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions locales";
  }
}

// -------------------------
// Prévisions nationales (Belgique défaut)
// -------------------------
async function loadNationalForecast() {
  const container = document.getElementById("forecast-national");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();

    if (data && data.data) {
      const desc = data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
      const temp = data.data.list?.[0]?.main?.temp || "N/A";
      container.innerHTML = `Prévisions nationales 🇧🇪 : ${desc}, ${temp}°C`;
    } else {
      container.innerHTML = "❌ Erreur données nationales";
    }
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions nationales";
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
    if (data && data.forecast) {
      status.innerHTML = `
        ✅ ${data.forecast}<br>
        <audio controls>
          <source src="${data.audioUrl}" type="audio/mpeg">
        </audio>
      `;
    } else {
      status.innerHTML = "❌ Erreur génération podcast";
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
            ⚠️ [${alert.level.toUpperCase()}] ${alert.type} 
            (fiabilité ${alert.reliability}%)<br>
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

// -------------------------
// Auto lancement
// -------------------------
window.onload = () => {
  if (document.getElementById("radar-map")) initRadar();
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("alerts-local")) loadAlerts();
};
