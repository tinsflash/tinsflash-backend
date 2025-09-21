// services/gfs.js
import axios from "axios";

const GFS_BASE_URL = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl";

/**
 * Récupère un extrait GFS via NOAA NOMADS (résolution 0.25°)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} date - Date du run (YYYYMMDD)
 * @param {string} cycle - Cycle horaire (00, 06, 12, 18)
 * @returns {Object} prévisions brutes NOAA
 */
export async function getGFS(lat, lon, date, cycle = "00") {
  try {
    const params = {
      file: `gfs.t${cycle}z.pgrb2.0p25.f000`,
      lev_2_m_above_ground: "on",
      var_TMP: "on", // Température
      var_UGRD: "on", // Vent zonal
      var_VGRD: "on", // Vent méridien
      subregion: "",
      leftlon: lon - 1,
      rightlon: lon + 1,
      toplat: lat + 1,
      bottomlat: lat - 1,
      dir: `/gfs.${date}/${cycle}/atmos`
    };

    const response = await axios.get(GFS_BASE_URL, { params, responseType: "arraybuffer" });

    return {
      success: true,
      message: "✅ Données GFS récupérées depuis NOAA",
      raw: response.data, // encore en GRIB2 binaire → à convertir plus tard si besoin
    };
  } catch (error) {
    console.error("❌ Erreur récupération GFS NOAA:", error.message);
    return { success: false, message: error.message };
  }
}
