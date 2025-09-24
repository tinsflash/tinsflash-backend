// services/bulletinService.js
import { getLocalForecast, getNationalForecast, get7DayForecast } from "./forecastService.js";
import { addLog } from "./logsService.js";

/**
 * Génère un bulletin météo clair (local + national + 7 jours)
 */
export async function generateBulletin(zone = "BE", country = "BE") {
  try {
    await addLog("📰 Génération du bulletin météo...");

    // Local
    const localForecasts = await getLocalForecast(zone);
    const bulletinLocal = localForecasts && localForecasts[0]
      ? `Prévisions locales (${zone}) : ${localForecasts[0].summary} (${localForecasts[0].icon}), Min ${localForecasts[0].minTemp}°C / Max ${localForecasts[0].maxTemp}°C`
      : "Aucune donnée locale disponible.";

    // National
    const nationalForecasts = await getNationalForecast(country);
    const bulletinNational = nationalForecasts && nationalForecasts[0]
      ? `Prévisions nationales (${country}) : ${nationalForecasts[0].summary} (${nationalForecasts[0].icon}), Min ${nationalForecasts[0].minTemp}°C / Max ${nationalForecasts[0].maxTemp}°C`
      : "Aucune donnée nationale disponible.";

    // 7 jours
    const forecast7d = await get7DayForecast(zone);
    const bulletin7days = forecast7d && forecast7d.length > 0
      ? forecast7d.map((f, i) =>
          `Jour ${i + 1}: ${f.summary || "n/a"} (${f.icon || "?"}), Min ${f.minTemp ?? "-"}°C / Max ${f.maxTemp ?? "-"}°C`
        ).join("\n")
      : "Aucune prévision sur 7 jours disponible.";

    // On assemble tout
    return `
==== 🌍 BULLETIN MÉTÉO ====
📍 ${bulletinLocal}
🏛️ ${bulletinNational}
📅 Prévisions sur 7 jours :
${bulletin7days}
============================
    `;
  } catch (err) {
    await addLog("❌ Erreur generateBulletin: " + err.message);
    throw err;
  }
}

export default { generateBulletin };
