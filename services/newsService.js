// services/newsService.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// ======================================================
// 🌍 Récupération d’actualités météorologiques mondiales
// ======================================================
export async function getNews(limit = 10, lang = "fr") {
  try {
    if (!NEWS_API_KEY) throw new Error("Clé NEWS_API_KEY manquante");

    const url = `https://newsapi.org/v2/everything?q=weather OR climate OR storm OR flood OR cyclone&language=${lang}&sortBy=publishedAt&pageSize=${limit}&apiKey=${NEWS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

    const data = await res.json();
    if (!data.articles?.length) throw new Error("Aucun article reçu");

    const articles = data.articles.map(a => ({
      title: a.title,
      description: a.description || "",
      source: a.source?.name || "Inconnu",
      url: a.url,
      image: a.urlToImage || "",
      publishedAt: a.publishedAt
    }));

    return { success: true, count: articles.length, articles };
  } catch (err) {
    console.error("❌ Erreur getNews:", err.message);
    return { success: false, error: err.message, articles: [] };
  }
}
