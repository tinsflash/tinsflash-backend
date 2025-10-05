// PATH: services/weatherGovService.js
// 🇺🇸 Service d’interfaçage avec Weather.gov (NWS) — Cross-check interne TINSFLASH

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * 🔍 Récupère les prévisions officielles du NWS pour une position
 */
export async function getNwsForecast(lat, lon) {
  try {
    const res = await axios.get(`https://api.weather.gov/points/${lat},${lon}`);
    const forecastUrl = res.data?.properties?.forecast;
    if (!forecastUrl) throw new Error("URL forecast absente");
    const forecastRes = await axios.get(forecastUrl);
    return forecastRes.data?.properties?.periods || [];
  } catch (err) {
    await addEngineError(`❌ NWS forecast error (${lat},${lon}): ${err.message}`);
    return [];
  }
}

/**
 * ⚙️ Compare les prévisions locales TINSFLASH avec celles du NWS
 * @param {Object} tinsflashForecasts Prévisions locales internes (runGlobalUSA)
 * @param {Array} tinsflashAlerts Alertes internes générées par le moteur
 */
export async function crossCheck(tinsflashForecasts = {}, tinsflashAlerts = []) {
  try {
    let compared = 0;
    let differences = 0;
    let aheadCount = 0;

    for (const [region, data] of Object.entries(tinsflashForecasts || {})) {
      const { lat, lon } = data;
      if (!lat || !lon) continue;
      const nws = await getNwsForecast(lat, lon);

      // On compare simplement la tendance et le timing des alertes
      if (nws?.length && data?.forecast) {
        compared++;
        const nwsSummary = nws[0]?.shortForecast?.toLowerCase() || "";
        const tins = JSON.stringify(data.forecast).toLowerCase();
        if (!tins.includes(nwsSummary)) differences++;
        if (tins.includes("storm") && !nwsSummary.includes("storm")) aheadCount++;
      }
    }

    const summary = `Comparé ${compared} régions, différences ${differences}, TINSFLASH en avance ${aheadCount}`;
    await addEngineLog(`📊 Cross-check NWS : ${summary}`);

    return { compared, differences, aheadCount, summary };
  } catch (err) {
    await addEngineError(`⚠️ Erreur crossCheck Weather.gov : ${err.message}`);
    return { compared: 0, differences: 0, aheadCount: 0, summary: err.message };
  }
}

export default { getNwsForecast, crossCheck };
