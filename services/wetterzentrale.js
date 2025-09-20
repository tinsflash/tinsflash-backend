// services/wetterzentrale.js
export function parseWetterzentraleData(raw) {
  try {
    return {
      temperature: raw.temp,
      wind: raw.wind,
      description: raw.desc || "Pas de description"
    };
  } catch (err) {
    return { error: err.message };
  }
}
