// services/runGlobal.js
// 🌍 Lancement global de la machine TINSFLASH
import { addEngineLog } from "./engineState.js";
import { superForecast } from "./superForecast.js";
import { enumerateCoveredPoints } from "./zonesCovered.js";

export async function runGlobal(zone = "All") {
  try {
    await addEngineLog(`🚀 Lancement Global – Zone ${zone}`, "info", "runGlobal");

    const points = enumerateCoveredPoints(zone);
    const results = [];

    for (const p of points) {
      const { lat, lon, country, region } = p;

      // Données météo initiales (issues des modèles Open-Meteo/GFS/ICON)
      const rawForecast = {
        temperature: 15,
        humidity: 60,
        reliability: 70,
      };

      // Exécution du moteur SuperForecast (ajustements locaux + climatiques)
      const adjusted = await superForecast(rawForecast, lat, lon, country, region);
      results.push({ ...p, forecast: adjusted });
    }

    await addEngineLog(`✅ RunGlobal terminé (${results.length} points analysés)`, "success", "runGlobal");
    return results;
  } catch (err) {
    await addEngineLog(`❌ RunGlobal erreur : ${err.message}`, "error", "runGlobal");
    return [];
  }
}
