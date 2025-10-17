// ==========================================================
// 🌍 TINSFLASH – superForecast.js (Everest Protocol v5.1.9 PRO+++)
// ==========================================================
// 🔸 Phase 1 : Extraction pure (physique, sans IA)
// 🔸 Phase 1B : VisionIA (captures satellites & multicouches)
// 🔸 Phase 1.5 : HRRR (USA only, via Microsoft Planetary Computer)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { fetchHRRR } from "./hrrrAdapter.js";
import { downloadVisionSet, analyzeVision } from "./visionService.js"; // ✅ correction unique

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ==========================================================
// 🔧 FUSION MULTI-MODÈLES PHYSIQUES
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);

  try {
    const gfs = await axios.get(`https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "GFS", data: gfs.data });

    const ecmwf = await axios.get(`https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "ECMWF", data: ecmwf.data });

    const icon = await axios.get(`https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "ICON", data: icon.data });

    const metno = await axios.get(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`);
    push({ model: "METNO", data: metno.data });

    const arpege = await axios.get(`https://api.open-meteo.com/v1/arpege?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "ARPEGE", data: arpege.data });

    const arome = await axios.get(`https://api.open-meteo.com/v1/arome?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "AROME", data: arome.data });

    const jma = await axios.get(`https://api.open-meteo.com/v1/jma?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "JMA", data: jma.data });

    const ukmo = await axios.get(`https://api.open-meteo.com/v1/ukmo?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "UKMO", data: ukmo.data });

    const gem = await axios.get(`https://api.open-meteo.com/v1/gem?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`);
    push({ model: "GEM", data: gem.data });

    return sources;
  } catch (err) {
    await addEngineError(`Erreur mergeMultiModels: ${err.message}`, "superForecast");
    return [];
  }
}

// ==========================================================
// 🌦️ SUPER FORECAST – PHASE 1 (extraction physique pure)
// ==========================================================
export async function superForecast({ zones = [], runType = "EU", withAI = false }) {
  try {
    await addEngineLog(`🚀 Phase 1 – Extraction physique lancée (${zones.length} zones)`, "info", runType);
    const phase1Results = [];

    for (const z of zones) {
      await addEngineLog(`📍 Extraction ${z.name} (${z.lat}, ${z.lon})...`, "info", runType);
      const models = await mergeMultiModels(z.lat, z.lon, runType);

      const processed = {
        id: z.id,
        name: z.name,
        lat: z.lat,
        lon: z.lon,
        modelsCount: models.length,
        base: applyGeoFactors(models, z),
        local: applyLocalFactors(models, z),
        timestamp: new Date().toISOString(),
      };

      phase1Results.push(processed);
      await delay(250);
    }

    await addEngineLog(`✅ Phase 1 terminée (${phase1Results.length} points traités)`, "success", runType);

    // ==========================================================
    // 🛰️ PHASE 1B – VisionIA (captures satellites & multicouches)
    // ==========================================================
    await addEngineLog("🛰️ Phase 1B – VisionIA (satellite) lancée", "info", runType);

    try {
      await downloadVisionSet();
      await analyzeVision(); // ✅ correction unique ici aussi
      await addEngineLog("✅ VisionIA terminée avec succès", "success", runType);
    } catch (visionErr) {
      await addEngineError(`Erreur VisionIA: ${visionErr.message}`, "visionIA");
    }

    return { success: true, phase1Results };
  } catch (err) {
    await addEngineError(`Erreur superForecast: ${err.message}`, "core");
    return { success: false, error: err.message };
  }
}

export default { superForecast };
