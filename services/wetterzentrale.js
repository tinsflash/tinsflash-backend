// -------------------------
// 🌍 wetterzentrale.js
// Récupération "pirate" des runs Wetterzentrale
// -------------------------
export async function getWetterzentraleData(lat, lon) {
  try {
    const url = "https://www.wetterzentrale.de/en/"; // runs modèles
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossible d’accéder à Wetterzentrale");

    const html = await res.text();
    return {
      source: "Wetterzentrale",
      temperature: null, // valeurs brutes non accessibles sans parsing image
      wind: null,
      precipitation: null,
      notes: "Runs GFS/ECMWF/ICON disponibles",
      raw: html.slice(0, 500)
    };
  } catch (err) {
    return { error: err.message };
  }
}
