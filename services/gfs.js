// services/gfs.js
import axios from "axios";

const GFS_BASE_URL = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl";

/**
 * Récupère les prévisions GFS pour une localisation donnée
 * @param {Object} location - { lat, lon }
 * @param {Object} options - paramètres supplémentaires (ex: variables météo)
 */
export default async function gfs(location, options = {}) {
  try {
    // Exemple : température à 2m, précipitations et vent à 10m
    const params = {
      file: "gfs.t00z.pgrb2.0p25.f000",
      lev_2_m_above_ground: "on",
      lev_10_m_above_ground: "on",
      var_TMP: "on",
      var_APCP: "on",
      var_UGRD: "on",
      var_VGRD: "on",
      leftlon: location.lon - 0.25,
      rightlon: location.lon + 0.25,
      toplat: location.lat + 0.25,
      bottomlat: location.lat - 0.25,
      dir: "/gfs.20240921/00/atmos", // ⚠️ À ajuster dynamiquement en fonction de la date/heure UTC
      ...options,
    };

    const response = await axios.get(GFS_BASE_URL, { params });

    return {
      source: "GFS (NOAA)",
      rawData: response.data, // ⚠️ renvoie GRIB2 binaire → prévoir parser GRIB2 côté utils
    };
  } catch (error) {
    console.error("❌ Erreur récupération GFS:", error.message);
    return { source: "GFS", rawData: null, error: error.message };
  }
}
