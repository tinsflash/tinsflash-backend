// ==========================================================
// 🌍 TINSFLASH – Service SuperForecast (Everest Protocol v1.3 PRO++)
// 100 % réel – Fusion multi-modèles + IA locale + correction relief
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import adjustWithLocalFactors from "./localFactors.js";
import { climateAdjust } from "./climateFactors.js";

// ==========================================================
// 🧠 SuperForecast : fusion multi-modèles + ajustements locaux
// ==========================================================
export async function superForecast(lat, lon, country = "Unknown") {
  try {
    await addEngineLog(`🛰️ SuperForecast : lancement fusion multi-modèles pour ${country}`);

    // ---- 1️⃣ Modèles bruts : GFS + ECMWF + ICON + Open-Meteo
    const [gfs, ecmwf, icon, open] = await Promise.all([
      axios
        .get(
          `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
        )
        .then((r) => r.data?.current)
        .catch(() => null),
      axios
        .get(
          `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
        )
        .then((r) => r.data?.current)
        .catch(() => null),
      axios
        .get(
          `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
        )
        .then((r) => r.data?.current)
        .catch(() => null),
      axios
        .get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
        )
        .then((r) => r.data?.current)
        .catch(() => null),
    ]);

    const sources = { gfs, ecmwf, icon, open };

    // ---- 2️⃣ Fusion pondérée
    const valid = Object.values(sources).filter(Boolean);
    if (valid.length === 0) throw new Error("Aucune source météo valide");

    const avg = (key) =>
      valid.reduce((a, s) => a + (s?.[key] ?? 0), 0) / valid.length;

    const fusion = {
      temperature: avg("temperature_2m"),
      precipitation: avg("precipitation"),
      wind_speed: avg("wind_speed_10m"),
      modelsUsed: Object.keys(sources).filter((k) => sources[k]),
    };

    // ---- 3️⃣ Ajustements relief + climat + micro-facteurs
    let adjusted = await applyGeoFactors(fusion, lat, lon, country);
    adjusted = await adjustWithLocalFactors(adjusted, country, lat, lon);
    adjusted = await climateAdjust(adjusted, country);

    // ---- 4️⃣ Score de fiabilité
    const reliability = Math.min(
      1,
      (valid.length / 4) *
        (1 -
          Math.abs((fusion.temperature - adjusted.temperature) / (fusion.temperature || 1)))
    );

    // ---- 5️⃣ Résultat final
    const result = {
      lat,
      lon,
      country,
      reliability,
      ...adjusted,
      timestamp: new Date(),
    };

    await addEngineLog(
      `✅ SuperForecast terminé pour ${country} (${lat.toFixed(2)}, ${lon.toFixed(2)}) – Fiabilité ${(reliability * 100).toFixed(0)}%`
    );

    return result;
  } catch (err) {
    await addEngineError(`Erreur SuperForecast : ${err.message}`);
    return { error: err.message };
  }
}
