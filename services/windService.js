// services/windService.js
// 💨 Détection vent / tempêtes
// Sources : OpenWeather, ICON, Meteomatics, relief montagneux

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";  // ✅ intégré

export async function analyzeWind(lat, lon, country, region) {
  try {
    addEngineLog(`💨 Analyse vent pour ${country}${region ? " - " + region : ""}`);

    // OpenWeather (vent brut)
    let ow = null;
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=windspeed_10m`
      );
      ow = res.data;
    } catch {
      addEngineLog("⚠️ OpenMeteo vent non disponible");
    }

    // ICON (modèle haute résolution vent)
    let icon = null;
    try {
      const res = await axios.get(
        `https://icon-service.meteomatics.com/point?lat=${lat}&lon=${lon}&param=wind`
      );
      icon = res.data;
    } catch {
      addEngineLog("⚠️ ICON vent non disponible");
    }

    // Meteomatics fallback si dispo
    let meteomatics = null;
    try {
      const res = await axios.get(
        `https://api.meteomatics.com/wind?lat=${lat}&lon=${lon}`
      );
      meteomatics = res.data;
    } catch {
      addEngineLog("⚠️ Meteomatics vent non disponible");
    }

    // Ajustements relief (montagnes amplifient le vent)
    const adj = await applyGeoFactors({}, lat, lon, country);

    return {
      type: "vent",
      data: { ow, icon, meteomatics },
      risk: (ow || icon || meteomatics) ? "possible" : "low",
      factors: adj,
    };
  } catch (err) {
    await addEngineError(`Erreur analyse vent: ${err.message}`);
    return { type: "vent", error: err.message };
  }
}
