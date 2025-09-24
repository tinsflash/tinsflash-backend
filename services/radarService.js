// services/radarService.js
import { getRadarData, getFallbackModel } from "../utils/radar.js";

/**
 * Service Radar météo (Windy + fallback Meteologix)
 * Patrick Nuclear Weather Machine 🌍⚡
 */

/**
 * Récupère les données radar pour une localisation
 * @param {number} lat - latitude (par défaut Bruxelles)
 * @param {number} lon - longitude (par défaut Bruxelles)
 * @returns {Promise<Object>} Radar data ou fallback Meteologix
 */
async function fetchRadar(lat = 50.85, lon = 4.35) {
  try {
    const radar = await getRadarData(lat, lon);

    if (radar.error) {
      console.warn("⚠️ Radar indisponible → fallback Meteologix activé.");
      return getFallbackModel("gfs");
    }

    return radar;
  } catch (err) {
    console.error("❌ Erreur fetchRadar:", err.message);
    return getFallbackModel("gfs");
  }
}

/**
 * API Express handler
 * Permet d’appeler /api/radar?lat=xx&lon=yy
 */
async function radarHandler(req, res) {
  const { lat, lon } = req.query;

  try {
    const radarData = await fetchRadar(
      parseFloat(lat) || 50.85,
      parseFloat(lon) || 4.35
    );
    res.json(radarData);
  } catch (err) {
    res.status(500).json({ error: "Radar service unavailable" });
  }
}

export default { fetchRadar, radarHandler };
