// src/services/localFactors.js

// Applique des ajustements spécifiques à une région (ex : Belgique, France, etc.)
function applyLocalFactors(lat, lon, forecast) {
  if (!forecast) return forecast;
  let adjusted = { ...forecast };

  // Exemple : Belgique → pluie +10% (microclimat humide)
  if (lat >= 49 && lat <= 51.5 && lon >= 2 && lon <= 6) {
    adjusted.rain = (adjusted.rain || 0) * 1.1;
  }

  // Exemple : Espagne sud → chaleur amplifiée
  if (lat >= 36 && lat <= 38 && lon >= -6 && lon <= -2) {
    adjusted.temp = (adjusted.temp || 25) + 2;
  }

  return adjusted;
}

// Version plus générale (appelée dans SuperForecast)
function adjustWithLocalFactors(lat, lon, forecast) {
  let result = applyLocalFactors(lat, lon, forecast);

  // Règles locales supplémentaires (extensibles)
  if (lat >= 40 && lat <= 42 && lon >= -1 && lon <= 3) {
    // Exemple : climat méditerranéen → vent mistral
    result.wind = (result.wind || 15) + 5;
  }

  return result;
}

export default { applyLocalFactors, adjustWithLocalFactors };
