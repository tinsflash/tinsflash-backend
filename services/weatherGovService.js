// PATH: services/weatherGovService.js
// 🌎 Intégration Weather.gov (NOAA) — module d’analyse pour USA
// Utilisé uniquement en interne pour renforcer les prévisions TINSFLASH
// ⚠️ Jamais affiché publiquement (source complémentaire IA interne)

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * Récupère les prévisions NOAA (Weather.gov)
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @returns {Promise<Object>} Données de prévision ou erreur
 */
export async function getWeatherGovForecast(lat, lon) {
  const baseUrl = `https://api.weather.gov/points/${lat},${lon}`;
  try {
    await addEngineLog(`📡 NOAA → Initialisation (${lat},${lon})`);
    const meta = await axios.get(baseUrl, {
      headers: { "User-Agent": "Tinsflash Meteorological Engine (contact@tinsflash.ai)" },
      timeout: 10000,
    });

    const forecastUrl = meta.data?.properties?.forecast;
    if (!forecastUrl) throw new Error("Forecast URL manquante (NOAA metadata invalide)");

    const forecastData = await axios.get(forecastUrl, {
      headers: { "User-Agent": "Tinsflash Engine" },
      timeout: 10000,
    });

    const periods = forecastData.data?.properties?.periods || [];
    await addEngineLog(`✅ NOAA → ${periods.length} périodes récupérées (${lat},${lon})`);

    return {
      source: "NOAA / Weather.gov",
      status: "ok",
      periods,
    };
  } catch (err) {
    await addEngineError(`❌ NOAA fetch error (${lat},${lon}) : ${err.message}`);
    return {
      source: "NOAA / Weather.gov",
      status: "error",
      error: err.message,
      periods: [],
    };
  }
}

/**
 * Récupère les alertes actives de Weather.gov (pour USA uniquement)
 * @returns {Promise<Object>} Liste d’alertes actives NOAA
 */
export async function getWeatherGovAlerts() {
  const alertsUrl = "https://api.weather.gov/alerts/active";
  try {
    await addEngineLog("🚨 NOAA → Lecture des alertes actives...");
    const res = await axios.get(alertsUrl, {
      headers: { "User-Agent": "Tinsflash Meteorological Engine" },
      timeout: 15000,
    });

    const alerts = res.data?.features?.map((a) => ({
      id: a.id,
      zone: a.properties?.areaDesc,
      event: a.properties?.event,
      severity: a.properties?.severity,
      certainty: a.properties?.certainty,
      urgency: a.properties?.urgency,
      start: a.properties?.onset,
      end: a.properties?.ends,
      headline: a.properties?.headline,
      description: a.properties?.description,
      instruction: a.properties?.instruction,
    })) || [];

    await addEngineLog(`✅ NOAA → ${alerts.length} alertes actives chargées`);
    return { source: "NOAA / Weather.gov", status: "ok", alerts };
  } catch (err) {
    await addEngineError(`❌ NOAA alert fetch error : ${err.message}`);
    return { source: "NOAA / Weather.gov", status: "error", alerts: [], error: err.message };
  }
}

export default { getWeatherGovForecast, getWeatherGovAlerts };
