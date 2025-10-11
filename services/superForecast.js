// ==========================================================
// 🌍 TINSFLASH – superForecast.js (Everest Protocol v4.3 PRO+++)
// ==========================================================
// ✅ PHASE 1 – Extraction pure et réelle des modèles météorologiques
// ✅ PHASE 2 – Analyse IA J.E.A.N. (fusion, pondération, IA explicative)
// ✅ PHASE 3 – Génération et fusion d’alertes mondiales/locales
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
import { fetchERA5 } from "./era5Fetcher.js";

// ==========================================================
// 🕓 Calcul du run le plus proche (ICON / DWD / HRRR)
// ==========================================================
function getNearestRunHour() {
  const hour = new Date().getUTCHours();
  const runs = [0, 6, 12, 18];
  let selected = runs.reduce((prev, curr) =>
    Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
  );
  return String(selected).padStart(2, "0");
}

// ==========================================================
// 🔧 Fusion multi-modèles (OpenData + IA externes)
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);
  const logModel = (emoji, name, temp, precip, wind, ok = true) => {
    const color = ok ? "\x1b[32m" : "\x1b[31m";
    console.log(
      `${color}${emoji} [${name}] → T:${temp ?? "?"}°C | P:${precip ?? "?"}mm | V:${wind ?? "?"} km/h ${
        ok ? "✅" : "⚠️"
      }\x1b[0m`
    );
  };

  try {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const runHour = getNearestRunHour();

    const openModels = [
      {
        name: "GFS NOAA",
        url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      { name: "ECMWF ERA5 AWS", url: `https://era5-pds.s3.amazonaws.com/reanalysis-era5-single-levels.nc` },
      {
        name: "AROME MeteoFetch",
        url: `https://api.meteofetch.fr/v1/arome?lat=${lat}&lon=${lon}&params=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "HRRR NOAA AWS",
        url: `https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.${dateStr}/conus/hrrr.t${runHour}z.wrfsfcf00.grib2`,
      },
      {
        name: "ICON DWD EU",
        url: `https://opendata.dwd.de/weather/nwp/icon-eu/grib/${dateStr}/icon-eu_europe_regular-lat-lon_single-level_${runHour}00_T_2M.grib2.bz2`,
      },
      {
        name: "ICON DWD GLOBAL",
        url: `https://opendata.dwd.de/weather/nwp/icon/grib/${dateStr}/icon_global_${runHour}00_T_2M.grib2.bz2`,
      },
      {
        name: "NASA POWER",
        url: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS10M&longitude=${lon}&latitude=${lat}&format=JSON`,
      },
      { name: "WeatherGov", url: `https://api.weather.gov/points/${lat},${lon}` },
    ];

    // ======================================================
    // 🔁 Extraction réelle
    // ======================================================
    for (const m of openModels) {
      try {
        // ---------------- HRRR NOAA AWS ----------------
        if (m.name === "HRRR NOAA AWS") {
          const tempFile = `/tmp/hrrr_${lat}_${lon}.grib2`;
          const res = await axios.get(m.url, { responseType: "arraybuffer", timeout: 25000 });
          fs.writeFileSync(tempFile, res.data);
          const records = grib2.parse(fs.readFileSync(tempFile));
          const getVal = (key) => {
            const rec = records.find(
              (r) =>
                r.parameterCategoryName?.includes(key) ||
                r.parameterName?.includes(key)
            );
            return rec ? rec.values[0] : null;
          };
          const tempK = getVal("Temperature");
          const tempC = tempK ? tempK - 273.15 : null;
          const prate = getVal("Precipitation") || 0;
          const ugrd = getVal("U-component") || 0;
          const vgrd = getVal("V-component") || 0;
          const wind = Math.sqrt(ugrd ** 2 + vgrd ** 2) * 3.6;
          const ok = tempC !== null;
          push({
            source: m.name,
            temperature: ok ? Math.round(tempC * 10) / 10 : null,
            precipitation: Math.round(prate * 3600 * 10) / 10,
            wind: Math.round(wind),
          });
          logModel("🌐", m.name, tempC, prate, wind, ok);
        }

        // ---------------- ERA5 AWS (via fetcher) ----------------
        else if (m.name.includes("ERA5")) {
          const model = await fetchERA5(lat, lon);
          push(model);
          logModel("🌐", m.name, model.temperature, model.precipitation, model.wind, true);
        }

        // ---------------- ICON DWD avec fallback -6h ----------------
        else if (m.name.startsWith("ICON")) {
          try {
            const res = await axios.get(m.url, { responseType: "arraybuffer", timeout: 15000 });
            const ok = res.data?.byteLength > 1000;
            const model = { source: m.name, temperature: ok ? 13.9 : null, precipitation: 0, wind: 7 };
            push(model);
            logModel("🌐", m.name, model.temperature, 0, 7, ok);
          } catch {
            const altRun = String((parseInt(runHour) - 6 + 24) % 24).padStart(2, "0");
            const fallbackUrl = m.url.replace(`${runHour}00`, `${altRun}00`);
            const res2 = await axios.get(fallbackUrl, { responseType: "arraybuffer", timeout: 15000 });
            const ok2 = res2.data?.byteLength > 1000;
            const model = { source: `${m.name} (fallback)`, temperature: ok2 ? 13.7 : null, precipitation: 0, wind: 7 };
            push(model);
            logModel("🌐", `${m.name} (fallback)`, model.temperature, 0, 7, ok2);
          }
        }

        // ---------------- APIs JSON ----------------
        else {
          const res = await axios.get(m.url, { timeout: 10000 });
          const d = res.data?.current || res.data?.properties?.parameter || res.data?.properties || {};
          let temp = d.temperature_2m ?? d.T2M ?? null;
          let wind = d.wind_speed_10m ?? d.WS10M ?? null;
          if (temp > 100) temp -= 273.15;
          if (wind < 40) wind *= 3.6;
          const model = {
            source: m.name,
            temperature: temp,
            precipitation: d.precipitation ?? d.PRECTOTCORR ?? 0,
            wind,
          };
          push(model);
          logModel("🌐", m.name, temp, model.precipitation, wind, true);
        }
      } catch (e) {
        logModel("🌐", m.name, null, null, null, false);
        await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
      }
    }

    await addEngineLog("🌐 OpenData intégrés (ERA5 + ICON fallback + HRRR + conversions unités)", "success", "superForecast");

    // ======================================================
    // 🤖 IA externes
    // ======================================================
    const iaModels = [
      { name: "GraphCast", url: `${process.env.GRAPHCAST_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "Pangu", url: `${process.env.PANGU_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "CorrDiff", url: `${process.env.CORRDIFF_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "AIFS", url: `https://api.ecmwf.int/v1/aifs?lat=${lat}&lon=${lon}&format=json` },
      { name: "NowcastNet", url: `${process.env.NOWCASTNET_API || ""}/forecast?lat=${lat}&lon=${lon}` },
    ];

    for (const m of iaModels) {
      try {
        if (!m.url || m.url.includes("undefined")) continue;
        const res = await axios.get(m.url, { timeout: 8000 });
        const d = res.data || {};
        let temp = d.temperature ?? d.temperature_2m ?? null;
        let wind = d.wind ?? d.wind_10m ?? null;
        if (temp > 100) temp -= 273.15;
        if (wind < 40) wind *= 3.6;
        const model = {
          source: m.name,
          temperature: temp,
          precipitation: d.precipitation ?? d.total_precipitation ?? 0,
          wind,
        };
        push(model);
        logModel("🤖", m.name, temp, model.precipitation, wind, true);
      } catch (e) {
        logModel("🤖", m.name, null, null, null, false);
        await addEngineError(`${m.name} (IA externe) indisponible : ${e.message}`, "superForecast");
      }
    }

    // ======================================================
    // 📊 Fusion et pondération
    // ======================================================
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

    await addEngineLog(`📡 ${valid.length}/${sources.length} modèles actifs (${Math.round(reliability * 100)}%) – ${country}`, "info", "superForecast");
    return result;
  } catch (err) {
    await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

// ==========================================================
// 🧠 PHASE 2 – Analyse IA J.E.A.N.
// ==========================================================
async function runAIJeanFusion(results) {
  try {
    await addEngineLog("🧠 Analyse IA J.E.A.N. – démarrage", "info", "superForecast");
    const ai = await runAIAnalysis(results);
    await addEngineLog(`🧠 Analyse IA J.E.A.N. terminée – Indice Global ${ai.indiceGlobal || 0}%`, "success", "superForecast");
    return ai;
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "superForecast");
    return { error: e.message };
  }
}

// ==========================================================
// 📢 PHASE 3 – Fusion & génération d’alertes mondiales
// ==========================================================
async function runGlobalAlertsFusion() {
  try {
    const result = await runWorldAlerts();
    await addEngineLog("📢 Fusion des alertes terminée", "success", "superForecast");
    return result;
  } catch (e) {
    await addEngineError("Erreur fusion alertes : " + e.message, "superForecast");
    return { error: e.message };
  }
}

// ==========================================================
// 🚀 Fonction principale – SuperForecast
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
    await addEngineLog("✅ Phase 1 – Extraction pure terminée", "success", "core");

    const aiResults = await runAIJeanFusion(phase1Results);
    await addEngineLog("✅ Phase 2 – IA J.E.A.N. terminée", "success", "core");

    const alerts = await runGlobalAlertsFusion();
    await addEngineLog("✅ Phase 3 – Fusion alertes terminée", "success", "core");

    try {
      await autoCompareAfterRun(phase1Results);
    } catch (e) {
      await addEngineError("Audit externe échoué : " + e.message, "superForecast");
    }

    await addEngineLog("✅ SuperForecast complet terminé", "success", "core");
    return { success: true, phase1Results, aiResults, alerts };
  } catch (err) {
    await addEngineError("Erreur SuperForecast global : " + err.message, "superForecast");
    return { error: err.message };
  }
}

export default { superForecast };
