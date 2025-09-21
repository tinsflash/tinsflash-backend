// services/trullemans.js
import axios from "axios";

const TRULLEMANS_API = "https://www.meteo-trullemans.be/api/forecast"; // 🔧 URL fictive, à remplacer si besoin

/**
 * Récupère la prévision Trullemans (comparaison interne uniquement)
 */
async function getForecast(lat, lon) {
  try {
    const response = await axios.get(TRULLEMANS_API, {
      params: { lat, lon },
      timeout: 8000, // sécurité
    });

    const data = response.data || {};

    return {
      temperature: data.temperature ?? [],
      precipitation: data.precipitation ?? [],
      wind: data.wind ?? [],
      source: "Trullemans",
    };
  } catch (error) {
    console.error("⚠️ Trullemans indisponible:", error.message);
    return {
      temperature: [],
      precipitation: [],
      wind: [],
      source: "Trullemans",
      error: error.message,
    };
  }
}

export default { getForecast };
