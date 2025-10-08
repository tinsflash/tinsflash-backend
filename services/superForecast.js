// ==========================================================
// 🧠 TINSFLASH – SuperForecast Engine (Everest Protocol v1.3)
// Fusion multi-modèles météo : GFS, ECMWF, ICON, Open-Meteo
// 100 % réel – IA J.E.A.N compatible
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import adjustWithLocalFactors from "./localFactors.js";
import { enumerateCoveredPoints } from "./zonesCovered.js";
import { analyzeRain } from "./rainService.js";
import { analyzeSnow } from "./snowService.js";
import { analyzeWind } from "./windService.js";

export async function superForecast() {
  try {
    await addEngineLog("🧭 Lancement SuperForecast (fusion multi-modèles)");
    const zones = enumerateCoveredPoints();
    const forecasts = {};

    for (const zone of zones.slice(0, 400)) {
      const { lat, lon, name, country } = zone;
      try {
        const [gfs, ecmwf, icon, open] = await Promise.all([
          axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&forecast_model=gfs`),
          axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&forecast_model=ecmwf`),
          axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&forecast_model=icon`),
          axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation`),
        ]);

        const temperature =
          (gfs.data.hourly.temperature_2m[0] +
            ecmwf.data.hourly.temperature_2m[0] +
            icon.data.hourly.temperature_2m[0] +
            open.data.hourly.temperature_2m[0]) /
          4;

        const precipitation =
          (gfs.data.hourly.precipitation[0] +
            ecmwf.data.hourly.precipitation[0] +
            icon.data.hourly.precipitation[0] +
            open.data.hourly.precipitation[0]) /
          4;

        let base = { temperature, precipitation, wind: 0 };
        base = await applyGeoFactors(base, lat, lon, country);
        base = await adjustWithLocalFactors(base, country, lat, lon);

        const [rain, snow, wind] = await Promise.all([
          analyzeRain(lat, lon, country),
          analyzeSnow(lat, lon, country),
          analyzeWind(lat, lon, country),
        ]);

        forecasts[`${country}_${name}`] = {
          lat,
          lon,
          temperature: base.temperature,
          precipitation: base.precipitation,
          wind: wind?.speed ?? 0,
          rainIndex: rain?.index ?? 0,
          snowIndex: snow?.index ?? 0,
          reliability: 0.85,
        };
      } catch (err) {
        await addEngineError(`Erreur SuperForecast zone ${zone.name}: ${err.message}`);
      }
    }

    await addEngineLog(`✅ SuperForecast terminé (${Object.keys(forecasts).length} zones)`);
    return forecasts;
  } catch (err) {
    await addEngineError(`Erreur superForecast global: ${err.message}`);
    return {};
  }
}

export { superForecast };
