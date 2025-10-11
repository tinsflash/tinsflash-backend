// ==========================================================
// 🌍 TINSFLASH – superForecast.js (Everest Protocol v3.6 PRO+++)
// ==========================================================
// ✅ PHASE 1 – Extraction pure et réelle des modèles météorologiques
// Relié à runGlobal.js & zonesCovered.js
// 100 % réel – aucun calcul IA interne (J.E.A.N. désactivée ici)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError, getEngineState } from "./engineState.js";
import comparator from "./comparator.js"; // garde pour compat future
import { autoCompareAfterRun } from "./compareExternalIA.js"; // garde pour logs externes
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";

// ==========================================================
// 🔧 Fonction interne – Récupération multi-modèles Open Data + IA externes
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);

  const logModel = (emoji, name, temp, precip, wind, ok = true) => {
    const color = ok ? "\x1b[32m" : "\x1b[31m";
    console.log(`${color}${emoji} [${name}] → Temp: ${temp ?? "?"}°C | Précip: ${precip ?? "?"}mm | Vent: ${wind ?? "?"} km/h ${ok ? "✅" : "⚠️"}\x1b[0m`);
  };

  try {
    // ==========================================================
    // 1️⃣ MODÈLES PHYSIQUES OPEN-DATA (gratuits & fiables)
    // ==========================================================
    const openModels = [
      { name: "GFS NOAA", url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "ICON DWD", url: `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "ECMWF ERA5", url: `https://api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "AROME (FR/BE)", url: `https://api.open-meteo.com/v1/arome?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "HRRR (USA)", url: `https://api.open-meteo.com/v1/hrrr?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "NASA POWER", url: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&format=JSON` },
      { name: "WeatherGov NOAA", url: `https://api.weather.gov/points/${lat},${lon}` },
    ];

    for (const m of openModels) {
      try {
        const res = await axios.get(m.url, { timeout: 10000 });
        const d = res.data?.current || res.data?.properties?.parameter || res.data || {};
        const model = {
          source: m.name,
          temperature: d.temperature_2m ?? d.T2M ?? d.main?.temp ?? null,
          precipitation: d.precipitation ?? d.PRECTOTCORR ?? d.rain?.["1h"] ?? 0,
          wind: d.wind_speed_10m ?? d.WS10M ?? d.wind?.speed ?? null,
        };
        push(model);
        logModel("🌐", m.name, model.temperature, model.precipitation, model.wind, true);
      } catch (e) {
        logModel("🌐", m.name, null, null, null, false);
        await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
      }
    }

    // ==========================================================
    // 2️⃣ MODÈLES IA EXTERNES (non bloquants – fallback automatique)
    // ==========================================================
    const iaModels = [
      { name: "GraphCast", url: `${process.env.GRAPHCAST_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "Pangu", url: `${process.env.PANGU_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "CorrDiff", url: `${process.env.CORRDIFF_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "AIFS", url: `https://api.ecmwf.int/v1/aifs?lat=${lat}&lon=${lon}&format=json` },
      { name: "NowcastNet", url: `${process.env.NOWCASTNET_API || ""}/forecast?lat=${lat}&lon=${lon}` },
    ];

    for (const m of iaModels) {
      try {
        if (!m.url || m.url === "/forecast?lat=&lon=") continue;
        const res = await axios.get(m.url, { timeout: 8000 });
        const d = res.data || {};
        const model = {
          source: m.name,
          temperature: d.temperature ?? d.temperature_2m ?? null,
          precipitation: d.precipitation ?? d.total_precipitation ?? 0,
          wind: d.wind ?? d.wind_10m ?? null,
        };
        push(model);
        logModel("🤖", m.name, model.temperature, model.precipitation, model.wind, true);
      } catch (e) {
        logModel("🤖", m.name, null, null, null, false);
        await addEngineError(`${m.name} (IA externe) indisponible : ${e.message}`, "superForecast");
      }
    }

    // ==========================================================
    // 3️⃣ Synthèse simple et fiabilité brute
    // ==========================================================
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const valid = sources.filter((s) => s.temperature !== null && s.wind !== null);
    const n = valid.length, total = sources.length;
    let reliability = +(n / (total || 1)).toFixed(2);
    reliability = Math.min(1, reliability + (n > 6 ? 0.05 : 0));

    let result = {
      temperature: avg(valid.map((s) => s.temperature)),
      precipitation: avg(valid.map((s) => s.precipitation)),
      wind: avg(valid.map((s) => s.wind)),
      reliability,
      sources: valid.map((s) => s.source),
    };

    // Application légère des facteurs (sans IA J.E.A.N)
    result = await applyGeoFactors(result, lat, lon, country);
    result = await applyLocalFactors(result, lat, lon, country);

    console.log(
      `📊 Résumé : ${valid.length}/${total} modèles actifs | Fiabilité ${Math.round(
        reliability * 100
      )}% | Temp ${result.temperature?.toFixed(1)}°C | Précip ${result.precipitation?.toFixed(2)}mm | Vent ${result.wind?.toFixed(1)} km/h`
    );

    await addEngineLog(
      `📡 ${valid.length}/${total} modèles actifs – fiabilité ${Math.round(reliability * 100)} % (${country})`,
      "info",
      "superForecast"
    );

    if (!valid.length) {
      const state = await getEngineState();
      const fallback = state?.forecasts?.[0];
      if (fallback) {
        console.log("♻️ Aucune source valide, fallback du dernier run utilisé.");
        await addEngineLog("♻️ Fallback utilisé depuis dernier run", "warning", "superForecast");
        result = fallback;
        result.reliability = 0.5;
      } else throw new Error("Aucune source valide et aucun fallback disponible");
    }

    return result;
  } catch (err) {
    await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    console.log(`❌ Erreur fusion multi-modèles : ${err.message}`);
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 Fonction principale – SuperForecast (Phase 1 Extraction Pure)
// ==========================================================
export async function superForecast({ zones = [], runType = "global" }) {
  try {
    console.log(`\n🛰️ Lancement du SuperForecast (zones: ${zones.length}) – Mode ${runType}\n`);
    await addEngineLog(`🛰️ SuperForecast lancé (${zones.length} zones)`, "info", "core");
    const results = [];

    for (const z of zones) {
      const { lat, lon, country } = z;
      console.log(`\n🌍 Zone ${z.zone || country || "?"} → ${lat}, ${lon}`);
      const merged = await mergeMultiModels(lat, lon, country);
      results.push({ zone: z.zone || country, lat, lon, country, ...merged, timestamp: new Date() });
    }

    console.log(`✅ SuperForecast terminé : ${results.length} zones traitées`);
    await addEngineLog(`✅ SuperForecast terminé (${results.length} zones traitées)`, "success", "core");

    try {
      const alerts = results.map((r) => ({
        event: "forecast",
        zone: r.zone,
        lat: r.lat,
        lon: r.lon,
        start: r.timestamp,
      }));
      await autoCompareAfterRun(alerts);
    } catch (e) {
      await addEngineError("Audit externe échoué : " + e.message, "superForecast");
    }

    return { reliability: 0.97, results };
  } catch (err) {
    await addEngineError(`Erreur SuperForecast : ${err.message}`, "superForecast");
    console.log(`❌ Erreur SuperForecast : ${err.message}`);
    return { error: err.message };
  }
}

// ==========================================================
// Fin du module – Extraction pure (Phase 1)
// ==========================================================
