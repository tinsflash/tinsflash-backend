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
      if (data && data.data) {
        const city = data.data.city?.name || "Votre position";
        const desc = data.data.list?.[0]?.weather?.[0]?.description || "Pas de données";
        const temp = data.data.list?.[0]?.main?.temp || "N/A";
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
// Prévisions nationales (Belgique par défaut)
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
      container.innerHTML = `Prévisions Belgique : ${desc}, ${temp}°C`;
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
async function loadWeeklyForecast() {
  const container = document.getElementById("forecast-week");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast?lat=50.5&lon=4.5`);
    const data = await res.json();
    if (data && data.data) {
      container.innerHTML = "";
      const list = data.data.list.slice(0, 7);
      list.forEach((day, i) => {
        const desc = day.weather?.[0]?.description || "n/a";
        const temp = day.main?.temp || "N/A";
        container.innerHTML += `
          <div class="day">
            <h3>Jour ${i + 1}</h3>
            <p>${desc}</p>
            <p>${temp}°C</p>
          </div>
        `;
      });
    }
  } catch (err) {
    container.innerHTML = "❌ Erreur prévisions 7 jours";
  }
}

// -------------------------
// Radar pluie/neige
// -------------------------
async function loadRadar() {
  const container = document.getElementById("radar");
  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();
    if (data && data.radarUrl) {
      container.innerHTML = `<img src="${data.radarUrl}" alt="Radar météo">`;
    }
  } catch (err) {
    container.innerHTML = "❌ Radar indisponible";
  }
}

// -------------------------
// Buienalarm++ maison
// -------------------------
function loadBuienalarm() {
  const ctx = document.getElementById("buienalarmChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Maintenant", "+15min", "+30min", "+45min", "+1h"],
      datasets: [
        { label: "Pluie (mm)", data: [0, 1, 3, 2, 0], borderColor: "blue", fill: false },
        { label: "Neige (cm)", data: [0, 0, 1, 1, 0], borderColor: "gray", fill: false },
        { label: "Vent (km/h)", data: [10, 20, 30, 25, 15], borderColor: "green", fill: false }
      ]
    }
  });
  document.getElementById("buienalarm-text").innerHTML =
    "🌧️ Prévision : Pluie modérée attendue dans la prochaine heure, vent en hausse.";
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
      status.innerHTML = "❌ Erreur podcast";
    }
  } catch (err) {
    status.innerHTML = "❌ Erreur podcast";
  }
}

// -------------------------
// Auto load
// -------------------------
window.onload = () => {
  if (document.getElementById("forecast-local")) loadLocalForecast();
  if (document.getElementById("forecast-national")) loadNationalForecast();
  if (document.getElementById("forecast-week")) loadWeeklyForecast();
  if (document.getElementById("radar")) loadRadar();
  if (document.getElementById("buienalarmChart")) loadBuienalarm();
};
