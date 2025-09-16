// -------------------------
// 🌍 TINSFLASH Frontend JS
// Connecte le site aux APIs backend (Render)
// -------------------------
const API_BASE = "https://tinsflash-backend.onrender.com";

// -------------------------
// Prévisions locales
// -------------------------
async function loadLocalForecast() {
  const container = document.getElementById("forecast-local");
  container.innerHTML = "Chargement...";

  try {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        if (data && data.data) {
          const city = data.data.city?.name || "Votre position";
          const desc =
            data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
          const temp = data.data.list?.[0]?.main?.temp || "N/A";
          container.innerHTML = `
            <strong>${city}</strong><br>
            ${desc}, ${temp}°C
          `;
        } else {
          container.innerHTML = "❌ Erreur données locales";
        }
      },
      () => {
        container.innerHTML =
          "❌ Géolocalisation refusée. Impossible de charger les prévisions locales.";
      }
    );
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions locales";
  }
}

// -------------------------
// Prévisions nationales (Belgique par défaut)
// -------------------------
async function loadNationalForecast() {
  const container = document.getElementById("forecast-national");
  container.innerHTML = "Chargement...";

  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();

    if (data && data.data) {
      const desc =
        data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
      const temp = data.data.list?.[0]?.main?.temp || "N/A";
      container.innerHTML = `Prévisions Belgique : ${desc}, ${temp}°C`;
    } else {
      container.innerHTML = "❌ Erreur données nationales";
    }
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions nationales";
  }
}

// -------------------------
// Radar pluie/neige
// -------------------------
async function loadRadar() {
  const container = document.getElementById("radar");
  container.innerHTML = "Chargement radar...";

  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();

    if (data && data.radarUrl) {
      container.innerHTML = `
        <img src="${data.radarUrl}" alt="Radar météo" style="max-width:100%">
      `;
    } else {
      container.innerHTML = "❌ Erreur radar";
    }
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

    if (data && data.forecast) {
      status.innerHTML = `
        ✅ ${data.forecast}<br>
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
      data.alerts.forEach((alert) => {
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
        🌍 Source externe : ${
          data.external.weather?.[0]?.description || "n/a"
        }
      `;
    }
  } catch (err) {
    local.innerHTML = "❌ Erreur alertes locales/nationales";
    world.innerHTML = "❌ Erreur alertes mondiales";
  }
}

// -------------------------
// Lancement auto au chargement
// -------------------------
window.onload = () => {
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("radar")) loadRadar();
  if (document.getElementById("alerts-local")) loadAlerts();
};

