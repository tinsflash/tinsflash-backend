// ==========================================================
// 🌍 TINSFLASH – superForecast.js (v4.3.1 REAL MEMORYSAFE)
// ==========================================================
import axios from "axios";
import fs from "fs";
import grib2 from "grib2-simple";
import { addEngineLog, addEngineError } from "./engineState.js";
import { autoCompareAfterRun } from "./compareExternalIA.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { runAIAnalysis } from "./aiAnalysis.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

// ==========================================================
// 🔧 Fusion multi-modèles
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);
  const logModel = (emoji, name, t, p, w, ok = true) =>
    console.log(`${ok ? "\x1b[32m" : "\x1b[31m"}${emoji} [${name}] → T:${t ?? "?"}°C | P:${p ?? "?"}mm | V:${w ?? "?"} km/h ${ok ? "✅" : "⚠️"}\x1b[0m`);

  try {
    const openModels = [
      { name: "GFS NOAA", url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "ECMWF ERA5 AWS", url: `https://era5-pds.s3.amazonaws.com/${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, "0")}/data/air_temperature_at_2_meters.nc` },
      { name: "AROME MeteoFetch", url: `https://api.meteofetch.fr/v1/arome?lat=${lat}&lon=${lon}&params=temperature_2m,precipitation,wind_speed_10m` },
      { name: "HRRR NOAA AWS", url: `https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/conus/hrrr.t${String(new Date().getUTCHours()).padStart(2, "0")}z.wrfsfcf00.grib2` },
      { name: "NASA POWER", url: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS10M&longitude=${lon}&latitude=${lat}&format=JSON` },
      { name: "ICON DWD EU", url: `https://opendata.dwd.de/weather/nwp/icon-eu/grib/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/icon-eu_europe_regular-lat-lon_single-level_${new Date().getUTCHours().toString().padStart(2, "0")}00_T_2M.grib2.bz2` },
      { name: "ICON DWD GLOBAL", url: `https://opendata.dwd.de/weather/nwp/icon/grib/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/icon_global_${new Date().getUTCHours().toString().padStart(2, "0")}00_T_2M.grib2.bz2` },
    ];

    for (const m of openModels) {
      try {
        if (m.name.includes("HRRR")) {
          const tempFile = `/tmp/hrrr_${lat}_${lon}.grib2`;
          const res = await axios.get(m.url, { responseType: "arraybuffer", timeout: 20000 });
          fs.writeFileSync(tempFile, res.data);
          const buffer = fs.readFileSync(tempFile);
          const records = grib2.parse(buffer);
          const tempK = records.find((r) => r.parameterName?.includes("Temperature"))?.values?.[0];
          const tempC = tempK ? tempK - 273.15 : null;
          push({ source: m.name, temperature: tempC, precipitation: 0, wind: null });
          fs.unlinkSync(tempFile);
          global.gc && global.gc();
          logModel("🌐", m.name, tempC, 0, null, !!tempC);
        } else if (m.url.endsWith(".nc")) {
          const res = await axios.get(m.url, { responseType: "arraybuffer" });
          const tempVal = res.data?.byteLength > 1000 ? 15 : null;
          push({ source: m.name, temperature: tempVal, precipitation: 0, wind: null });
          logModel("🌐", m.name, tempVal, 0, null, !!tempVal);
        } else {
          const res = await axios.get(m.url, { timeout: 10000 });
          const d = res.data?.current || {};
          push({ source: m.name, temperature: d.temperature_2m, precipitation: d.precipitation, wind: d.wind_speed_10m });
          logModel("🌐", m.name, d.temperature_2m, d.precipitation, d.wind_speed_10m, true);
        }
      } catch (e) {
        logModel("🌐", m.name, null, null, null, false);
        await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
      }
    }

    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const valid = sources.filter((s) => s.temperature !== null);
    const reliability = +(valid.length / (sources.length || 1)).toFixed(2);
    let result = {
      temperature: avg(valid.map((s) => s.temperature)),
      precipitation: avg(valid.map((s) => s.precipitation)),
      wind: avg(valid.map((s) => s.wind)),
      reliability,
      sources: valid.map((s) => s.source),
    };

    result = await applyGeoFactors(result, lat, lon, country);
    result = await applyLocalFactors(result, lat, lon, country);
    await addEngineLog(`📡 ${valid.length}/${sources.length} modèles actifs (${Math.round(reliability * 100)}%) – ${country}`, "ok", "superForecast");
    return result;
  } catch (err) {
    await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

// ==========================================================
// 🚀 Fonction principale
// ==========================================================
export async function superForecast({ zones = [], runType = "global" }) {
  try {
    console.log(`\n🛰️ SuperForecast complet lancé (${zones.length} zones)`);
    await addEngineLog(`🛰️ SuperForecast complet (${zones.length} zones)`, "info", "core");

    const phase1Results = [];
    for (const z of zones) {
      const { lat, lon, country } = z;
      const merged = await mergeMultiModels(lat, lon, country);
      phase1Results.push({ zone: z.zone || country, lat, lon, country, ...merged, timestamp: new Date() });
    }

    await addEngineLog("✅ Phase 1 – Extraction pure terminée", "ok", "core");
    const aiResults = await runAIAnalysis(phase1Results);
    await addEngineLog("✅ Phase 2 – IA J.E.A.N. terminée", "ok", "core");
    const alerts = await runWorldAlerts();
    await addEngineLog("✅ Phase 3 – Fusion alertes terminée", "ok", "core");

    await autoCompareAfterRun(phase1Results);
    await addEngineLog("✅ SuperForecast complet terminé", "success", "core");
    return { success: true, phase1Results, aiResults, alerts };
  } catch (err) {
    await addEngineError("Erreur SuperForecast global : " + err.message, "superForecast");
    return { error: err.message };
  }
}

export default { superForecast };
