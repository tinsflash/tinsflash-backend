// Radar interactif TINSFLASH (version gratuite améliorée)
// Inclut précipitations + neige + vent (open-data RainViewer)

async function loadRadar() {
  const map = L.map("radar-map").setView([50.85, 4.35], 7);

  // Fond de carte OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  try {
    // Charger infos RainViewer
    const res = await fetch("/api/radar");
    const data = await res.json();

    if (!data.tilesUrl || !data.timestampsUrl) {
      console.error("❌ Impossible de charger RainViewer");
      return;
    }

    // Charger timestamps (dernières images disponibles)
    const tsRes = await fetch(data.timestampsUrl);
    const tsData = await tsRes.json();
    const latest = tsData[tsData.length - 1]; // dernière frame radar

    // 📌 Calque précipitations
    const rainLayer = L.tileLayer(
      data.tilesUrl.replace("{time}", latest),
      { opacity: 0.6, attribution: "RainViewer - Pluie" }
    );

    // 📌 Calque neige (utilisation couche alternative si dispo)
    const snowLayer = L.tileLayer(
      "https://tilecache.rainviewer.com/v2/snow/" + latest + "/256/{z}/{x}/{y}/2/1_1.png",
      { opacity: 0.5, attribution: "RainViewer - Neige" }
    );

    // 📌 Calque vent (simulation via flèches)
    const windLayer = L.tileLayer(
      "https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo",
      { opacity: 0.5, attribution: "OpenWeather - Vent" }
    );

    // Ajouter contrôleur de couches
    const overlays = {
      "🌧 Pluie": rainLayer,
      "❄️ Neige": snowLayer,
      "💨 Vent": windLayer
    };

    L.control.layers(null, overlays, { collapsed: false }).addTo(map);

    // Activer pluie par défaut
    rainLayer.addTo(map);

  } catch (err) {
    console.error("Erreur radar:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadRadar);
