// admin/manualForecast.js
import { getForecast } from "../services/forecastService.js";
import fs from "fs";

export async function runForecastBatch() {
  logInfo("🚀 Lancement batch forecast TINSFLASH…");

  const targets = [
    { name: "Bruxelles", lat: 50.8503, lon: 4.3517, country: "BE" },
    { name: "Paris", lat: 48.8566, lon: 2.3522, country: "FR" },
    { name: "New York", lat: 40.7128, lon: -74.006, country: "US" }
  ];

  const results = {};
  for (const t of targets) {
    logInfo(`📡 Récupération prévisions pour ${t.name}...`);
    try {
      results[t.name] = await getForecast(t.lat, t.lon, t.country);
      logInfo(`✅ ${t.name} OK`);
    } catch (err) {
      logError(`❌ ${t.name} erreur: ${err.message}`);
    }
  }

  fs.writeFileSync("./data/daily_forecast.json", JSON.stringify(results, null, 2));
  logInfo("💾 Sauvegarde terminée dans data/daily_forecast.json");

  return results;
}
