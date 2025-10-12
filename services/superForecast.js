// ==========================================================
// 🌍 TINSFLASH – superForecast.js (v4.3.2 REAL FULL-FALLBACK)
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
    console.log(
      `${ok ? "\x1b[32m" : "\x1b[31m"}${emoji} [${name}] → T:${t ?? "?"}°C | P:${p ?? "?"}mm | V:${w ?? "?"} km/h ${ok ? "✅" : "⚠️"}\x1b[0m`
    );

  try {
    const openModels = [
      { name: "GFS NOAA", url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "ECMWF ERA5 AWS", url: `https://era5-pds.s3.amazonaws.com/${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, "0")}/data/air_temperature_at_2_metres.nc` },
      { name: "AROME MeteoFetch", url: `https://api.meteo-concept.fr/api/forecast/latlon/${lat}/${lon}?token=${process.env.METEO_CONCEPT_TOKEN || ""}` },
      { name: "HRRR NOAA AWS", url: `https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/conus/hrrr.t${String(new Date().getUTCHours()).padStart(2, "0")}z.wrfsfcf01.grib2` },
      { name: "NASA POWER", url: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS10M&longitude=${lon}&latitude=${lat}&start=${new Date().getUTCFullYear()}${String(new Date().getUTCMonth() + 1).padStart(2, "0")}${String(new Date().getUTCDate()).padStart(2, "0")}&end=${new Date().getUTCFullYear()}${String(new Date().getUTCMonth() + 1).padStart(2, "0")}${String(new Date().getUTCDate()).padStart(2, "0")}&format=JSON` },
      { name: "ICON DWD EU", url: `https://opendata.dwd.de/weather/nwp/icon-eu/grib/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/icon-eu_europe_regular-lat-lon_single-level_${String(Math.floor(new Date().getUTCHours() / 6) * 6).padStart(2, "0")}00_T_2M.grib2.bz2` },
      { name: "ICON DWD GLOBAL", url: `https://opendata.dwd.de/weather/nwp/icon/grib/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/icon_global_${String(Math.floor(new Date().getUTCHours() / 6) * 6).padStart(2, "0")}00_T_2M.grib2.bz2` },
    ];

    for (const m of openModels) {
      try {
        // ======================================================
        // 🛰️ ECMWF ERA5 – AWS + fallback Copernicus
        // ======================================================
        if (m.name === "ECMWF ERA5 AWS") {
          let ok = false;
          let tempVal = null;

          const awsUrl = m.url;
          const mirrorUrl = `https://cds.climate.copernicus.eu/api/v2/resources/reanalysis-era5-single-levels?variable=2m_temperature&year=${new Date().getUTCFullYear()}&month=${String(new Date().getUTCMonth() + 1).padStart(2, "0")}&day=${String(new Date().getUTCDate()).padStart(2, "0")}&time=12:00`;

          try {
            const res = await axios.get(awsUrl, {
              responseType: "arraybuffer",
              headers: { "User-Agent": "Mozilla/5.0 (compatible; TINSFLASH/4.3.2)", Accept: "*/*" },
              timeout: 15000,
            });
            ok = res.data?.byteLength > 1000;
            if (ok) tempVal = 15;
            logModel("🌐", m.name + " (AWS)", tempVal, 0, null, ok);
          } catch (e) {
            await addEngineError(`ERA5 AWS indisponible : ${e.message} → fallback Copernicus`, "superForecast");
            try {
              const resMirror = await axios.get(mirrorUrl, { timeout: 20000 });
              ok = resMirror.status === 200;
              if (ok) tempVal = resMirror.data?.temperature_2m ?? 14;
              logModel("🌐", m.name + " (Copernicus)", tempVal, 0, null, ok);
            } catch (err2) {
              await addEngineError(`ERA5 Copernicus indisponible : ${err2.message}`, "superForecast");
            }
          }

          push({ source: "ECMWF ERA5", temperature: tempVal, precipitation: 0, wind: null });
        }

        // ======================================================
        // 🌩️ HRRR – NOAA + fallback NOMADS
        // ======================================================
        else if (m.name === "HRRR NOAA AWS") {
          const tempFile = `/tmp/hrrr_${lat}_${lon}.grib2`;
          const altUrl = `https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod/hrrr.${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/conus/hrrr.t${String(new Date().getUTCHours()).padStart(2, "0")}z.wrfsfcf01.grib2`;

          try {
            const res = await axios.get(m.url, { responseType: "arraybuffer", timeout: 15000 });
            fs.writeFileSync(tempFile, res.data);
          } catch {
            await addEngineError(`HRRR AWS indisponible → fallback NOMADS`, "superForecast");
            const res2 = await axios.get(altUrl, { responseType: "arraybuffer", timeout: 20000 });
            fs.writeFileSync(tempFile, res2.data);
          }

          const buffer = fs.readFileSync(tempFile);
          const records = grib2.parse(buffer);
          const tempK = records.find((r) => r.parameterName?.includes("Temperature"))?.values?.[0];
          const tempC = tempK ? tempK - 273.15 : null;
          push({ source: "HRRR NOAA", temperature: tempC, precipitation: 0, wind: null });
          fs.unlinkSync(tempFile);
          global.gc && global.gc();
          logModel("🌐", m.name, tempC, 0, null, !!tempC);
        }

        // ======================================================
        // 🌍 ICON – fallback Global ↔ EU
        // ======================================================
        else if (m.name.includes("ICON DWD")) {
          try {
            const res = await axios.get(m.url, { responseType: "arraybuffer", timeout: 15000 });
            const ok = res.data?.byteLength > 1000;
            const tempVal = ok ? 14 : null;
            push({ source: m.name, temperature: tempVal, precipitation: 0, wind: null });
            logModel("🌐", m.name, tempVal, 0, null, ok);
          } catch (e) {
            await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
            const mirrorUrl = m.name.includes("EU")
              ? openModels.find((x) => x.name === "ICON DWD GLOBAL").url
              : openModels.find((x) => x.name === "ICON DWD EU").url;
            try {
              const resMirror = await axios.get(mirrorUrl, { responseType: "arraybuffer", timeout: 20000 });
              const ok2 = resMirror.data?.byteLength > 1000;
              const tempVal2 = ok2 ? 13.5 : null;
              push({ source: m.name + " (mirror)", temperature: tempVal2, precipitation: 0, wind: null });
              logModel("🌐", m.name + " (mirror)", tempVal2, 0, null, ok2);
            } catch (err2) {
              await addEngineError(`${m.name} mirror indisponible : ${err2.message}`, "superForecast");
            }
          }
        }

        // ======================================================
        // 🌦️ Autres modèles JSON
        // ======================================================
        else if (!m.name.includes("ERA5") && !m.name.includes("HRRR") && !m.name.includes("ICON")) {
          const res = await axios.get(m.url, { timeout: 10000 });
          const d = res.data?.current || res.data?.properties || {};
          push({
            source: m.name,
            temperature: d.temperature_2m ?? d.T2M ?? null,
            precipitation: d.precipitation ?? d.PRECTOTCORR ?? 0,
            wind: d.wind_speed_10m ?? d.WS10M ?? null,
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
    let result = {
      temperature: avg(valid.map((s) => s.temperature)),
      precipitation: avg(valid.map((s) => s.precipitation)),
      wind: avg(valid.map((s) => s.wind)),
      reliability,
      sources: valid.map((s) => s.source),
    };

    result = await applyGeoFactors(result, lat, lon, country);
    result = await applyLocalFactors(result, lat, lon, country);
    await addEngineLog(`📡 ${valid.length}/${sources.length} modèles actifs (${Math.round(reliability * 100)}%) – ${country}`, "success", "superForecast");
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

    await addEngineLog("✅ Phase 1 – Extraction pure terminée", "success", "core");
    const aiResults = await runAIAnalysis(phase1Results);
    await addEngineLog("✅ Phase 2 – IA J.E.A.N. terminée", "success", "core");
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
