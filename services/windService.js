// ==========================================================
// 💨 TINSFLASH – windService.js
// v5.15f PRO+++
// Détection vent / tempêtes / rafales
// Sources : Open-Meteo (modèles GFS / ICON-EU / AROME), relief
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";

// ==========================================================
// ⚙️ Analyse vent – IA.J.E.A.N.
// ==========================================================
export async function analyzeWind(lat, lon, country = "EU", region = null) {
  try {
    await addEngineLog(
      `💨 Analyse vent pour ${country}${region ? " - " + region : ""}`,
      "info",
      "wind"
    );

    // 🌍 Facteurs géographiques
    const geo = await applyGeoFactors(lat, lon, country);
    const altitude = geo.altitude ?? 0;

    // 🔗 Sélection du modèle selon altitude / région
    let model = "gfs"; // modèle global par défaut
    if (altitude > 1200 || (region && /ALP|PYR|CARP|ATLAS|ROCK/i.test(region))) model = "icon_eu";
    if (country === "FR" && region && /ALP|PYR/i.test(region)) model = "arome";

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=windspeed_10m,windgusts_10m&forecast_days=1&model=${model}`;
    await addEngineLog(`📡 Modèle utilisé : ${model.toUpperCase()}`, "info", "wind");

    const res = await axios.get(url);
    const wind = res.data?.hourly?.windspeed_10m ?? [];
    const gusts = res.data?.hourly?.windgusts_10m ?? [];

    if (!wind.length && !gusts.length) {
      await addEngineError("Aucune donnée vent reçue (Open-Meteo vide)", "wind");
      return { success: false, error: "Pas de données de vent disponibles" };
    }

    // 📊 Calculs
    const avgWind = wind.reduce((a, b) => a + b, 0) / wind.length;
    const maxGust = Math.max(...gusts, 0);
    const adjusted = avgWind * (geo.windFactor ?? 1.0);

    // 💨 Interprétation
    let risk = "🍃 Vent faible";
    if (adjusted > 70 || maxGust > 100) risk = "🌪️ Tempête violente / rafales destructrices";
    else if (adjusted > 50 || maxGust > 80) risk = "🌬️ Fort coup de vent";
    else if (adjusted > 30) risk = "💨 Vent modéré à soutenu";

    await addEngineLog(
      `✅ Vent analysé (${risk}) – moyenne ${adjusted.toFixed(1)} km/h, rafales max ${maxGust.toFixed(1)} km/h (${altitude} m)`,
      "success",
      "wind"
    );

    return {
      success: true,
      lat,
      lon,
      country,
      altitude,
      avg_wind_kmh: adjusted,
      max_gust_kmh: maxGust,
      risk,
      reliability: Math.min(1, adjusted / 120),
      model,
      source: "Open-Meteo",
    };
  } catch (err) {
    await addEngineError(`Erreur windService : ${err.message}`, "wind");
    return { success: false, error: err.message };
  }
}

export default { analyzeWind };
