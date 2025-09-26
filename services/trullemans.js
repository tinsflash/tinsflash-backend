// services/trullemans.js
import axios from "axios";
import * as cheerio from "cheerio";

const TRULLEMANS_URL = "https://www.bmcb.be/forecast-europ-maps/";

/**
 * Récupère les cartes Trullemans (comparaison interne uniquement)
 * @returns {Object} Données extraites
 */
async function trullemans() {
  try {
    const response = await axios.get(TRULLEMANS_URL, { timeout: 10000 });
    const $ = cheerio.load(response.data);

    const maps = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && (src.includes("forecast") || src.includes("maps"))) {
        maps.push(src.startsWith("http") ? src : `${TRULLEMANS_URL}${src}`);
      }
    });

    return {
      source: "Trullemans",
      maps: maps.slice(0, 5), // ⚡ on limite à 5 cartes pour l’instant
    };
  } catch (error) {
    console.error("⚠️ Trullemans indisponible:", error.message);
    return {
      source: "Trullemans",
      maps: [],
      error: error.message,
    };
  }
}

// ✅ Export direct
export default trullemans;
