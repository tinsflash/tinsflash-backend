// PATH: services/superForecast.js
// ⚛️ Fusion IA J.E.A.N – multi-sources haute fiabilité

import axios from "axios";
import { applyGeoFactors } from "./geoFactors.js";
import * as engineState from "./engineState.js";

export async function runSuperForecast({ lat, lon, country, region }) {
  const start = Date.now();
  await engineState.addEngineLog(`🚀 SuperForecast lancé pour ${country} / ${region || "n/a"}`);

  try {
    const timeout = { timeout: 7000 };
    const [gfs, ecmwf, icon] = await Promise.all([
      axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m`, timeout).then(r=>r.data).catch(()=>null),
      axios.get(`https://api.ecmwf.int/v1/data`, timeout).then(r=>r.data).catch(()=>null),
      axios.get(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, timeout).then(r=>r.data).catch(()=>null),
    ]);

    const forecast = {
      temperature_min: gfs?.hourly?.temperature_2m?.[0] ?? 0,
      temperature_max: gfs?.hourly?.temperature_2m?.[6] ?? 0,
      reliability: 60,
    };

    // Ajustements géographiques
    const adjusted = await applyGeoFactors(forecast, lat, lon);

    const enriched = {
      gfs: !!gfs, ecmwf: !!ecmwf, icon: !!icon,
      delay_ms: Date.now() - start,
      reliability: adjusted.reliability ?? 60,
    };

    await engineState.addEngineLog(`✅ SuperForecast ${country}/${region} OK (${enriched.delay_ms}ms)`);

    return { forecast: adjusted, enriched };
  } catch (err) {
    await engineState.addEngineError(`❌ SuperForecast ${country}/${region}: ${err.message}`);
    return { forecast: { error: err.message }, enriched: { fail: true } };
  }
}
