// services/newsService.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

const NEWS_API_URL = "https://newsapi.org/v2/everything";

export async function getWeatherNews() {
  try {
    addLog("📰 Récupération des actualités météo mondiales...");
    const res = await fetch(
      `${NEWS_API_URL}?q=weather OR météo OR climate OR climat&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}`
    );
    const data = await res.json();

    if (!data.articles) {
      throw new Error("Aucun article trouvé");
    }

    // Simplification & traduction automatique en français (API gratuite libretranslate)
    const translatedArticles = await Promise.all(
      data.articles.slice(0, 5).map(async (article) => {
        try {
          const tRes = await fetch("https://libretranslate.de/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              q: article.title,
              source: "en",
              target: "fr",
              format: "text",
            }),
          });
          const tData = await tRes.json();

          return {
            title: tData?.translatedText || article.title,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
          };
        } catch (err) {
          return {
            title: article.title,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
          };
        }
      })
    );

    return translatedArticles;
  } catch (err) {
    addLog("❌ Erreur récupération news: " + err.message);
    return [{ title: "Erreur récupération actualités météo", url: "#", source: "SYSTEM", publishedAt: new Date().toISOString() }];
  }
}
