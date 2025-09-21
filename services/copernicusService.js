// src/services/copernicusService.js
import fetch from "node-fetch";

/**
 * Service pour interroger Copernicus Climate Data Store (ERA5).
 * Authentification via Basic Auth (CDS_API_KEY = UID:KEY dans .env).
 *
 * @param {string} dataset - Nom du dataset (ex: "reanalysis-era5-land")
 * @param {object} requestBody - Corps de la requête JSON
 * @returns {object} Données Copernicus (JSON ou NetCDF brut)
 */
async function fetchCopernicusData(dataset, requestBody) {
  try {
    if (!process.env.CDS_API_KEY || !process.env.CDS_API_URL) {
      throw new Error("❌ CDS_API_KEY ou CDS_API_URL manquant dans .env");
    }

    // Encoder la clé UID:KEY en base64
    const auth = Buffer.from(process.env.CDS_API_KEY).toString("base64");

    const response = await fetch(`${process.env.CDS_API_URL}/resources/${dataset}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Copernicus API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json().catch(() => null);

    return data || { raw: await response.text() };
  } catch (err) {
    console.error("❌ Error fetching Copernicus data:", err.message);
    return null;
  }
}

export default { fetchCopernicusData };
