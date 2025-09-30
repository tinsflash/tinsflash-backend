// services/windService.js
// 💨 Détection vents violents / tempêtes
// Sources : modèles GFS/ECMWF/ICON + ajustement relief/altitude

import { addEngineLog, addEngineError } from "./engineState.js";
import geoFactors from "./geoFactors.js";

export async function analyzeWind(lat, lon, country, region) {
  try {
    addEngineLog(`💨 Analyse vent pour ${country}${region ? " - " + region : ""}`);

    // ⚡ À connecter aux modèles (GFS, ECMWF, ICON)
    // Ici simulation placeholder → remplacer par vraie extraction
    const windSpeed = Math.floor(Math.random() * 120);

    // Ajustement relief / altitude
    const adj = await geoFactors.applyGeoFactors({}, lat, lon);

    let riskLevel = "low";
    if (windSpeed > 90) riskLevel = "high";
    else if (windSpeed > 50) riskLevel = "medium";

    return {
      type: "vent",
      data: { windSpeed },
      risk: riskLevel,
      factors: adj,
    };
  } catch (err) {
    addEngineError(`Erreur analyse vent: ${err.message}`);
    return { type: "vent", error: err.message };
  }
}
