// utils/seasonalNorms.js

import axios from "axios";

// Exemple avec Copernicus/ERA5 (tu pourras ajuster avec d'autres datasets si nécessaire)
const CDS_API_URL = process.env.CDS_API_URL;
const CDS_API_KEY = process.env.CDS_API_KEY;

/**
 * Récupère les normales saisonnières pour un point géographique donné
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @returns {Promise<Object>} normales saisonnières (temp, précipitations, etc.)
 */
export async function getSeasonalNorms(lat, lon) {
  try {
    const response = await axios.post(CDS_API_URL, {
      dataset: "reanalysis-era5-land",
      request: {
        product_type: "reanalysis",
        variable: ["2m_temperature", "total_precipitation"],
        year: "2022", // Normales récentes (à mettre à jour ou calculées sur plusieurs années)
        month: Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
        day: ["01"], // on prend un jour représentatif pour mensuel
        time: "12:00",
        area: [lat, lon, lat, lon],
        format: "netcdf",
      },
      key: CDS_API_KEY,
    });

    return {
      temperature: response.data?.temperature || null,
      precipitation: response.data?.precipitation || null,
    };
  } catch (error) {
    console.error("❌ Erreur récupération normales saisonnières:", error.message);
    return { temperature: null, precipitation: null };
  }
}
