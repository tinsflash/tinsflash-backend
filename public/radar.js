// Radar météo amélioré (gratuit) basé sur RainViewer + OpenWeather Layers
// Inclut pluie, neige et vent 🌧️❄️💨

async function loadRadar() {
  const map = L.map("radar-map").setView([50.85, 4.35], 7);

  // Fond de carte OSM
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  try {
    // 🌧️ Radar pluie (RainViewer)
    const radarLayer = L.tileLayer(
      "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
      {
        attribution: "Radar RainViewer",
        opacity: 0.6
      }
    );
    radarLayer.addTo(map);

    // ❄️ Neige (OpenWeather)
    const snowLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/snow/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`,
      {
        attribution: "Neige © OpenWeather",
        opacity: 0.5
      }
    );
    snowLayer.addTo(map);

    // 💨 Vent (OpenWeather)
    const windLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/wind/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`,
      {
        attribution: "Vent © OpenWeather",
        opacity: 0.5
      }
    );
    windLayer.addTo(map);

    // Contrôles des calques
    L.control.layers(
      {
        "Carte OSM": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
      },
      {
        "🌧️ Pluie (Radar)": radarLayer,
        "❄️ Neige": snowLayer,
        "💨 Vent": windLayer
      }
    ).addTo(map);

  } catch (err) {
    console.error("❌ Erreur radar :", err);
    document.getElementById("radar-map").innerText =
      "Erreur de chargement du radar météo.";
  }
}

document.addEventListener("DOMContentLoaded", loadRadar);
