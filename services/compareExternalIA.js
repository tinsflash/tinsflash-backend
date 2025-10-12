// ==========================================================
// 🌍 TINSFLASH – compareExternalIA.js (v4.3.1 REAL)
// ==========================================================
import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

// ✅ zones couvertes NOAA
const NOAA_ZONES = ["USA", "Alaska", "Hawaii", "PuertoRico", "Guam", "AmericanSamoa"];

async function getNOAAData(lat, lon, country) {
  try {
    if (!NOAA_ZONES.includes(country)) {
      await addEngineLog(`🌎 NOAA non disponible pour ${country} – redirection vers GFS`, "info", "IA.JEAN");
      return await getGFSData(lat, lon);
    }
    const url = `https://api.weather.gov/points/${lat},${lon}`;
    const res = await axios.get(url, { timeout: 10000 });
    const forecastUrl = res.data?.properties?.forecastHourly;
    const fRes = await axios.get(forecastUrl, { timeout: 10000 });
    const d = fRes.data?.properties?.periods?.[0] || {};
    return { source: "NOAA", temperature: d.temperature, wind: d.windSpeed, precipitation: d.probabilityOfPrecipitation?.value || 0 };
  } catch (e) {
    await addEngineError(`NOAA ${country} injoignable : ${e.message}`, "IA.JEAN");
    return { error: e.message };
  }
}

async function getGFSData(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`;
    const res = await axios.get(url, { timeout: 10000 });
    const d = res.data?.current || {};
    return { source: "GFS", temperature: d.temperature_2m, wind: d.wind_speed_10m, precipitation: d.precipitation };
  } catch (e) {
    await addEngineError(`GFS injoignable : ${e.message}`, "IA.JEAN");
    return { error: e.message };
  }
}

// ⚙️ Fonction principale
export async function autoCompareAfterRun(results = []) {
  for (const r of results) {
    const { lat, lon, country } = r;
    await getNOAAData(lat, lon, country);
  }
  await addEngineLog("🔍 Comparaison IA externe terminée", "ok", "IA.JEAN");
}

export default { autoCompareAfterRun };
