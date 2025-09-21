// services/geoFactors.js

/**
 * Ajuste les prévisions selon des facteurs géographiques
 * - altitude (via OpenElevation)
 * - proximité mer / montagne
 */
export async function applyGeoFactors(forecast, lat, lon) {
  const adjusted = { ...forecast };

  // Ajustement altitude : si > 500m → T° -3°C
  if (forecast.altitude && forecast.altitude > 500) {
    adjusted.temperature = adjusted.temperature - 3;
  }

  // Ajustement mer : si proche de la mer (<50km) → humidité +10%
  if (forecast.nearSea) {
    adjusted.humidity = (adjusted.humidity || 70) + 10;
  }

  return adjusted;
}
