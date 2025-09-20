// Radar interactif basé sur Rainviewer et Leaflet

async function loadRadar() {
  const map = L.map("radar-map").setView([50.85, 4.35], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  try {
    const res = await fetch("/api/radar");
    const data = await res.json();

    if (data.layers && data.layers.length > 0) {
      const timestamps = await (await fetch("https://api.rainviewer.com/public/maps.json")).json();
      const last = timestamps[timestamps.length - 1];

      data.layers.forEach(layer => {
        const radarLayer = L.tileLayer(layer.url.replace("{time}", last), {
          attribution: layer.attribution,
          tileSize: 256,
          opacity: 0.6
        });
        radarLayer.addTo(map);
      });
    }
  } catch (err) {
    console.error("Erreur radar:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadRadar);
