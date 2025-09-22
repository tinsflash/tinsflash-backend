// services/superForecast.js
import { addLog } from "./logsService.js";
import forecastService from "./forecastService.js";
import alertsService from "./alertsService.js";

/**
 * Run complet SuperForecast (zones couvertes Europe/USA)
 */
async function runFullForecast(lat, lon) {
  try {
    addLog("🌍 Début du SuperForecast...");

    // 1. Prévisions locales
    addLog("📡 Récupération prévisions locales...");
    const local = await forecastService.getLocalForecast(lat, lon);

    // 2. Prévisions nationales
    addLog("🏳️ Prévisions nationales...");
    const national = await forecastService.getNationalForecast("FR");

    // 3. Prévisions 7 jours
    addLog("📅 Prévisions 7 jours...");
    const week = await forecastService.get7DayForecast(lat, lon);

    // 4. Génération d’alertes
    addLog("⚠️ Génération d’alertes...");
    const alerts = await alertsService.generateAlerts(local, week);

    addLog("✅ SuperForecast terminé avec succès.");
    return { local, national, week, alerts };
  } catch (err) {
    addLog("❌ Erreur SuperForecast: " + err.message);
    throw err;
  }
}

export default { runFullForecast };
