// -------------------------
// 🌍 radar.js
// Radar météo mondial connecté à forecastService
// -------------------------

const API_BASE = "https://tinsflash-backend.onrender.com/api"; // adapte si besoin
let map;

async function initRadar() {
  const container = document.getElementById("radar-content");
  container.innerHTML = ""; // reset

  // Initialisation carte Leaflet
  map = L.map("radar-content").setView([50.5, 4.5], 5);

  // Fond OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  // Couches météo dynamiques
  const precip = L.tileLayer(
    "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=" +
      OPENWEATHER_KEY,
    { opacity: 0.6 }
  );
  const snow = L.tileLayer(
    "https://tile.openweathermap.org/map/snow/{z}/{x}/{y}.png?appid=" +
      OPENWEATHER_KEY,
    { opacity: 0.6 }
  );
  const wind = L.tileLayer(
    "https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=" +
      OPENWEATHER_KEY,
    { opacity: 0.5 }
  );

  const overlays = {
    "🌧️ Pluie": precip,
    "❄️ Neige": snow,
    "💨 Vent": wind,
  };

  precip.addTo(map);
  L.control.layers(null, overlays).addTo(map);

  // Loader style NASA
  const loader = document.createElement("div");
  loader.className = "radar-loader";
  loader.innerHTML = "⏳ Analyse des modèles météo en cours...";
  container.appendChild(loader);

  // Récup fiabilité depuis ton backend
  try {
    const res = await fetch(`${API_BASE}/forecast/national?country=BE`);
    const data = await res.json();

    loader.remove();

    const reliability = document.createElement("div");
    reliability.className = "radar-reliability";
    reliability.innerHTML = `Indice de fiabilité : ${data.reliability || 90}%`;
    container.appendChild(reliability);
  } catch (err) {
    loader.innerHTML = "❌ Erreur chargement fiabilité";
  }
}

window.addEventListener("load", () => {
  initRadar();
});
