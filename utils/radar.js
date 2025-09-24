// utils/radar.js
import axios from "axios";

/**
 * Service Radar & fallback modèles
 * Sources : Windy (radar) + Meteologix (fallback)
 * Patrick Nuclear Weather Machine 🌍⚡
 */

// === Windy Radar API (public tiles, format XYZ) ===
const WINDY_BASE = "https://tilecache.rainviewer.com/v2/radar/nowcast";

/**
 * Retourne une image radar pour une zone donnée
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @param {number} zoom - zoom map (1-12)
 */
export async function getRadarData(lat = 50.85, lon = 4.35, zoom = 6) {
  try {
    // Exemple d’URL (RainViewer/Windy)
    const url = `${WINDY_BASE}/0/256/${zoom}/${Math.floor(lat)}/${Math.floor(
      lon
    )}/2/1_0.png`;

    return {
      provider: "Windy Radar",
      timestamp: new Date().toISOString(),
      lat,
      lon,
      zoom,
      imageUrl: url,
    };
  } catch (err) {
    console.error("❌ Radar fetch error:", err.message);
    return { error: "Radar data unavailable" };
  }
}

// === Meteologix fallback (modèles météo si les nôtres sont KO) ===
const METEOLOGIX_BASE = "https://meteologix.com/be/model-charts";

/**
 * Retourne un lien fallback Meteologix (page complète)
 * @param {string} model - modèle demandé (default: gfs)
 */
export function getFallbackModel(model = "gfs") {
  return {
    provider: "Meteologix",
    model,
    url: `${METEOLOGIX_BASE}#${model}`,
  };
}
