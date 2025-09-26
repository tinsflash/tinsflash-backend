// services/newsService.js
import fetch from "node-fetch";

export async function getNews() {
  try {
    const url = `https://newsapi.org/v2/everything?q=weather OR climate&language=fr&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.articles) throw new Error("Pas d'articles reçus");

    return data.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));
  } catch (err) {
    console.error("❌ News error:", err.message);
    return [{ title: "⚠️ Impossible de charger les actualités météo", source: "System", url: "#", publishedAt: new Date() }];
  }
}
