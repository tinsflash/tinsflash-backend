// -------------------------
// ⚠️ alertsService.js
// Générateur d’alertes météo intelligentes
// -------------------------

import { runSuperForecast } from "./superForecast.js";

let memoryAlerts = []; // backup mémoire si pas de DB

/**
 * Génère des alertes météo à partir des prévisions
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @param {string} country - pays
 */
export async function getAlerts(lat = 50.85, lon = 4.35, country = "BE") {
  try {
    const forecast = await runSuperForecast(lat, lon, country);
    const f = forecast.forecast || {};

    const alerts = [];

    // 🌧️ Pluie forte
    if (f.precipitation > 20) {
      alerts.push({
        level: "danger",
        type: "pluie",
        message: "Précipitations intenses attendues",
        reliability: f.reliability || 60,
      });
    } else if (f.precipitation > 5) {
      alerts.push({
        level: "warning",
        type: "pluie",
        message: "Risque de pluie significative",
        reliability: f.reliability || 70,
      });
    }

    // ❄️ Neige / Verglas
    if (f.temperature_min <= 0 && f.precipitation > 2) {
      alerts.push({
        level: "danger",
        type: "neige",
        message: "Risque de neige ou verglas",
        reliability: f.reliability || 75,
      });
    }

    // 🌡️ Températures extrêmes
    if (f.temperature_max >= 35) {
      alerts.push({
        level: "danger",
        type: "chaleur",
        message: "Canicule / Températures extrêmes",
        reliability: f.reliability || 80,
      });
    }
    if (f.temperature_min <= -10) {
      alerts.push({
        level: "danger",
        type: "froid",
        message: "Grand froid anormal",
        reliability: f.reliability || 80,
      });
    }

    // 🌬️ Vent violent
    if (f.wind >= 80) {
      alerts.push({
        level: "danger",
        type: "vent",
        message: "Rafales de vent violentes attendues",
        reliability: f.reliability || 85,
      });
    } else if (f.wind >= 50) {
      alerts.push({
        level: "warning",
        type: "vent",
        message: "Rafales de vent modérées",
        reliability: f.reliability || 75,
      });
    }

    // 🌩️ Orages
    if (f.description && f.description.toLowerCase().includes("orage")) {
      alerts.push({
        level: "warning",
        type: "orage",
        message: "Risque d’orages",
        reliability: f.reliability || 70,
      });
    }

    // Sauvegarde en mémoire locale
    memoryAlerts = alerts;

    return alerts;
  } catch (err) {
    console.error("❌ Erreur génération alertes :", err.message);

    // fallback → renvoyer dernières alertes connues
    return memoryAlerts.length > 0
      ? memoryAlerts
      : [{ level: "info", message: "Pas d’alertes disponibles", reliability: 0 }];
  }
}
