// services/wetterzentrale.js
import axios from "axios";

const WETTERZENTRALE_API = "https://www.wetterzentrale.de/api/forecast"; 
// ⚠️ URL indicative → à remplacer si on a un vrai endpoint utilisable

/**
 * Récupère les prévisions Wetterzentrale (comparaison externe uniquement)
 */
async function getForecast(lat, lon) {
  try {
    const response = await axios.get(WETTERZENTRALE_API, {
      params: { lat, lon },
      timeout: 8000,
    });

    const data = response.data || {};

    return {
      temperature: data.temperature ?? [],
      precipitation: data.precipitation ?? [],
      wind: data.wind ?? [],
      source: "Wetterzentrale",
    };
  } catch (error) {
    console.error("⚠️ Wetterzentrale indisponible:", error.message);
    return {
      temperature: [],
      precipitation: [],
      wind: [],
      source: "Wetterzentrale",
      error: error.message,
    };
  }
}

export default { getForecast };
