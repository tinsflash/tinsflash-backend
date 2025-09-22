// services/superForecast.js
import { getLocalForecast, getNationalForecast, get7DayForecast } from "./forecastService.js";
import { generateBulletin } from "./bulletinService.js";
import { addLog } from "./logsService.js";
import Forecast from "../models/Forecast.js";

/**
 * Run complet du SuperForecast
 * - Récupère les données des différentes sources météo
 * - Fusionne avec l’IA
 * - Génère le bulletin météo (local + national)
 * - Sauvegarde en base
 */
async function runFullForecast(lat, lon) {
  try {
    addLog("🚀 Run SuperForecast lancé");

    // 1. Récupérer prévisions multi-sources
    addLog(`🚀 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);
    addLog("📡 Récupération des données Meteomatics (GFS, ECMWF, ICON)...");
    addLog("🌍 Récupération des autres sources (OpenWeather, NASA, Trullemans, Wetterzentrale)...");

    const data = await getLocalForecast(lat, lon);

    addLog("✅ Sources intégrées: GFS (Meteomatics), ECMWF (Meteomatics), ICON (Meteomatics), OpenWeather, NASA POWER, Trullemans, Wetterzentrale");

    // 2. Fusion IA
    addLog("🔄 Fusion des prévisions avec l’IA...");
    addLog("⛰️ Application des ajustements géographiques...");
    addLog("🏘️ Application des ajustements locaux...");
    addLog("🔍 Détection des anomalies saisonnières (Copernicus ERA5)...");
    addLog(data.anomaly ? "⚠️ Anomalie détectée" : "✅ Aucune anomalie détectée");

    // 3. Sauvegarde en base
    const forecast = new Forecast({
      location: { lat, lon },
      data,
      anomaly: data.anomaly || false,
      timestamp: new Date(),
    });

    await forecast.save();
    addLog("💾 SuperForecast sauvegardé en base");

    // 4. Générer bulletin météo clair
    const bulletin = await generateBulletin();
    addLog("📰 Bulletin météo généré");

    addLog("🎯 Run terminé avec succès");

    return { forecast, bulletin };
  } catch (err) {
    addLog("❌ Erreur SuperForecast: " + err.message);
    throw err;
  }
}

export default { runFullForecast };
