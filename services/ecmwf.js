// services/ecmwf.js
import axios from "axios";

const CDS_API_URL = process.env.CDS_API_URL || "https://cds.climate.copernicus.eu/api";
const CDS_API_KEY = process.env.CDS_API_KEY;

/**
 * Récupère les données ECMWF ERA5 via Copernicus CDS
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @param {string} date - au format YYYY-MM-DD
 */
export default async function ecmwf(lat, lon, date) {
  try {
    const response = await axios.post(
      `${CDS_API_URL}/resources/reanalysis-era5-single-levels`,
      {
        variable: [
          "2m_temperature",
          "10m_u_component_of_wind",
          "10m_v_component_of_wind",
          "total_precipitation",
        ],
        product_type: "reanalysis",
        year: date.split("-")[0],
        month: date.split("-")[1],
        day: date.split("-")[2],
        time: ["00:00", "06:00", "12:00", "18:00"],
        area: [lat + 0.25, lon - 0.25, lat - 0.25, lon + 0.25], // bbox 0.25°
        format: "netcdf",
      },
      {
        headers: { Authorization: `Bearer ${CDS_API_KEY}` },
      }
    );

    return {
      source: "ECMWF ERA5 (Copernicus)",
      raw: response.data,
    };
  } catch (error) {
    console.error("❌ Erreur récupération ECMWF:", error.message);
    return { source: "ECMWF", error: error.message };
  }
}
