// -------------------------
// 🛰️ Radar interactif TINSFLASH
// Basé sur Leaflet + RainViewer (pluie/neige) + Windy OpenData (vent)
// -------------------------

async function loadRadar() {
  // Initialisation carte
  const map = L.map("radar-map").setView([50.85, 4.35], 7);

  // Fond de carte OSM
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // 📡 1. Précipitations (RainViewer)
  const rainLayer = L.tileLayer(
    "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
    {
      opacity: 0.6,
      attribution: "Radar RainViewer"
    }
  );

  // ❄️ 2. Neige (RainViewer snow overlay → optionnel si dispo)
  const snowLayer = L.tileLayer(
    "https://tilecache.rainviewer.com/v2/snow/{time}/256/{z}/{x}/{y}/2/1_1.png",
    {
      opacity: 0.5,
      attribution: "Neige RainViewer"
    }
  );

  // 🌬️ 3. Vent (données Windy public → basique)
  const windLayer = L.tileLayer(
    "https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02",
    {
      opacity: 0.5,
      attribution: "Vent OWM demo"
    }
  );

  // Groupes
  const overlays = {
    "🌧️ Précipitations": rainLayer,
    "❄️ Neige": snowLayer,
    "🌬️ Vent": windLayer
  };

  // Ajout du contrôle de couches
  L.control.layers(null, overlays, { collapsed: false }).addTo(map);

  // Active par défaut pluie
  rainLayer.addTo(map);

  // Animation (timestamps RainViewer)
  try {
    const res = await fetch("/api/radar");
    const data = await res.json();

    if (data.timestampsUrl) {
      const tsRes = await fetch(data.timestampsUrl);
      const tsData = await tsRes.json();
      const timestamps = tsData.radar?.past || [];

      if (timestamps.length > 0) {
        let i = 0;
        setInterval(() => {
          const ts = timestamps[i].time;
          rainLayer.setUrl(
            `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`
          );
          i = (i + 1) % timestamps.length;
        }, 1500);
      }
    }
  } catch (err) {
    console.error("❌ Erreur radar :", err);
  }
}

// Charger au démarrage
document.addEventListener("DOMContentLoaded", loadRadar);
