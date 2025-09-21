// services/forecastService.js
import ecmwf from "./ecmwf.js";
import gfs from "./gfs.js";
import icon from "./iconDwd.js";
import copernicus from "./copernicusService.js";
import openweather from "./openweather.js";
import meteomatics from "../utils/meteomatics.js";
import nasaSat from "./nasaSat.js";
import wetterzentrale from "./wetterzentrale.js";
import trullemans from "./trullemans.js"; // ✅ correction casse Linux
import fusion from "../utils/fusion.js";
import logger from "../utils/logger.js";

/**
 * Récupère et fusionne les prévisions multi-modèles
 * @param {Object} location { lat, lon }
 * @param {Object} options
 */
export default async function forecastService(location, options = {}) {
  try {
    logger.info(`📡 Récupération prévisions pour ${location.lat},${location.lon}`);

    // Collecte en parallèle pour rapidité
    const [
      ecmwfData,
      gfsData,
      iconData,
      copernicusData,
      openweatherData,
      meteomaticsData,
      nasaData,
      wetterData,
      trullemansData
    ] = await Promise.allSettled([
      ecmwf(location),
      gfs(location),
      icon(location),
      copernicus(location),
      openweather(location),
      meteomatics(location),
      nasaSat(location.lat, location.lon),
      wetterzentrale(location),
      trullemans(location)
    ]);

    // On nettoie les résultats (on garde uniquement les succès)
    const sources = [
      ecmwfData.value,
      gfsData.value,
      iconData.value,
      copernicusData.value,
      openweatherData.value,
      meteomaticsData.value,
      nasaData.value,
      wetterData.value,
      trullemansData.value
    ].filter(Boolean);

    if (!sources.length) {
      throw new Error("❌ Aucune donnée météo disponible !");
    }

    // Fusion et pondération des modèles
    const forecast = fusion(sources, {
      priority: ["ECMWF", "ICON", "GFS", "Meteomatics", "NASA", "Copernicus", "OpenWeather", "Wetterzentrale", "Trullemans"]
    });

    logger.info(`✅ Fusion complétée avec ${sources.length} modèles`);

    return {
      location,
      timestamp: new Date().toISOString(),
      sources: sources.map(s => s.source),
      forecast
    };

  } catch (error) {
    logger.error("❌ Erreur forecastService:", error.message);
    return { error: "Impossible de générer les prévisions" };
  }
}
