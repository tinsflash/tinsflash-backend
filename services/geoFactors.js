// services/geoFactors.js
import axios from "axios";

/**
 * Applique les ajustements géographiques (relief, altitude, rivières…)
 * pour améliorer la prévision météo.
 */
export async function applyGeoFactors(forecast, lat, lon) {
  try {
    // 🌍 Exemples d’API (remplacer si besoin par de vraies données DEM / hydro)
    const elevationRes = await axios.get(
      `https://api.opentopodata.org/v1/test-dataset?locations=${lat},${lon}`
    );

    const elevation = elevationRes.data?.results?.[0]?.elevation || 0;

    // Ajustement en fonction de l’altitude
    if (elevation > 500) {
      forecast.temperature_max -= 2;
      forecast.temperature_min -= 1;
      forecast.reliability -= 2;
    }

    if (elevation > 1000) {
      forecast.temperature_max -= 4;
      forecast.temperature_min -= 3;
      forecast.reliability -= 5;
    }

    // Influence des rivières / zones humides (simplifié)
    if (lat > 49.5 && lat < 50.5 && lon > 4 && lon < 5) {
      forecast.precipitation += 5;
      forecast.description += " 🌊 Influence locale de l’humidité (rivière)";
    }

    forecast.elevation = elevation;
    return forecast;
  } catch (err) {
    console.error("❌ Erreur geoFactors:", err.message);
    forecast.geoError = err.message;
    return forecast;
  }
}
