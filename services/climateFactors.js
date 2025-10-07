// services/climateFactors.js
import fetch from "node-fetch";
import { addEngineLog } from "./engineState.js";

export async function applyClimateFactors(forecast, lat, lon, country) {
  try {
    const nasa = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_ANOMALY&latitude=${lat}&longitude=${lon}&format=JSON`);
    const nasaData = await nasa.json();
    const anomaly = nasaData?.properties?.parameter?.T2M_ANOMALY
      ? Object.values(nasaData.properties.parameter.T2M_ANOMALY)[0] : 0;
    forecast.temperature += anomaly;
    forecast.climateAdjust = { anomaly };
    await addEngineLog("🌍 ClimateFactors appliqués");
    return forecast;
  } catch (err) {
    await addEngineLog("Erreur ClimateFactors: " + err.message);
    return forecast;
  }
}