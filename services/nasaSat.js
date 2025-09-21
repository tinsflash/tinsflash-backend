// services/nasaSat.js
import axios from "axios";

const NASA_API_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";

/**
 * Récupère les données météo NASA POWER pour un point
 */
export default async function nasaSat(lat, lon, start = "20220101", end = "20221231") {
  try {
    const response = await axios.get(NASA_API_URL, {
      params: {
        parameters: "T2M,PRECTOTCORR,WS10M",
        community: "RE",
        longitude: lon,
        latitude: lat,
        start,
        end,
        format: "JSON",
      },
    });

    return {
      temperature: response.data.properties?.parameter?.T2M || [],
      precipitation: response.data.properties?.parameter?.PRECTOTCORR || [],
      wind: response.data.properties?.parameter?.WS10M || [],
      source: "NASA POWER",
    };
  } catch (error) {
    console.error("❌ Erreur récupération NASA POWER:", error.message);
    return { temperature: [], precipitation: [], wind: [], source: "NASA POWER" };
  }
}
