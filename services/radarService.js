// services/radarService.js
import axios from "axios";

/**
 * Radar gratuit : pluie, neige, vent (30 min) + intensité + animation
 * Sources : OpenMeteo + RainViewer
 */
async function getRadar(lat = 50.5, lon = 4.7) {
  try {
    // 1. OpenMeteo (précipitations & vent)
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,precipitation_probability,snowfall,wind_speed_10m&forecast_days=1&timezone=auto`;
    const openRes = await axios.get(openMeteoUrl);
    const openData = openRes.data?.hourly || {};

    // 2. RainViewer (animation radar nuages/pluie)
    const rainviewerUrl = "https://api.rainviewer.com/public/weather-maps.json";
    const rainRes = await axios.get(rainviewerUrl);
    const rainData = rainRes.data;

    return {
      source: "Radar Gratuit (OpenMeteo + RainViewer)",
      precipitation: {
        time: openData.time || [],
        intensity: openData.precipitation || [],
        probability: openData.precipitation_probability || [],
      },
      snowfall: openData.snowfall || [],
      wind: openData.wind_speed_10m || [],
      animation: rainData.radar?.past?.map(frame => ({
        time: frame.time,
        path: frame.path,
      })) || [],
    };
  } catch (err) {
    console.error("❌ Erreur RadarService:", err.message);
    return { error: "Radar indisponible" };
  }
}

export default { getRadar };
