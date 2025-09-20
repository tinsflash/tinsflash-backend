// services/geoFactors.js
import axios from "axios";

/**
 * Calcule des facteurs géographiques (altitude, proximité mer/rivière, etc.)
 * et ajuste la prévision en conséquence.
 */
export async function applyGeoFactors(forecast, lat, lon) {
  let adjusted = { ...forecast };

  try {
    // ✅ Altitude via API Open-Elevation
    const elevRes = await axios.get(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );
    const altitude = elevRes.data.results[0].elevation || 0;

    // Correction température selon altitude
    adjusted.temperature_min -= Math.round(altitude / 200 * 0.65);
    adjusted.temperature_max -= Math.round(altitude / 150 * 0.65);

    // ✅ Approximations simples
    const nearSea = isNearSea(lat, lon);
    const nearRiver = isNearRiver(lat, lon);

    if (nearSea) {
      adjusted.wind += 5; // vents plus forts
      adjusted.reliability += 2;
      adjusted.description += " | Influence maritime";
    }

    if (nearRiver) {
      adjusted.reliability += 3;
      adjusted.description += " | Risque brouillard";
    }

    if (altitude > 800) {
      adjusted.description += " | Zone montagneuse";
      adjusted.reliability -= 5; // modèles moins fiables en montagne
    }

    // Clamp valeurs
    adjusted.reliability = Math.min(100, Math.max(0, adjusted.reliability));
  } catch (err) {
    console.error("⚠️ Erreur geoFactors:", err.message);
    adjusted.description += " | Facteurs locaux non appliqués";
  }

  return adjusted;
}

// Détection simplifiée de proximité mer
function isNearSea(lat, lon) {
  // Exemple rapide : si proche des côtes BE, FR, NL
  return (
    (lat >= 48 && lat <= 52 && lon >= 2 && lon <= 4) || // Manche, mer du Nord
    (lat >= 43 && lat <= 45 && lon >= -1 && lon <= 3)   // Atlantique Sud-Ouest
  );
}

// Détection simplifiée de proximité rivière
function isNearRiver(lat, lon) {
  // Exemple basique : coordonnées proches du Rhin ou de la Meuse
  return (
    (lat >= 50 && lat <= 52 && lon >= 5 && lon <= 7) || // Rhin
    (lat >= 49 && lat <= 51 && lon >= 4 && lon <= 6)    // Meuse
  );
}
