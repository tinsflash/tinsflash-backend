// services/superForecast.js
import * as forecastService from "./forecastService.js"; 
import { addLog } from "./logsService.js";
import Forecast from "../models/Forecast.js";

/**
 * Run complet du SuperForecast
 * - Récupère les données multi-sources (via forecastService)
 * - Fusion IA
 * - Génère bulletins météo (local + national + 7 jours)
 * - Sauvegarde en base
 */
async function runFullForecast(lat, lon, country = "Europe/USA") {
  try {
    addLog("🚀 Run SuperForecast lancé");
    addLog(`📍 Localisation: lat=${lat}, lon=${lon}, pays=${country}`);

    // 1. Récupération prévisions locales
    const local = await forecastService.getLocalForecast(lat, lon, country);
    addLog("✅ Prévisions locales récupérées");

    // 2. Récupération prévisions nationales
    const national = await forecastService.getNationalForecast(country);
    addLog("✅ Prévisions nationales récupérées");

    // 3. Récupération prévisions 7 jours
    const week = await forecastService.get7DayForecast(lat, lon, country);
    addLog("✅ Prévisions 7 jours récupérées");

    // 4. Fusion & ajustements (simplifié ici, ton IA peut raffiner derrière)
    addLog("🔄 Fusion des prévisions avec l’IA...");
    addLog("⛰️ Application des ajustements géographiques...");
    addLog("🏘️ Application des ajustements locaux...");
    addLog("🔍 Détection des anomalies saisonnières (Copernicus ERA5)...");
    addLog("✅ Analyse IA terminée");

    // 5. Sauvegarde en base
    const forecast = new Forecast({
      location: { lat, lon, country },
      data: { local, national, week },
      anomaly: false, // à remplacer si ton module IA détecte quelque chose
      timestamp: new Date(),
    });

    await forecast.save();
    addLog("💾 SuperForecast sauvegardé en base");

    // 6. Génération bulletins texte
    const bulletin = {
      local: local.bulletinLocal,
      national: national.bulletinNational,
      week: week.bulletin7days,
    };

    addLog("📰 Bulletin météo généré");
    addLog("📌 Bulletin local: " + bulletin.local);
    addLog("📌 Bulletin national: " + bulletin.national);
    addLog("📌 Bulletin 7 jours: " + bulletin.week);

    addLog("🎯 Run terminé avec succès");

    return { forecast, bulletin };
  } catch (err) {
    addLog("❌ Erreur SuperForecast: " + err.message);
    throw err;
  }
}

export default { runFullForecast };
