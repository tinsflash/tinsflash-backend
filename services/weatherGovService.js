// PATH: services/weatherGovService.js
// 🔹 Intégration réelle Weather.gov (NOAA/NWS) — lecture seule
// Utilisé uniquement pour vérification et cross-check IA, jamais comme source primaire

import axios from "axios";
import { addEngineLog, addEngineError } from "./adminLogs.js";

const NWS_BASE = "https://api.weather.gov";

/**
 * 📍 getForecast(lat, lon)
 * Récupère les prévisions météo officielles du NWS
 */
export async function getForecast(lat, lon) {
  try {
    const pointRes = await axios.get(`${NWS_BASE}/points/${lat},${lon}`);
    const forecastUrl = pointRes.data?.properties?.forecast;
    if (!forecastUrl) throw new Error("URL forecast introuvable");

    const forecast = await axios.get(forecastUrl);
    return forecast.data?.properties?.periods || [];
  } catch (err) {
    await addEngineError(`⚠️ NWS Forecast error: ${err.message}`);
    return [];
  }
}

/**
 * 🚨 getActiveAlerts()
 * Récupère toutes les alertes actives des États-Unis au format GeoJSON
 */
export async function getActiveAlerts() {
  try {
    const res = await axios.get(`${NWS_BASE}/alerts/active`);
    return res.data?.features || [];
  } catch (err) {
    await addEngineError(`⚠️ NWS Alerts error: ${err.message}`);
    return [];
  }
}

/**
 * 🤖 crossCheck(ourForecasts, ourAlerts)
 * Compare nos prévisions / alertes à celles du NWS
 */
export async function crossCheck(ourForecasts = {}, ourAlerts = []) {
  try {
    await addEngineLog("🔎 Cross-check NWS (Weather.gov) lancé…");

    const nwsAlerts = await getActiveAlerts();
    let divergenceCount = 0;

    // Comparaison basique alertes
    for (const ours of ourAlerts || []) {
      const match = nwsAlerts.find(a =>
        a?.properties?.areaDesc?.includes(ours?.region || ours?.country)
      );
      if (!match) divergenceCount++;
    }

    // Comparaison prévisions par zones
    const sample = Object.entries(ourForecasts).slice(0, 3);
    let forecastMatches = [];
    for (const [zone, f] of sample) {
      const { lat, lon } = f?.coords || {};
      if (!lat || !lon) continue;
      const nws = await getForecast(lat, lon);
      if (nws.length) {
        const oursTemp = f?.tempMax || f?.temperature_max || null;
        const nwsTemp = nws[0]?.temperature || null;
        if (oursTemp && nwsTemp) {
          const diff = Math.abs(oursTemp - nwsTemp);
          forecastMatches.push({ zone, oursTemp, nwsTemp, diff });
        }
      }
    }

    const summary = `Comparées à ${sample.length} zones : ${forecastMatches.length} OK, divergences ${divergenceCount}`;
    await addEngineLog(`✅ NWS check terminé : ${summary}`);

    return {
      summary,
      forecastMatches,
      divergenceCount,
      timestamp: new Date(),
    };
  } catch (err) {
    await addEngineError(`❌ NWS Cross-check: ${err.message}`);
    return { summary: "Erreur cross-check NWS", error: err.message };
  }
}

export default { getForecast, getActiveAlerts, crossCheck };
