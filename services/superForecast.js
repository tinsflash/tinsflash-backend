// services/superForecast.js
import { getForecast as getOpenWeather } from "../sources/openweather.js";
import { getForecast as getMeteomatics } from "../sources/meteomatics.js";
import { getForecast as getWetterzentrale } from "../sources/wetterzentrale.js";
import { getForecast as getIconDwd } from "../sources/iconDwd.js";
import { getForecast as getGfs } from "../sources/gfs.js";
import compareForecasts from "../sources/comparator.js";
import { askOpenAI } from "../utils/openai.js";
import Forecast from "../models/Forecast.js";

// 🔒 Fonctions de sécurité
function safeNumber(value, fallback = 0) {
  return typeof value === "number" && !isNaN(value) ? value : fallback;
}

function safeString(value, fallback = "Non défini") {
  return value && typeof value === "string" ? value : fallback;
}

function avg(values) {
  const nums = values.filter(v => typeof v === "number" && !isNaN(v));
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function detectAnomaly(forecasts) {
  try {
    const temps = forecasts.map(f => safeNumber(f.temperature, null)).filter(v => v !== null);
    if (temps.length < 2) return "Normale";

    const mean = avg(temps);
    const maxDeviation = Math.max(...temps.map(t => Math.abs(t - mean)));

    if (maxDeviation > 8) return "⚠️ Anomalie forte";
    if (maxDeviation > 4) return "⚠️ Anomalie modérée";
    return "Normale";
  } catch {
    return "Normale";
  }
}

export async function runSuperForecast(location = "Bruxelles") {
  try {
    console.log(`🚀 Lancement du run météo pour ${location}`);

    // 1. Récupérer toutes les sources
    const [ow, mm, wz, dwd, gfs] = await Promise.allSettled([
      getOpenWeather(location),
      getMeteomatics(location),
      getWetterzentrale(location),
      getIconDwd(location),
      getGfs(location),
    ]);

    const forecasts = [ow, mm, wz, dwd, gfs]
      .filter(r => r.status === "fulfilled")
      .map(r => r.value);

    if (forecasts.length === 0) throw new Error("Aucune donnée disponible des modèles.");

    // 2. Pondération (GFS renforcé)
    const weights = {
      openweather: 15,
      meteomatics: 15,
      wetterzentrale: 15,
      icondwd: 15,
      gfs: 40,
    };

    // 3. Fusion
    const consolidated = {
      temperature_min: avg(forecasts.map(f => safeNumber(f.temperature_min))),
      temperature_max: avg(forecasts.map(f => safeNumber(f.temperature_max))),
      wind: avg(forecasts.map(f => safeNumber(f.wind))),
      precipitation: avg(forecasts.map(f => safeNumber(f.precipitation))),
      description: safeString(forecasts[0]?.description, "Non défini"),
      anomaly: detectAnomaly(forecasts),
      reliability: compareForecasts(forecasts, weights),
    };

    // 4. Résumé IA
    const aiSummary = await askOpenAI(
      `Synthèse météo experte pour ${location} avec tendance, risques et anomalies.`
    );

    // 5. Sauvegarde MongoDB
    const forecast = new Forecast({
      location,
      ...consolidated,
      aiSummary,
      runAt: new Date(),
    });

    await forecast.save();

    console.log("✅ Run météo enregistré !");
    return forecast;
  } catch (err) {
    console.error("❌ Erreur superForecast:", err.message);
    return { error: err.message };
  }
}
