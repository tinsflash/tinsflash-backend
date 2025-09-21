// services/geoFactors.js

/**
 * Applique des facteurs géographiques (altitude, relief, proximité de la mer)
 * pour affiner les prévisions météo brutes.
 */
export function applyGeoFactors(forecast, location) {
  let adjusted = { ...forecast };

  // Exemple simple : altitude
  if (location.altitude && forecast.temperature) {
    // -0.65 °C tous les 100m
    adjusted.temperature =
      forecast.temperature - (location.altitude / 100) * 0.65;
  }

  // Exemple : proximité mer → humidité +10%
  if (location.isCoastal && forecast.precipitation) {
    adjusted.precipitation = forecast.precipitation * 1.1;
  }

  // Exemple : zones montagneuses → vent amplifié
  if (location.isMountain && forecast.wind) {
    adjusted.wind = forecast.wind * 1.2;
  }

  return adjusted;
}
