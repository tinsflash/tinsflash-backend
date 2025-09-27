// services/newsService.js
import fetch from "node-fetch";

const NEWS_API_KEY = process.env.NEWS_API_KEY; // à définir dans Render

async function getNews() {
  try {
    const url = `https://newsapi.org/v2/everything?q=weather OR climate&language=fr&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.articles) {
      throw new Error("Pas d'articles reçus");
    }

    // On simplifie les résultats
    return data.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt
    }));
  } catch (err) {
    return [{ error: err.message }];
  }
}

export default { getNews };
