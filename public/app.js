// -------------------------
// 🌍 TINSFLASH Frontend JS
// Connecté aux APIs backend Render
// -------------------------
const API_BASE = "https://tinsflash-backend.onrender.com"; // backend Render

// -------------------------
// Détecter position + pays
// -------------------------
async function detectCountry(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const data = await res.json();
    return data.address?.country || "Pays inconnu";
  } catch {
    return "Pays inconnu";
  }
}

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
        const desc = data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
        const temp = Math.round(data.data.list?.[0]?.main?.temp) || "N/A";
        container.innerHTML = `<strong>${city}</strong><br>${desc}, ${temp}°C`;
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
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const country = await detectCountry(lat, lon);

      const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (data && data.data) {
        const desc = data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
        const temp = Math.round(data.data.list?.[0]?.main?.temp) || "N/A";
        container.innerHTML = `Prévisions ${country} : ${desc}, ${temp}°C`;
      } else {
        container.innerHTML = "❌ Erreur données nationales";
      }
    });
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
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (data && data.data?.list) {
        container.innerHTML = "";
        for (let i = 0; i < 7; i++) {
          const day = data.data.list[i * 8]; // toutes les 24h
          if (!day) continue;

          const date = new Date(day.dt * 1000);
          const weekday = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
          const desc = day.weather?.[0]?.description || "Pas de données";
          const temp = Math.round(day.main?.temp) || "N/A";
          const icon = day.weather?.[0]?.icon || "01d";

          container.innerHTML += `
            <div class="forecast-day">
              <strong>${weekday}</strong><br>
              <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="meteo"><br>
              ${desc}<br>
              🌡️ ${temp}°C
            </div>
          `;
        }
      }
    });
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions 7 jours";
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
// Lancement auto
// -------------------------
window.onload = () => {
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("forecast-7days")) load7DaysForecast();
  if (document.getElementById("radar")) loadRadar();
};

