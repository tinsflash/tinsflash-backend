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
      const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (data?.data) {
        const now = new Date();
        const city = data.data.city?.name || "Votre position";
        const desc = data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
        const temp = data.data.list?.[0]?.main?.temp || "N/A";

        container.innerHTML = `
          <strong>${city}</strong><br>
          Il est ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.<br>
          ${desc}, ${temp}°C
        `;
      } else {
        container.innerHTML = "❌ Erreur données locales";
      }
    });
  } catch {
    container.innerHTML = "❌ Erreur prévisions locales";
  }
}

// -------------------------
// Prévisions nationales (Belgique)
// -------------------------
async function loadNationalForecast() {
  const container = document.getElementById("forecast-national");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();

    if (data?.data) {
      const desc = data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
      const temp = data.data.list?.[0]?.main?.temp || "N/A";
      container.innerHTML = `Prévisions Belgique : ${desc}, ${temp}°C`;
    } else {
      container.innerHTML = "❌ Erreur données nationales";
    }
  } catch {
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
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();

    if (data?.data?.list) {
      container.innerHTML = "";
      const days = {};

      data.data.list.forEach((item) => {
        const date = new Date(item.dt_txt);
        const day = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
        if (!days[day]) {
          days[day] = item;
        }
      });

      Object.entries(days).forEach(([day, item]) => {
        const temp = item.main.temp;
        const icon = item.weather[0].icon;
        const desc = item.weather[0].description;

        container.innerHTML += `
          <div class="day-card">
            <h3>${day}</h3>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
            <p>${desc}</p>
            <p>${temp}°C</p>
          </div>
        `;
      });
    } else {
      container.innerHTML = "❌ Pas de données 7 jours";
    }
  } catch {
    container.innerHTML = "❌ Erreur 7 jours";
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
    if (data?.radarUrl) {
      container.innerHTML = `<img src="${data.radarUrl}" alt="Radar météo">`;
    } else {
      container.innerHTML = "❌ Erreur radar";
    }
  } catch {
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
    if (data?.forecast) {
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
  } catch {
    status.innerHTML = "❌ Erreur podcast";
  }
}

// -------------------------
// Lancement auto
// -------------------------
window.onload = () => {
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("forecast-7days")) load7DaysForecast();
  if (document.getElementById("radar")) loadRadar();
};

