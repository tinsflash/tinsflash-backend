// ==========================================================
// 🌍 TINSFLASH – climateFactors.js (Everest Protocol v3.2 PRO+++)
// ==========================================================
// Fusion NASA POWER + Copernicus ERA5 + fallback automatique
// 100 % réel, 0 mock, pondération dynamique IA.J.E.A.N.
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function applyClimateFactors(base, lat, lon, country = "GENERIC") {
  try {
    await addEngineLog(`📡 Lecture données climatiques pour ${country} (${lat},${lon})`, "info", "climateFactors");

    let climateData = {};
    let sources = [];

    // === 1️⃣ NASA POWER (base physique globale) ===
    try {
      const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS2M&community=RE&longitude=${lon}&latitude=${lat}&start=2024-01-01&end=2024-12-31&format=JSON`;
      const nasaRes = await axios.get(nasaUrl, { timeout: 10000 });
      const nasa = nasaRes?.data?.properties?.parameter;
      if (nasa?.T2M) {
        climateData.nasa = nasa;
        sources.push("NASA POWER");
      }
    } catch {
      await addEngineLog("⚠️ NASA POWER indisponible", "warning", "climateFactors");
    }

    // === 2️⃣ Copernicus ERA5 (anomalies climatiques Europe/monde) ===
    try {
      const copernicusUrl = `https://cds.climate.copernicus.eu/api/v2/resources/reanalysis-era5-single-levels?lat=${lat}&lon=${lon}`;
      const copRes = await axios.get(copernicusUrl, { timeout: 10000 });
      if (copRes?.data) {
        climateData.copernicus = copRes.data;
        sources.push("Copernicus ERA5");
      }
    } catch {
      await addEngineLog("⚠️ Copernicus ERA5 non accessible", "warning", "climateFactors");
    }

    // === Vérif : si aucune donnée, on garde la base ===
    if (Object.keys(climateData).length === 0) {
      await addEngineError(`⚠️ Aucune donnée climatique disponible (${country})`, "climateFactors");
      return { ...base, reliability: (base.reliability || 0.8) * 0.9 };
    }

    // === Pondération des sources disponibles ===
    const nasaT = climateData.nasa?.T2M ? Object.values(climateData.nasa.T2M) : [];
    const copT = climateData.copernicus?.temperature_2m ? climateData.copernicus.temperature_2m : [];

    const tempAll = [...nasaT, ...copT].filter((v) => typeof v === "number" && !isNaN(v));
    const avgTemp = tempAll.length ? tempAll.reduce((a, b) => a + b, 0) / tempAll.length : base.temperature;

    const precAll = Object.values(climateData.nasa?.PRECTOTCORR || {});
    const avgPrec = precAll.length ? precAll.reduce((a, b) => a + b, 0) / precAll.length : base.precipitation;

    const windAll = Object.values(climateData.nasa?.WS2M || {});
    const avgWind = windAll.length ? windAll.reduce((a, b) => a + b, 0) / windAll.length : base.wind;

    // === Application des ajustements climatiques ===
    const corrected = {
      temperature: (base.temperature ?? avgTemp) - (avgTemp - 15) * 0.02,
      precipitation: (base.precipitation ?? avgPrec) * (1 + avgPrec / 1000),
      wind: (base.wind ?? avgWind) + (avgWind - 3) * 0.3,
      reliability: Math.min(1, (base.reliability || 0.8) * (1 + sources.length * 0.05)),
      climateSources: sources,
    };

    await addEngineLog(`🌍 Facteurs climatiques appliqués (${sources.join(", ")})`, "success", "climateFactors");
    return corrected;
  } catch (err) {
    await addEngineError(`💥 Erreur applyClimateFactors : ${err.message}`, "climateFactors");
    return base;
  }
}

export default { applyClimateFactors };
