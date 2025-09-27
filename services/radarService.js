// services/radarService.js
import fetch from "node-fetch";

const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";

/**
 * Handler radar météo global
 * - zone peut être "global" ou un pays
 * - retour format JSON pour Leaflet / OpenLayers
 */
export async function radarHandler(zone = "global") {
  try {
    const response = await fetch(RAINVIEWER_API);
    if (!response.ok) throw new Error(`Radar fetch error: ${response.status}`);
    const data = await response.json();

    return {
      source: "Rainviewer",
      zone,
      generated: new Date().toISOString(),
      radar: data.radar || [],
      satellites: data.satellite || [],
      past: data.past || [],
      nowcast: data.nowcast || []
    };
  } catch (err) {
    return { error: err.message, zone };
  }
}
