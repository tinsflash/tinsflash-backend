// services/copernicusService.js
// 🌍 Copernicus ERA5 – données climatologiques / anomalies (fallback NOAA)

import fetch from "node-fetch";

export default async function copernicusService(lat, lon) {
  try {
    const url = `https://climate-api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,soil_temperature_0cm,soil_moisture_0_to_7cm`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur Copernicus ERA5: ${res.status}`);
    const data = await res.json();

    return {
      source: "Copernicus ERA5",
      temperature: data?.hourly?.temperature_2m || [],
      humidity: data?.hourly?.relative_humidity_2m || [],
      precipitation: data?.hourly?.precipitation || [],
      soil_temp: data?.hourly?.soil_temperature_0cm || [],
      soil_moisture: data?.hourly?.soil_moisture_0_to_7cm || [],
      reliability: 88,
    };
  } catch (err) {
    console.error("❌ Copernicus error:", err.message);
    return { source: "Copernicus ERA5", error: err.message, reliability: 0 };
  }
}
