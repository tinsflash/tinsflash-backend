// services/gfs.js
// 🌍 GFS (NOAA NOMADS) – extraction directe
// Variables : température 2m, précipitations, vent 10m

import fetch from "node-fetch";

export default async function gfs(lat, lon) {
  try {
    // Round coords à 2 décimales (NOAA grille = 0.25°)
    const latRounded = Math.round(lat * 4) / 4;
    const lonRounded = Math.round(lon * 4) / 4;

    // URL NOMADS (dernier run dispo)
    // Exemple : https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.20250930/00/atmos/
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const hh = ["00", "06", "12", "18"][Math.floor(now.getUTCHours() / 6)];
    const baseUrl = `https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.${yyyy}${mm}${dd}/${hh}/atmos`;

    // On cible les GRIB2 réduits (pgrb2.0p25)
    const url = `${baseUrl}/gfs.t${hh}z.pgrb2.0p25.f000`;

    // ⚠️ Ici, parsing GRIB2 direct serait lourd → on passe par NOAA API JSON
    // Alternative NOAA API: https://api.weather.gov/points/{lat},{lon}
    const pointUrl = `https://api.weather.gov/points/${latRounded},${lonRounded}`;

    const pointRes = await fetch(pointUrl);
    if (!pointRes.ok) throw new Error(`NOAA point API error: ${pointRes.status}`);
    const pointData = await pointRes.json();

    const forecastUrl = pointData.properties.forecastGridData;
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) throw new Error(`NOAA forecast API error: ${forecastRes.status}`);
    const forecast = await forecastRes.json();

    // Extraction simplifiée
    const temperature = forecast.properties.temperature?.values || [];
    const precipitation = forecast.properties.quantitativePrecipitation?.values || [];
    const wind = forecast.properties.windSpeed?.values || [];

    return {
      source: "GFS (NOAA NOMADS)",
      temperature,
      precipitation,
      wind,
    };
  } catch (err) {
    return { source: "GFS (NOAA NOMADS)", error: err.message };
  }
}
