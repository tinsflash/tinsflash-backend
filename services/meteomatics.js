// utils/meteomatics.js
import axios from "axios";

const METEO_BASE_URL = "https://api.meteomatics.com";
const USER = process.env.METEOMATICS_USER;
const PASS = process.env.METEOMATICS_PASS;

/**
 * Appel générique Meteomatics
 * @param {Array} parameters - ex: ["t_2m:C","precip_1h:mm","wind_speed_10m:ms"]
 * @param {number} lat
 * @param {number} lon
 * @param {string} model - "ecmwf", "gfs", "icon"...
 */
export async function fetchMeteomatics(parameters, lat, lon, model = "gfs") {
  try {
    const now = new Date();
    const start = now.toISOString().split(".")[0] + "Z";
    const end = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().split(".")[0] + "Z"; // +1 jour

    const paramStr = parameters.join(",");
    const url = `${METEO_BASE_URL}/${start}--${end}:PT1H/${paramStr}/${lat},${lon}/json?model=${model}`;

    const res = await axios.get(url, {
      auth: { username: USER, password: PASS }
    });

    return res.data.data.reduce((acc, cur) => {
      acc[cur.parameter] = cur.coordinates[0].dates.map(d => ({
        date: d.date,
        value: d.value
      }));
      return acc;
    }, {});
  } catch (err) {
    console.error(`❌ Meteomatics ${model} error:`, err.message);
    return null;
  }
}

// ✅ Ajout de l’export par défaut
export default fetchMeteomatics;
