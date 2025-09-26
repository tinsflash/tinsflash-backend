// services/wetterzentrale.js
import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.wetterzentrale.de/en";

// 🔧 Liste des modèles qui nous intéressent
const MODELS = {
  wrf: `${BASE_URL}/show_model.php?model=wrf`,
  harmonie: `${BASE_URL}/show_model.php?model=harmonie`,
  arpege: `${BASE_URL}/show_model.php?model=arpege`,
  gem: `${BASE_URL}/show_model.php?model=gem`,
};

/**
 * Scrape Wetterzentrale pour extraire les infos principales d’un modèle
 * @param {string} model - Nom du modèle (wrf, harmonie, arpege, gem)
 * @returns {Object} Données extraites
 */
async function fetchModel(model) {
  try {
    if (!MODELS[model]) {
      throw new Error(`Modèle non supporté: ${model}`);
    }

    const url = MODELS[model];
    const response = await axios.get(url, { timeout: 10000 });

    const $ = cheerio.load(response.data);

    // Exemple simple : récupérer le titre de la page et les images des cartes
    const title = $("title").text();
    const maps = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("maps")) {
        maps.push(`${BASE_URL}/${src}`);
      }
    });

    return {
      model,
      title,
      maps: maps.slice(0, 5), // ⚡ on limite à 5 cartes pour l’instant
      source: "Wetterzentrale",
    };
  } catch (err) {
    console.error(`⚠️ Wetterzentrale ${model} indisponible:`, err.message);
    return {
      model,
      source: "Wetterzentrale",
      error: err.message,
    };
  }
}

/**
 * Récupère tous les modèles Wetterzentrale (benchmarks)
 */
async function fetchAllWetterzentrale() {
  const results = {};
  for (const model of Object.keys(MODELS)) {
    results[model] = await fetchModel(model);
  }
  return results;
}

// ✅ Export par défaut
export default fetchAllWetterzentrale;
