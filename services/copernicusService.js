// PATH: services/copernicusService.js
// Copernicus Climate Data Store (ERA5) – Service pour le moteur nucléaire météo

import fetch from "node-fetch";

/**
 * Récupère les données Copernicus ERA5 pour un point donné
 * @param {string} dataset - Nom du dataset (ex: "reanalysis-era5-land")
 * @param {object} requestBody - Corps de la requête JSON
 * @returns {object|null} Données Copernicus formatées
 */
export default async function copernicus(dataset, requestBody) {
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

    // Essaie JSON, sinon renvoie brut
    const data = await response.json().catch(() => null);
    return data || { raw: await response.text() };
  } catch (err) {
    console.error("❌ Error fetching Copernicus data:", err.message);
    return { error: err.message };
  }
}
