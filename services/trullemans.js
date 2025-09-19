// -------------------------
// 🌍 trullemans.js
// Récupération "pirate" des cartes et indices Luc Trullemans
// -------------------------
export async function getTrullemansData(lat, lon) {
  try {
    const url = "https://www.bmcb.be/forecast/"; // site Luc Trullemans
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossible d’accéder à Trullemans");

    const html = await res.text();
    // Exemple simplifié : tu peux scrapper des températures / images
    return {
      source: "Trullemans",
      temperature: null, // pas directement numérique → juste du contexte
      wind: null,
      precipitation: null,
      notes: "Données captées de Luc Trullemans (analyse manuelle possible)",
      raw: html.slice(0, 500) // on garde un extrait
    };
  } catch (err) {
    return { error: err.message };
  }
}
