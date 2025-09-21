// services/ecmwf.js
import cdsapi from "cdsapi";

const client = new cdsapi();

/**
 * Récupère les données ECMWF pour une localisation donnée
 */
export default async function ecmwf(location) {
  try {
    const result = await client.retrieve("reanalysis-era5-single-levels", {
      product_type: "reanalysis",
      variable: ["2m_temperature", "total_precipitation", "10m_u_component_of_wind", "10m_v_component_of_wind"],
      year: new Date().getFullYear().toString(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      time: ["00:00", "06:00", "12:00", "18:00"],
      area: [location.lat + 0.5, location.lon - 0.5, location.lat - 0.5, location.lon + 0.5],
      format: "netcdf",
    });

    return {
      source: "ECMWF",
      data: result
    };
  } catch (error) {
    console.error("❌ Erreur récupération ECMWF:", error.message);
    return null;
  }
}
