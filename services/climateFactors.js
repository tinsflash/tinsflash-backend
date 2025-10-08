// ==========================================================
// 🌍 TINSFLASH – climateFactors.js (Everest Protocol v2.6 PRO++)
// ==========================================================
// Corrigé pour fallback NASA Power (T2M manquant)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function applyClimateFactors(base, lat, lon, country = "GENERIC") {
  try {
    await addEngineLog(`📡 Lecture données climatiques NASA POWER pour ${country}`, "info", "core");
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS2M&community=RE&longitude=${lon}&latitude=${lat}&start=2024-01-01&end=2024-12-31&format=JSON`;

    const res = await axios.get(url);
    const data = res?.data?.properties?.parameter;

    // === Vérification sécurité NASA ===
    if (!data || !data.T2M) {
      await addEngineLog(
        `⚠️ Données climatiques incomplètes pour ${country} (${lat},${lon}), utilisation du fallback local`,
        "warn",
        "core"
      );
      return {
        temperature: base.temperature,
        precipitation: base.precipitation,
        wind: base.wind,
        reliability: base.reliability * 0.9,
      };
    }

    // === Moyenne climat annuelle
    const t2mVals = Object.values(data.T2M);
    const precVals = Object.values(data.PRECTOTCORR || {});
    const windVals = Object.values(data.WS2M || {});
    const avgT = t2mVals.reduce((a, b) => a + b, 0) / t2mVals.length;
    const avgP = precVals.length ? precVals.reduce((a, b) => a + b, 0) / precVals.length : 0;
    const avgW = windVals.length ? windVals.reduce((a, b) => a + b, 0) / windVals.length : 0;

    const corrected = {
      temperature: base.temperature - (avgT - 15) * 0.02,
      precipitation: base.precipitation * (1 + avgP / 1000),
      wind: base.wind + (avgW - 3) * 0.3,
      reliability: Math.min(1, base.reliability * 1.05),
    };

    await addEngineLog(`🌍 Application facteurs climatiques ${country}`, "info", "core");
    return corrected;
  } catch (err) {
    await addEngineError(`💥 Erreur applyClimateFactors : ${err.message}`, "core");
    return base; // fallback total si tout échoue
  }
}
