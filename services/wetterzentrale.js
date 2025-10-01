// services/wetterzentrale.js
// 🌍 Scraper Wetterzentrale — Benchmarks modèles météo externes
// ⚠️ Rôle : Comparatif uniquement (ne JAMAIS remplacer nos modèles nucléaires)

import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.wetterzentrale.de/en";

// 🔧 Liste des modèles Wetterzentrale qui nous intéressent
const MODELS = {
  wrf: `${BASE_URL}/show_model.php?model=wrf`,
  harmonie: `${BASE_URL}/show_model.php?model=harmonie`,
  arpege: `${BASE_URL}/show_model.php?model=arpege`,
  gem: `${BASE_URL}/show_model.php?model=gem`,
};

/**
 * Scrape un modèle spécifique sur Wetterzentrale
 * @param {string} model - Nom du modèle (wrf, harmonie, arpege, gem)
 * @param {number} max - Nombre max de cartes à récupérer
 * @returns {Object} Données extraites (titre, cartes, preview…)
 */
async function fetchModel(model, max = 5) {
  try {
    if (!MODELS[model]) {
      throw new Error(`Modèle non supporté: ${model}`);
    }

    const url = MODELS[model];
    const response = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(response.data);

    // Titre de la page
    const title = $("title").text().trim();

    // Extraction des cartes
    const maps = [];
    $("img").each((i, el) => {
      let src = $(el).attr("src");
      if (src && (src.includes("map") || src.includes("maps"))) {
        // Corriger les URL relatives
        if (!src.startsWith("http")) {
          src = `${BASE_URL}/${src.replace(/^\//, "")}`;
        }
        maps.push(src);
      }
    });

    return {
      model,
      source: "Wetterzentrale",
      title,
      lastUpdate: new Date().toISOString(),
      preview: maps.length > 0 ? maps[0] : null,
      maps: maps.slice(0, max),
    };
  } catch (err) {
    console.error(`⚠️ Wetterzentrale ${model} indisponible:`, err.message);
    return {
      model,
      source: "Wetterzentrale",
      error: err.message,
      lastUpdate: new Date().toISOString(),
    };
  }
}

/**
 * Récupère tous les modèles Wetterzentrale en batch
 * @param {number} max - Nombre max de cartes par modèle
 */
async function fetchAllWetterzentrale(max = 5) {
  const results = {};
  for (const model of Object.keys(MODELS)) {
    results[model] = await fetchModel(model, max);
  }
  return results;
}

// ✅ Export par défaut
export default fetchAllWetterzentrale;
