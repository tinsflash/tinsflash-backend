// services/geoFactors.js
// 🌍 Ajustements géographiques + climatiques pour prévisions
// Relief, altitude, climat régional, environnement

/** 
 * Applique des ajustements géographiques/climatiques aux prévisions 
 * @param {Object} forecast - prévisions météo brutes
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @param {string} country - code pays (optionnel)
 * @returns {Object} forecast enrichi
 */
export async function applyGeoFactors(forecast, lat, lon, country = "") {
  if (!forecast) return forecast;

  try {
    // === Relief & altitude
    if (forecast.temperature !== undefined && forecast.altitude) {
      if (forecast.altitude > 500) {
        // -0,65°C / 100m d’altitude
        forecast.temperature -= (forecast.altitude / 100) * 0.65;
      }
    }
    if (forecast.temperature_min !== undefined && forecast.altitude > 1500) {
      forecast.temperature_min -= 3;
      forecast.temperature_max -= 3;
    }

    // === Proximité mer (plus d’humidité)
    if (forecast.isCoastal && forecast.precipitation) {
      forecast.precipitation *= 1.1;
    }

    // === Zones montagneuses (vent amplifié)
    if (forecast.isMountain && forecast.wind) {
      forecast.wind *= 1.2;
    }

    // === Ajustements climatiques hérités de climateFactors.js
    if (country) {
      const c = country.toUpperCase();
      if (["ES", "IT", "GR"].includes(c)) {
        forecast.temperature_max = (forecast.temperature_max || 20) + 1;
      }
      if (["NO", "SE", "FI"].includes(c)) {
        forecast.temperature_min = (forecast.temperature_min || 5) - 1;
      }
      if (["BE", "NL", "UK", "FR"].includes(c)) {
        forecast.humidity = (forecast.humidity || 70) + 5;
      }
    }

    // === Indice fiabilité global
    forecast.reliability = (forecast.reliability || 50) + 5;

  } catch (err) {
    console.warn("⚠️ GeoFactors error:", err.message);
  }

  return forecast;
}
