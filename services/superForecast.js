// ==========================================================
// 🌍 TINSFLASH – superForecast.js (Everest Protocol v5.1.7 PRO+++)
// ==========================================================
// 🔸 Phase 1 : Extraction pure (physique, sans IA)
// 🔸 Phase 1B : VisionIA (captures satellites & multicouches)
// 🔸 Phase 1.5 : HRRR (USA only, via Microsoft Planetary Computer)
// 🔸 Phase 2 : IA J.E.A.N. optionnelle (fusion, pondération, alertes)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { runAIAnalysis } from "./aiAnalysis.js";
import { runWorldAlerts } from "./runWorldAlerts.js";
import { autoCompareAfterRun } from "./compareExternalIA.js";
import { fetchHRRR } from "./hrrrAdapter.js";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ==========================================================
// 🔧 FUSION MULTI-MODÈLES PHYSIQUES
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);
  const log = (name, ok) => console.log(`${ok ? "✅" : "⚠️"} ${name}`);

  try {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");

    // --- Liste des modèles réels ---
    const models = [
      {
        name: "GFS NOAA",
        url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "ECMWF ERA5",
        url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${ymd}&end=${ymd}&format=JSON`,
      },
      {
        name: "ECMWF Open-Meteo",
        url: `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "AROME MeteoFrance",
        url: `https://api.open-meteo.com/v1/meteofrance?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "ICON DWD",
        url: `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "NASA POWER",
        url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${ymd}&end=${ymd}&format=JSON`,
      },
      {
        name: "Copernicus ERA5-Land",
        url: `https://archive-api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "Open-Meteo Forecast",
        url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "MET Norway – LocationForecast",
        url: `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
        headers: { "User-Agent": "TINSFLASH-MeteoEngine/1.0" },
      },
    ];

    // --- Exécution séquentielle ---
    for (const m of models) {
      try {
        const options = { timeout: 15000 };
        if (m.headers) options.headers = m.headers;
        const r = await axios.get(m.url, options);

        const d =
          r.data?.current ||
          r.data?.parameters ||
          (r.data?.hourly
            ? {
                temperature_2m: r.data.hourly.temperature_2m?.slice(-1)[0],
                precipitation: r.data.hourly.precipitation?.slice(-1)[0],
                wind_speed_10m: r.data.hourly.wind_speed_10m?.slice(-1)[0],
              }
            : r.data?.properties?.timeseries?.[0]?.data?.instant?.details
            ? {
                temperature_2m: r.data.properties.timeseries[0].data.instant.details.air_temperature,
                precipitation:
                  r.data.properties.timeseries[0].data.next_1_hours?.details?.precipitation_amount ?? 0,
                wind_speed_10m:
                  r.data.properties.timeseries[0].data.instant.details.wind_speed ?? null,
              }
            : {});

        const T = d.temperature_2m ?? d.air_temperature ?? null;
        const P = d.precipitation ?? d.PRECTOTCORR ?? 0;
        const W = d.wind_speed_10m ?? d.wind_speed ?? d.WS10M ?? null;
        push({ source: m.name, temperature: T, precipitation: P, wind: W });
        log(m.name, true);
      } catch (e) {
        log(m.name, false);
        await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
      }
    }

    // --- HRRR (USA only) ---
    if (lon < -60 && lon > -130 && lat > 20 && lat < 55) {
      try {
        const hrrr = await fetchHRRR(lat, lon);
        if (!hrrr.error) {
          push(hrrr);
          log("HRRR NOAA (Microsoft PC)", true);
        } else log("HRRR NOAA (Microsoft PC)", false);
      } catch (e) {
        log("HRRR NOAA (Microsoft PC)", false);
      }
    }

    // --- Fusion & pondération ---
    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const valid = sources.filter((s) => s.temperature !== null);
    const reliability = +(valid.length / (models.length || 1)).toFixed(2);

    const result = {
      temperature: avg(valid.map((s) => s.temperature)),
      precipitation: avg(valid.map((s) => s.precipitation)),
      wind: avg(valid.map((s) => s.wind)),
      reliability,
      sources: valid.map((s) => s.source),
    };

    return await applyLocalFactors(
      await applyGeoFactors(result, lat, lon, country),
      lat,
      lon,
      country
    );
  } catch (err) {
    await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

// ==========================================================
// 🚀 SUPERFORECAST PRINCIPAL
// ==========================================================
export async function superForecast({ zones = [], runType = "global", withAI = false }) {
  try {
    console.log(`🛰️ SuperForecast lancé (${zones.length} zones – ${runType})`);
    await addEngineLog(`🛰️ SuperForecast ${runType} (${zones.length} zones)`, "info", "superForecast");

    // --- PHASE 1 : Extraction physique multi-modèles ---
    const phase1Results = [];
    let counter = 0;
    for (const z of zones) {
      counter++;
      const { lat, lon, country, region } = z;
      const merged = await mergeMultiModels(lat, lon, country);
      phase1Results.push({
        zone: region || country,
        lat,
        lon,
        country,
        ...merged,
        timestamp: new Date(),
      });
      if (counter % 5 === 0) await delay(300);
    }

    await addEngineLog(`✅ Phase 1 + HRRR terminée (${runType})`, "success", "superForecast");

    // ==========================================================
    // 🌫️ PHASE 1B – VisionIA : Captation satellite & multicouches
    // ==========================================================
    try {
      const { runVisionCapture } = await import("./vision/visionCapture.js");
      await addEngineLog("🌫️ Lancement VisionIA – Phase 1B (captures visuelles)", "info", "superForecast");
      const vision = await runVisionCapture(zones);
      if (vision?.success) {
        await addEngineLog(
          `📸 VisionIA terminée (${vision.stored?.length || 0} captures sauvegardées)`,
          "success",
          "superForecast"
        );
      } else {
        await addEngineError(
          `⚠️ VisionIA a rencontré un problème : ${vision?.error || "inconnu"}`,
          "superForecast"
        );
      }
    } catch (e) {
      await addEngineError(`VisionIA non disponible ou erreur : ${e.message}`, "superForecast");
    }

    // ==========================================================
    // 🤖 PHASE 2 – IA J.E.A.N. (optionnelle)
    // ==========================================================
    if (withAI) {
      const aiResults = await runAIAnalysis(phase1Results);
      const alerts = await runWorldAlerts();
      await autoCompareAfterRun(phase1Results);
      await addEngineLog(`🤖 IA J.E.A.N. & alertes terminées (${runType})`, "success", "superForecast");
      return { success: true, phase1Results, aiResults, alerts };
    }

    return { success: true, phase1Results };
  } catch (err) {
    await addEngineError(`Erreur SuperForecast : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

export default { superForecast };
