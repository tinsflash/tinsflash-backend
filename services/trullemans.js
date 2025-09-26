// services/trullemans.js
import axios from "axios";

const TRULLEMANS_API = "https://www.bmcb.be/forecast-europ-maps/";

/**
 * Récupère les prévisions Trullemans (comparaison interne uniquement)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} Prévisions formatées
 */
async function trullemans(lat, lon) {
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

// ✅ Export direct
export default trullemans;
