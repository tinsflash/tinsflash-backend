// src/services/geoFactors.js

// Applique des ajustements en fonction de la géographie (altitude, mer, montagne…)
function applyGeoFactors(lat, lon, forecast) {
  if (!forecast || !forecast.temp) return forecast;

  let adjusted = { ...forecast };

  // Exemple : correction altitude
  if (lat && lon && forecast.elevation) {
    // Ajustement basique de température par altitude (0.65°C / 100m)
    adjusted.temp = adjusted.temp - (forecast.elevation / 100) * 0.65;
  }

  // Exemple : si proche de la mer → humidité +5%
  if (forecast.nearSea) {
    adjusted.humidity = (adjusted.humidity || 70) + 5;
  }

  // Exemple : si montagne → vent +10%
  if (forecast.isMountain) {
    adjusted.wind = (adjusted.wind || 10) * 1.1;
  }

  return adjusted;
}

export default { applyGeoFactors };
