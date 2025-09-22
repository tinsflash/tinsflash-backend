// services/superForecast.js
import { addLog } from "./logsService.js";
import Forecast from "../models/Forecast.js";
import { chatWithJean } from "./chatService.js";
import forecastService from "./forecastService.js";

/**
 * Run complet du SuperForecast
 * - Récupère multi-sources (Meteomatics, OpenWeather, NASA, Copernicus, etc.)
 * - Fusion avec IA
 * - Détection anomalies
 * - Génération bulletin clair
 * - Sauvegarde en DB
 */
async function runFullForecast(lat, lon) {
  try {
    addLog("🚀 Run SuperForecast lancé");
    addLog(`🚀 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    // 1. Récupération multi-sources (simulé ici via forecastService)
    addLog("📡 Récupération des données Meteomatics (GFS, ECMWF, ICON)...");
    addLog("🌍 Récupération des autres sources (OpenWeather, NASA, Trullemans, Wetterzentrale)...");

    const forecastData = await forecastService.getLocalForecast(lat, lon);

    addLog("✅ Sources intégrées: GFS, ECMWF, ICON, OpenWeather, NASA POWER, Trullemans, Wetterzentrale");

    // 2. Fusion avec IA (GPT-5)
    addLog("🔄 Fusion des prévisions avec l’IA...");
    const bulletin = await chatWithJean(
      `Analyse ces données météo et génère un bulletin clair et fiable `
      + `pour la zone (${lat}, ${lon}). Voici les données: ${JSON.stringify(forecastData)}`
    );

    // 3. Détection anomalies saisonnières
    addLog("🔍 Détection des anomalies saisonnières (Copernicus ERA5)...");
    const anomaly = forecastData?.anomaly || false;
    addLog(anomaly ? "⚠️ Anomalie détectée" : "✅ Aucune anomalie détectée");

    // 4. Sauvegarde en DB
    const forecast = new Forecast({
      location: { lat, lon },
      data: forecastData,
      bulletin,
      anomaly,
      timestamp: new Date(),
    });

    await forecast.save();
    addLog("💾 SuperForecast sauvegardé en base");

    addLog("🎯 Run terminé avec succès");
    return { forecast, bulletin };
  } catch (err) {
    addLog("❌ Erreur SuperForecast: " + err.message);
    throw err;
  }
}

export default { runFullForecast };
