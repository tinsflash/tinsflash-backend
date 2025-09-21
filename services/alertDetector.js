// services/alertDetector.js
import { logInfo, logError } from "../utils/logger.js";

/**
 * Détection intelligente des alertes météo
 * @param {Object} forecast - données météo fusionnées par superForecast
 * @returns {Array} - liste des alertes détectées
 */
export function detectAlerts(forecast) {
  const alerts = [];

  try {
    logInfo("🔎 Analyse des conditions météo pour détection d’alertes...");

    // Pluie forte
    if (forecast.rain && forecast.rain > 50) {
      const confidence = forecast.rain > 100 ? 95 : 80;
      alerts.push({
        type: "Pluie forte",
        value: `${forecast.rain} mm/24h`,
        confidence,
        action: confidence >= 90 ? "AUTO" : "MANUAL"
      });
      logInfo(`🌧️ Alerte pluie forte détectée (${forecast.rain} mm)`);
    }

    // Neige forte
    if (forecast.snow && forecast.snow > 20) {
      const confidence = forecast.snow > 50 ? 92 : 75;
      alerts.push({
        type: "Neige forte",
        value: `${forecast.snow} cm/24h`,
        confidence,
        action: confidence >= 90 ? "AUTO" : "MANUAL"
      });
      logInfo(`❄️ Alerte neige forte détectée (${forecast.snow} cm)`);
    }

    // Vent violent
    if (forecast.wind && forecast.wind > 80) {
      const confidence = forecast.wind > 120 ? 95 : 85;
      alerts.push({
        type: "Vent violent",
        value: `${forecast.wind} km/h`,
        confidence,
        action: confidence >= 90 ? "AUTO" : "MANUAL"
      });
      logInfo(`💨 Alerte vent violent détectée (${forecast.wind} km/h)`);
    }

    // Tempête / Ouragan (pression + vent)
    if (forecast.wind > 120 && forecast.pressure < 980) {
      alerts.push({
        type: "Tempête / Ouragan",
        value: `${forecast.wind} km/h, pression ${forecast.pressure} hPa`,
        confidence: 97,
        action: "AUTO"
      });
      logInfo(`🌀 Alerte tempête/ouragan détectée`);
    }

    // Orage fort (via convection CAPE ou indicateur orage)
    if (forecast.thunderstorm || (forecast.cape && forecast.cape > 1500)) {
      const confidence = forecast.cape > 2500 ? 93 : 80;
      alerts.push({
        type: "Orage fort",
        value: `CAPE=${forecast.cape || "?"}`,
        confidence,
        action: confidence >= 90 ? "AUTO" : "MANUAL"
      });
      logInfo(`⛈️ Alerte orage fort détectée`);
    }

    // Inondations (pluie cumulée + sol saturé si dispo)
    if (forecast.rain && forecast.rain > 80 && forecast.soil && forecast.soil > 90) {
      alerts.push({
        type: "Inondation",
        value: `${forecast.rain} mm + sol saturé ${forecast.soil}%`,
        confidence: 92,
        action: "AUTO"
      });
      logInfo(`🌊 Alerte inondation détectée`);
    }

    // Chaleur extrême
    if (forecast.tempMax && forecast.tempMax > 38) {
      const confidence = forecast.tempMax > 42 ? 95 : 85;
      alerts.push({
        type: "Chaleur extrême",
        value: `${forecast.tempMax}°C`,
        confidence,
        action: confidence >= 90 ? "AUTO" : "MANUAL"
      });
      logInfo(`🔥 Alerte chaleur extrême détectée (${forecast.tempMax}°C)`);
    }

    // Grand froid
    if (forecast.tempMin && forecast.tempMin < -15) {
      const confidence = forecast.tempMin < -25 ? 95 : 80;
      alerts.push({
        type: "Grand froid",
        value: `${forecast.tempMin}°C`,
        confidence,
        action: confidence >= 90 ? "AUTO" : "MANUAL"
      });
      logInfo(`🥶 Alerte grand froid détectée (${forecast.tempMin}°C)`);
    }

    logInfo(`✅ Analyse terminée : ${alerts.length} alerte(s) trouvée(s)`);

  } catch (err) {
    logError("Erreur dans detectAlerts: " + err.message);
  }

  return alerts;
}
