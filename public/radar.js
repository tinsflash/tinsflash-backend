// -------------------------
// 🛰️ Radar interactif gratuit TINSFLASH
// -------------------------

async function loadRadar() {
  const map = L.map("radar-map").setView([50.85, 4.35], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // Récupération des couches dispo
  try {
    const res = await fetch("/api/radar");
    const data = await res.json();

    const overlays = {};
    const activeLayers = {};

    data.layers.forEach(layer => {
      const tile = L.tileLayer(layer.url, {
        opacity: 0.6,
        attribution: layer.attribution,
        tileSize: 256
      });
      overlays[layer.name] = tile;
      if (layer.type === "rain") {
        tile.addTo(map); // pluie active par défaut
        activeLayers.rain = tile;
      }
    });

    // Contrôle couches
    L.control.layers(null, overlays, { collapsed: false }).addTo(map);

    // Animation timestamps
    if (data.timestampsUrl && activeLayers.rain) {
      const tsRes = await fetch(data.timestampsUrl);
      const tsData = await tsRes.json();
      const timestamps = tsData.radar?.past || [];

      if (timestamps.length > 0) {
        let i = 0;
        setInterval(() => {
          const ts = timestamps[i].time;
          activeLayers.rain.setUrl(
            `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`
          );
          if (overlays["❄️ Neige"] && map.hasLayer(overlays["❄️ Neige"])) {
            overlays["❄️ Neige"].setUrl(
              `https://tilecache.rainviewer.com/v2/snow/${ts}/256/{z}/{x}/{y}/2/1_1.png`
            );
          }
          i = (i + 1) % timestamps.length;
        }, 1500);
      }
    }
  } catch (err) {
    console.error("❌ Erreur radar:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadRadar);
