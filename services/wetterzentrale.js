// services/wetterzentrale.js

function parseWetterzentraleData(raw) {
  try {
    return {
      source: "Wetterzentrale",
      temperature_min: raw.temp_min || raw.temp || 0,
      temperature_max: raw.temp_max || raw.temp || 0,
      wind: raw.wind || 0,
      precipitation: raw.precipitation || 0,
      description: raw.desc || "Pas de description",
      reliability: 60
    };
  } catch (err) {
    console.error("❌ Wetterzentrale parse error:", err.message);
    return {
      source: "Wetterzentrale",
      temperature_min: 0,
      temperature_max: 0,
      wind: 0,
      precipitation: 0,
      reliability: 0,
      error: err.message
    };
  }
}

async function getForecast(lat, lon) {
  try {
    // Exemple brut simulé → à remplacer par vrai scraping API Wetterzentrale
    const raw = {
      temp: 12,
      wind: 15,
      precipitation: 2,
      desc: "Ciel variable"
    };
    return parseWetterzentraleData(raw);
  } catch (err) {
    console.error("❌ Wetterzentrale error:", err.message);
    return {
      source: "Wetterzentrale",
      temperature_min: 0,
      temperature_max: 0,
      wind: 0,
      precipitation: 0,
      reliability: 0,
      error: err.message
    };
  }
}

export default { getForecast };
