// hiddensources/trullemans.js
// Scraper BMBC (Trullemans) - Données en cache privé

import fetch from "node-fetch";

export async function getBMBCForecast() {
  try {
    const url = "https://www.bmcb.be/wp-json/wp/v2/posts?per_page=1"; 
    const response = await fetch(url);
    const data = await response.json();

    return {
      source: "BMBC-Trullemans",
      title: data[0]?.title?.rendered || "N/A",
      content: data[0]?.excerpt?.rendered || "N/A",
      date: data[0]?.date || new Date().toISOString(),
    };
  } catch (err) {
    console.error("Erreur récupération BMBC:", err);
    return { source: "BMBC-Trullemans", error: true };
  }
}
