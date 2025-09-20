// services/radarService.js

// Exemple basé sur RainViewer API
async function getRadar(type = "rain") {
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    const data = await res.json();

    return {
      type,
      generatedAt: new Date(),
      timestampsUrl: "https://api.rainviewer.com/public/timestamps",
      tilesUrl: "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png"
    };
  } catch (err) {
    console.error("❌ RadarService error:", err.message);
    return null;
  }
}

// ✅ Export par défaut
export default { getRadar };
