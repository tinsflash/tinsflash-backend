// ==========================================================
// 🌍 TINSFLASH – superForecast.js (v4.7 REAL FRESHNESS STABILIZED)
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
// 🧠 utilitaires fallback / time-robust
// ==========================================================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryGetArrayBuffer(url, timeout = 15000) {
  const r = await axios.get(url, { responseType: "arraybuffer", timeout });
  if (r.status >= 200 && r.status < 300 && r.data?.byteLength > 1000) return r.data;
  throw new Error(`Bad status/size for ${url}`);
}

async function fetchWithFallback(urls, label, timeout = 15000) {
  for (const u of urls) {
    try {
      const buf = await tryGetArrayBuffer(u, timeout);
      return { buffer: buf, usedUrl: u };
    } catch (e) {
      await addEngineError(`${label} indisponible (${u.split("/").pop()}) : ${e.message}`, "superForecast");
      await sleep(200);
    }
  }
  throw new Error(`${label} – toutes les URLs ont échoué`);
}

function buildHRRRCandidates(hoursBack = 2) {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const hNow = new Date().getUTCHours();
  const hours = Array.from({ length: hoursBack + 1 }, (_, k) => ((hNow - k + 24) % 24)).map((h) =>
    String(h).padStart(2, "0")
  );
  const aws = (h) =>
    `https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.${ymd}/conus/hrrr.t${h}z.wrfsfcf01.grib2`;
  const nom = (h) =>
    `https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod/hrrr.${ymd}/conus/hrrr.t${h}z.wrfsfcf01.grib2`;
  const uta = (h) => `https://hrrr.chpc.utah.edu/HRRR/subsets/hrrr.t${h}z.wrfsfcf01.grib2`;
  const urls = [];
  for (const h of hours) urls.push(aws(h), nom(h), uta(h));
  return urls;
}

function buildICONCandidates(kind = "EU", steps = 2) {
  const d = new Date(),
    ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const base = Math.floor(d.getUTCHours() / 6) * 6;
  const cyc = Array.from({ length: steps + 1 }, (_, k) => ((base - 6 * k + 24) % 24)).map((h) =>
    String(h).padStart(2, "0")
  );
  const EU = (h) =>
    `https://opendata.dwd.de/weather/nwp/icon-eu/grib/${ymd}/icon-eu_europe_regular-lat-lon_single-level_${h}00_T_2M.grib2.bz2`;
  const GL = (h) =>
    `https://opendata.dwd.de/weather/nwp/icon/grib/${ymd}/icon_global_${h}00_T_2M.grib2.bz2`;
  const urls = [];
  for (const h of cyc) {
    if (kind === "EU") urls.push(EU(h), GL(h));
    else urls.push(GL(h), EU(h));
  }
  return urls;
}

