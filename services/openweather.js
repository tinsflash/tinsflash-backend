// services/openweather.js
import axios from "axios";

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Récupère la prévision OpenWeather pour un point donné
 * Retourne un objet normalisé compatible avec comparator
 */
async function getForecast(lat, lon) {
  if (!OPENWEATHER_KEY) {
    throw new Error("Clé API OpenWeather absente. Vérifie ton .env / Render");
  }

  try {
    const response = await axios.get(API_URL, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_KEY,
        units: "metric", // Celsius
        lang: "fr",
      },
    });

    const data = response.data;

    // Extraction sécurisée des champs
    const temperature = data.main?.temp ?? null;
    const precipitation =
      data.rain?.["1h"] ??
      data.snow?.["1h"] ??
      data.rain?.["3h"] ??
      data.snow?.["3h"] ??
      0;
    const wind = data.wind?.speed ?? 0;

    return {
      temperature,
      precipitation,
      wind,
      source: "OpenWeather",
    };
  } catch (err) {
    console.error("❌ Erreur OpenWeather:", err.message);
    return {
      temperature: null,
      precipitation: null,
      wind: null,
      source: "OpenWeather",
      error: err.message,
    };
  }
}

export default { getForecast };
