// services/bulletinService.js
import { getLocalForecast, getNationalForecast, get7DayForecast } from "./forecastService.js";
import { addLog } from "./logsService.js";

/**
 * Génère un bulletin météo clair (local + national + 7 jours)
 */
export async function generateBulletin(lat = 50.85, lon = 4.35, country = "Europe/USA") {
  try {
    addLog("📰 Génération du bulletin météo...");

    // Local
    const local = await getLocalForecast(lat, lon, country);

    // National
    const national = await getNationalForecast(country);

    // 7 jours
    const forecast7d = await get7DayForecast(lat, lon, country);

    // On assemble tout
    return `
==== 🌍 BULLETIN MÉTÉO ====
📍 ${local.bulletinLocal}
🏛️ ${national.bulletinNational}
📅 ${forecast7d.bulletin7days}
============================
    `;
  } catch (err) {
    addLog("❌ Erreur generateBulletin: " + err.message);
    throw err;
  }
}
