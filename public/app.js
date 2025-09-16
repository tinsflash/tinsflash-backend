// -------------------------
// 🌍 TINSFLASH Frontend JS
// -------------------------
const API_BASE = "https://tinsflash-backend.onrender.com"; // ⚡ ton backend Render

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
        const forecast = data.data.list?.[0];
        const desc = forecast?.weather?.[0]?.description || "Pas de données";
        const temp = forecast?.main?.temp || "N/A";
        const icon = forecast?.weather?.[0]?.icon || "01d";

        container.innerHTML = `
          <strong>${city}</strong><br>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon">
          ${desc}, ${temp}°C
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
// Prévisions nationales
// -------------------------
async function loadNationalForecast() {
  const container = document.getElementById("forecast-national");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();

    if (data && data.data) {
      const forecast = data.data.list?.[0];
      const desc = forecast?.weather?.[0]?.description || "Pas de données";
      const temp = forecast?.main?.temp || "N/A";
      const icon = forecast?.weather?.[0]?.icon || "01d";

      container.innerHTML = `
        🇧🇪 Prévisions nationales : <br>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon">
        ${desc}, ${temp}°C
      `;
    } else {
      container.innerHTML = "❌ Erreur données nationales";
    }
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions nationales";
  }
}

// -------------------------
// Prévisions 7 jours
// -------------------------
async function load7DayForecast() {
  const container = document.getElementById("forecast-seven");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();

    if (data && data.data && data.data.list) {
      container.innerHTML = "";
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const f = data.data.list[i * 8]; // 1 point par jour
        if (!f) continue;

        const date = new Date(today);
        date.setDate(today.getDate() + i + 1);
        const dayName = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
        const temp = f.main?.temp || "N/A";
        const icon = f.weather?.[0]?.icon || "01d";

        container.innerHTML += `
          <div class="forecast-day">
            <strong>${dayName}</strong><br>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon">
            ${temp}°C
          </div>
        `;
      }
    }
  } catch (err) {
    container.innerHTML = "❌ Erreur 7 jours";
  }
}

// -------------------------
// Radar pluie/neige/vent
// -------------------------
async function loadRadar() {
  const container = document.getElementById("radar");
  container.innerHTML = "Chargement radar...";
  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();
    if (data && data.radarUrl) {
      container.innerHTML = `<img src="${data.radarUrl}" alt="Radar météo">`;
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
      data.alerts.forEach(alert => {
        const color = alert.level === "rouge" ? "red" : (alert.level === "orange" ? "orange" : "green");
        local.innerHTML += `
          <div class="alert ${color}">
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
// Lancement auto
// -------------------------
window.onload = () => {
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("forecast-seven")) load7DayForecast();
  if (document.getElementById("radar")) loadRadar();
  if (document.getElementById("alerts-local")) loadAlerts();
};
// -------------------------
// 🎬 Gestion vidéo J.E.A.N
// -------------------------
function revoirIntro() {
  const video = document.getElementById("introVideo");
  video.currentTime = 0;
  video.play();
}

// Vérifie si la vidéo a déjà été vue
window.onload = () => {
  // Prévisions & radar
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("radar")) loadRadar();
  if (document.getElementById("alerts-local")) loadAlerts();

  // Gestion intro J.E.A.N
  const introSeen = localStorage.getItem("introSeen");
  const video = document.getElementById("introVideo");

  if (!introSeen) {
    // Lance auto la 1ère fois
    video.play();
    // Marque comme vu
    localStorage.setItem("introSeen", "true");
  }
};



