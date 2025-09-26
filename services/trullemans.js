// services/trullemans.js
import axios from "axios";
import * as cheerio from "cheerio";

const TRULLEMANS_URL = "https://www.bmcb.be/forecast-europ-maps/";

/**
 * Récupère cartes + bulletin texte Trullemans
 */
async function trullemans() {
  try {
    const response = await axios.get(TRULLEMANS_URL, { timeout: 10000 });
    const $ = cheerio.load(response.data);

    // 🔹 Cartes
    const maps = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && (src.includes("forecast") || src.includes("maps"))) {
        maps.push(src.startsWith("http") ? src : `${TRULLEMANS_URL}${src}`);
      }
    });

    // 🔹 Bulletin texte (exemple : prendre tous les paragraphes du corps)
    const paragraphs = [];
    $("p").each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) paragraphs.push(text);
    });

    const bulletin = paragraphs.join("\n\n");

    return {
      source: "Trullemans",
      maps: maps.slice(0, 5),
      bulletin: bulletin || "⚠️ Aucun texte disponible"
    };
  } catch (error) {
    console.error("⚠️ Trullemans indisponible:", error.message);
    return {
      source: "Trullemans",
      maps: [],
      bulletin: null,
      error: error.message
    };
  }
}

export default trullemans;
