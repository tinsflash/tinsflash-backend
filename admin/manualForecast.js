// -------------------------
// 🛠️ manualForecast.js
// Script admin → lancer le supercalculateur météo 3x/jour
// -------------------------
import fs from "fs";
import { getForecast } from "../services/forecastService.js";

async function runForecastBatch() {
  console.log("🚀 Lancement batch forecast TINSFLASH…");

  const targets = [
    { name: "Bruxelles", lat: 50.8503, lon: 4.3517, country: "BE" },
    { name: "Paris", lat: 48.8566, lon: 2.3522, country: "FR" },
    { name: "New York", lat: 40.7128, lon: -74.006, country: "US" },
  ];

  const results = {};
  for (const t of targets) {
    results[t.name] = await getForecast(t.lat, t.lon, t.country);
  }

  fs.writeFileSync("./data/daily_forecast.json", JSON.stringify(results, null, 2));
  console.log("✅ Batch forecast sauvegardé dans data/daily_forecast.json");
}

// Lance uniquement si exécuté directement
if (process.argv[1].includes("manualForecast.js")) {
  runForecastBatch();
}
