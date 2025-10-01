// PATH: services/copernicusService.js
// Copernicus Climate Data Store (ERA5) – enrichi pour cohérence moteur nucléaire météo

import fetch from "node-fetch";

/**
 * Service Copernicus ERA5 enrichi
 * @param {string} dataset - Nom du dataset (par défaut: "reanalysis-era5-land")
 * @param {object} requestBody - Corps de la requête JSON (préparé par superForecast.js)
 * @returns {object} Données Copernicus formatées
 */
export default async function copernicus(dataset = "reanalysis-era5-land", requestBody = {}) {
  try {
    if (!process.env.CDS_API_KEY || !process.env.CDS_API_URL) {
      throw new Error("❌ CDS_API_KEY ou CDS_API_URL manquant dans .env");
    }

    // Auth Copernicus
    const auth = Buffer.from(process.env.CDS_API_KEY).toString("base64");

    const response = await fetch(`${process.env.CDS_API_URL}/resources/${dataset}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Copernicus API error: ${response.status} ${response.statusText}`);
    }

    const raw = await response.json().catch(() => null);
    if (!raw || !raw.properties) {
      return { source: "Copernicus ERA5", raw };
    }

    const params = raw.properties?.parameter || {};
    const dates = Object.keys(params?.["2m_temperature"] || {});

    // 🔎 Harmonisation des sorties
    const forecasts = dates.map((date) => ({
      date,
      temperature: params["2m_temperature"]?.[date] ?? null,
      precipitation: params["total_precipitation"]?.[date] ?? null,
      wind: params["10m_wind_speed"]?.[date] ?? null,
      humidity: params["2m_relative_humidity"]?.[date] ?? null,
      pressure: params["surface_pressure"]?.[date] ?? null,
    }));

    return {
      source: "Copernicus ERA5",
      dataset,
      forecasts,
    };
  } catch (err) {
    console.error("❌ Error fetching Copernicus data:", err.message);
    return { source: "Copernicus ERA5", error: err.message };
  }
}
