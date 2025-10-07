// services/superForecast.js
import fetch from "node-fetch";
import { fetchStationData } from "./stationsService.js";
import { applyLocalFactors } from "./localFactors.js";
import { applyClimateFactors } from "./climateFactors.js";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function runSuperForecast({ lat, lon, country, region }) {
  try {
    await addEngineLog(`🧠 SuperForecast pour ${country} ${region || ""}`);
    const stations = await fetchStationData(lat, lon, country, region);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m,pressure_msl,relative_humidity_2m&forecast_days=3`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erreur HTTP " + res.status);
    const data = await res.json();

    let forecast = {
      lat, lon, country, region,
      timestamp: new Date().toISOString(),
      temperature: data.hourly.temperature_2m?.[0] ?? null,
      humidity: data.hourly.relative_humidity_2m?.[0] ?? null,
      precipitation: data.hourly.precipitation?.[0] ?? null,
      wind: data.hourly.wind_speed_10m?.[0] ?? null,
      pressure: data.hourly.pressure_msl?.[0] ?? null,
      stations,
    };

    forecast = await applyLocalFactors(forecast, lat, lon, country);
    forecast = await applyClimateFactors(forecast, lat, lon, country);
    await addEngineLog("✅ SuperForecast terminé.");
    return { forecast };
  } catch (err) {
    await addEngineError("Erreur SuperForecast: " + err.message);
    return { error: err.message };
  }
}