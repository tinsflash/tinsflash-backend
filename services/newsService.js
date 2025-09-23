// services/newsService.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

const NEWS_API = process.env.NEWS_API_KEY; // clé API externe (NewsAPI, GNews...)
const TRANSLATE_URL = "https://libretranslate.de/translate"; // traduction gratuite FR

/**
 * 🔹 Récupère les actualités météo mondiales
 */
export async function getWeatherNews() {
  try {
    addLog("📰 Récupération des actualités météo mondiales...");

    const res = await fetch(
      `https://gnews.io/api/v4/search?q=weather+OR+météo+OR+climate&lang=en&token=${NEWS_API}`
    );
    const data = await res.json();

    if (!data.articles) {
      throw new Error("Pas d’articles météo trouvés");
    }

    // Traduire les titres et descriptions en FR
    const translated = await Promise.all(
      data.articles.map(async (article) => {
        const translation = await translateToFrench(article.description || article.title);
        return {
          title: article.title,
          description: translation,
          url: article.url,
          source: article.source?.name || "Inconnu",
          publishedAt: article.publishedAt,
        };
      })
    );

    addLog("✅ Actualités météo récupérées et traduites");
    return translated;
  } catch (err) {
    addLog("❌ Erreur récupération actualités météo: " + err.message);
    return [];
  }
}

/**
 * 🔹 Traduction FR via LibreTranslate
 */
async function translateToFrench(text) {
  try {
    const res = await fetch(TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "fr",
      }),
    });

    const data = await res.json();
    return data?.translatedText || text;
  } catch {
    return text; // fallback si la traduction échoue
  }
}

export default { getWeatherNews };
