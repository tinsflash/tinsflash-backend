// PATH: services/copernicusService.js
// Copernicus Climate Data Store (ERA5) – Service intégré au moteur nucléaire météo

import fetch from "node-fetch";

/**
 * Service Copernicus ERA5
 * @param {string} dataset - Nom du dataset (par défaut: "reanalysis-era5-land")
 * @param {object} requestBody - Corps de la requête JSON (préparé par superForecast.js)
 * @returns {object} Données Copernicus formatées ou erreur
 */
export default async function copernicus(dataset = "reanalysis-era5-land", requestBody = {}) {
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

    // Retourne JSON si dispo, sinon texte brut
    const data = await response.json().catch(() => null);
    return data || { raw: await response.text() };
  } catch (err) {
    console.error("❌ Error fetching Copernicus data:", err.message);
    return { error: err.message };
  }
}
