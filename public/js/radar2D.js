// ==========================================================
// 🌍 TINSFLASH – radar2D.js (v1.0 REAL CONNECTED)
// ==========================================================
// Fusion Windy + RainViewer + relief réel via Leaflet
// Utilisé sur : index.html / premium.html / pro.html
// ==========================================================

const radar2D = (() => {
  let map;
  let rainLayer, windyFrame;
  const layerGroup = L.layerGroup();

  // 🌐 Initialisation de la carte
  async function initRadar() {
    try {
      map = L.map("radar2D-map", {
        zoomControl: true,
        attributionControl: true,
        worldCopyJump: true,
      }).setView([20, 0], 2);

      // 🌎 Fond topo / relief
      const topo = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        { maxZoom: 18, attribution: "&copy; OpenTopoMap" }
      ).addTo(map);

      // ☁️ RainViewer (pluie en direct)
      const rvURL =
        "https://tilecache.rainviewer.com/v2/radar/nowcast_0/512/{z}/{x}/{y}/2/1_1.png";
      rainLayer = L.tileLayer(rvURL, {
        opacity: 0.6,
        zIndex: 400,
        attribution: "&copy; RainViewer",
      }).addTo(map);

      // 🌬️ Vent (overlay Windy iframe)
      const windyFrameHTML = `
        <iframe
          id="windyRadar"
          src="https://embed.windy.com/embed2.html?lat=48&lon=5&zoom=3&level=surface&overlay=wind"
          frameborder="0"
          width="100%"
          height="100%"
          style="border:none;border-radius:10px;"
        ></iframe>`;
      const windyDiv = L.control({ position: "bottomright" });
      windyDiv.onAdd = () => {
        const div = L.DomUtil.create("div", "windy-overlay");
        div.style.width = "350px";
        div.style.height = "200px";
        div.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";
        div.innerHTML = windyFrameHTML;
        return div;
      };
      windyDiv.addTo(map);

      // 🎯 Géolocalisation automatique
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((p) => {
          const lat = p.coords.latitude;
          const lon = p.coords.longitude;
          map.setView([lat, lon], 6);
          L.circleMarker([lat, lon], {
            radius: 6,
            fillColor: "#4fc3f7",
            color: "#fff",
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.9,
          })
            .addTo(map)
            .bindPopup("📍 Vous êtes ici");
        });
      }

      // 🔁 Mise à jour auto (5 min)
      setInterval(updateRain, 5 * 60 * 1000);

      console.log("✅ Radar 2D mondial initialisé");
    } catch (e) {
      console.error("❌ radar2D init error:", e);
    }
  }

  // ☔ Mise à jour du calque pluie
  function updateRain() {
    if (!rainLayer) return;
    const ts = Date.now();
    const newUrl = `https://tilecache.rainviewer.com/v2/radar/nowcast_0/512/{z}/{x}/{y}/2/1_1.png?time=${ts}`;
    rainLayer.setUrl(newUrl);
    console.log("🌧️ RainViewer rafraîchi");
  }

  return { initRadar };
})();

// Auto-initialisation si div présent
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("radar2D-map")) radar2D.initRadar();
});
