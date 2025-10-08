// ==========================================================
// 🌍 TINSFLASH – Service SuperForecast (Everest v1)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import adjustWithLocalFactors from "./localFactors.js";

export async function superForecast(lat, lon, country = "Unknown") {
  try {
    await addEngineLog(`🛰️ SuperForecast lancé pour ${country}`);

    const [gfs, ecmwf, icon] = await Promise.all([
      axios.get(`https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`).then(r => r.data?.current).catch(() => null),
      axios.get(`https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`).then(r => r.data?.current).catch(() => null),
      axios.get(`https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`).then(r => r.data?.current).catch(() => null)
    ]);

    const sources = [gfs, ecmwf, icon].filter(Boolean);
    if (sources.length === 0) throw new Error("Aucune source météo valide");

    const avg = key => sources.reduce((a, s) => a + (s?.[key] ?? 0), 0) / sources.length;

    let data = {
      temperature: avg("temperature_2m"),
      precipitation: avg("precipitation"),
      wind: avg("wind_speed_10m"),
    };

    data = await applyGeoFactors(data, lat, lon, country);
    data = await adjustWithLocalFactors(data, country, lat, lon);

    await addEngineLog(`✅ SuperForecast terminé pour ${country} (${lat.toFixed(2)},${lon.toFixed(2)})`);
    return { lat, lon, country, ...data, reliability: 0.9, timestamp: new Date() };
  } catch (err) {
    await addEngineError(`Erreur SuperForecast : ${err.message}`);
    return { error: err.message };
  }
}
