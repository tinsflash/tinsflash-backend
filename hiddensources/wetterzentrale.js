// hiddensources/wetterzentrale.js
// Scraper Wetterzentrale - uniquement titres modèles

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function getWetterzentrale() {
  try {
    const url = "https://www.wetterzentrale.de/en/";
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const models = [];
    $("a").each((_, el) => {
      const txt = $(el).text();
      if (txt.includes("GFS") || txt.includes("ICON")) {
        models.push(txt.trim());
      }
    });

    return {
      source: "Wetterzentrale",
      models: models.slice(0, 5),
      date: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Erreur Wetterzentrale:", err);
    return { source: "Wetterzentrale", error: true };
  }
}