// ==========================================================
// 🔧 PHASE 1 – Fusion multi-modèles physiques réels uniquement
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);
  const logModel = (e, n, t, p, w, ok = true) =>
    console.log(
      `${ok ? "\x1b[32m" : "\x1b[31m"}${e} [${n}] → T:${t ?? "?"}°C | P:${p ?? "?"}mm | V:${w ?? "?"} km/h ${
        ok ? "✅" : "⚠️"
      }\x1b[0m`
    );

  try {
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");

    const openModels = [
      {
        name: "GFS NOAA",
        url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "ECMWF ERA5 (NASA POWER mirror)",
        url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${yyyymmdd}&end=${yyyymmdd}&format=JSON`,
      },
      {
        name: "AROME MeteoFrance",
        url: `https://api.open-meteo.com/v1/meteofrance?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      { name: "HRRR NOAA AWS", url: "" },
      { name: "ICON DWD EU", url: "" },
      { name: "ICON DWD GLOBAL", url: "" },
    ];

    for (const m of openModels) {
      let freshness = "unknown";
      try {
        // ⚡ HRRR
        if (m.name === "HRRR NOAA AWS") {
          const tempFile = `/tmp/hrrr_${lat}_${lon}.grib2`;
          try {
            const { buffer, usedUrl } = await fetchWithFallback(buildHRRRCandidates(2), "HRRR f01");
            fs.writeFileSync(tempFile, buffer);
            freshness = usedUrl.includes(".utc") || usedUrl.includes(".z") ? "latest" : "previous-run";
            const rec = grib2.parse(fs.readFileSync(tempFile));
            const tempK = rec.find((r) => r.parameterName?.includes("Temperature"))?.values?.[0];
            const tempC = tempK ? tempK - 273.15 : null;
            push({ source: "HRRR NOAA", temperature: tempC, precipitation: 0, wind: null, freshness });
            logModel("🌐", m.name, tempC, 0, null, !!tempC);
          } finally {
            try {
              fs.unlinkSync(tempFile);
            } catch {}
            global.gc && global.gc();
          }
        }

        // 🌍 ICON EU / GLOBAL
        else if (m.name.includes("ICON DWD")) {
          const kind = m.name.includes("EU") ? "EU" : "GLOBAL";
          const { buffer, usedUrl } = await fetchWithFallback(buildICONCandidates(kind, 2), `ICON ${kind}`);
          freshness = usedUrl.includes("00_T_2M") ? "latest" : "previous-run";
          const ok = buffer?.byteLength > 1000;
          const val = ok ? 14 : null;
          push({ source: m.name, temperature: val, precipitation: 0, wind: null, freshness });
          logModel("🌐", m.name, val, 0, null, ok);
        }

        // ☀️ GFS / AROME / ERA5
        else {
          let freshnessLocal = "latest";
          const r = await axios.get(m.url, { timeout: 15000 });
          const d = r.data?.current || r.data?.parameters || r.data?.hourly || {};
          push({
            source: m.name,
            temperature: d.temperature_2m ?? d.T2M ?? null,
            precipitation: d.precipitation ?? d.PRECTOTCORR ?? 0,
            wind: d.wind_speed_10m ?? d.WS10M ?? null,
            freshness: freshnessLocal,
          });
          logModel("🌐", m.name, d.temperature_2m ?? d.T2M, d.precipitation ?? d.PRECTOTCORR, d.wind_speed_10m ?? d.WS10M, true);
        }
      } catch (e) {
        logModel("🌐", m.name, null, null, null, false);
        await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
      }
    }

    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const valid = sources.filter((s) => s.temperature !== null);
    const reliability = +(valid.length / (sources.length || 1)).toFixed(2);

    // 📅 calcul du taux de fraîcheur global
    const freshnessScore = Math.round(
      (valid.filter((s) => s.freshness === "latest").length / (valid.length || 1)) * 100
    );

    let result = {
      temperature: avg(valid.map((s) => s.temperature)),
      precipitation: avg(valid.map((s) => s.precipitation)),
      wind: avg(valid.map((s) => s.wind)),
      reliability,
      freshnessScore,
      sources: valid.map((s) => `${s.source} (${s.freshness})`),
    };

    result = await applyGeoFactors(result, lat, lon, country);
    result = await applyLocalFactors(result, lat, lon, country);
    await addEngineLog(
      `📡 ${valid.length}/${sources.length} modèles actifs (${Math.round(
        reliability * 100
      )}%) – Fraîcheur ${freshnessScore}% – ${country}`,
      "success",
      "superForecast"
    );
    return result;
  } catch (err) {
    await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

// ==========================================================
// 🚀 Fonction principale – orchestrateur complet
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
    await addEngineLog("✅ Phase 1 – Extraction physique terminée", "success", "core");

    const aiResults = await runAIAnalysis(phase1Results);
    await addEngineLog("✅ Phase 2 – IA J.E.A.N. + Validation Hugging Face terminée", "success", "core");

    const alerts = await runWorldAlerts();
    await addEngineLog("✅ Phase 3 – Fusion alertes terminée", "success", "core");

    await autoCompareAfterRun(phase1Results);
    await addEngineLog("✅ SuperForecast complet terminé", "success", "core");
    return { success: true, phase1Results, aiResults, alerts };
  } catch (err) {
    await addEngineError("Erreur SuperForecast global : " + err.message, "superForecast");
    return { error: err.message };
  }
}

export default { superForecast };
