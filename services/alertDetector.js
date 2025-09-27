// services/alertDetector.js
// Détection d’alertes TINSFLASH
// 🔥 Zones couvertes = local & national
// 🌍 Zones non couvertes = alertes continentales

/**
 * Détection brute d’alertes météo sur base des données ajustées
 * @param {Object} data - { precipitation_adjusted, wind, temp, returnLevel }
 * @returns {Array} alertes brutes
 */
export function detectAlerts(data) {
  if (!data) return [];

  const alerts = [];

  // 🌧️ Alerte pluie
  if (data.precipitation_adjusted != null && data.returnLevel) {
    if (data.precipitation_adjusted > data.returnLevel) {
      alerts.push({
        type: "rain",
        value: data.precipitation_adjusted,
        threshold: data.returnLevel,
        confidence: 85, // sera recalculée plus tard
        message: `Précipitations extrêmes détectées (${data.precipitation_adjusted.toFixed(1)} mm/h)`
      });
    }
  }

  // 💨 Alerte vent
  if (data.wind != null) {
    if (data.wind > 90) { // km/h
      alerts.push({
        type: "wind",
        value: data.wind,
        threshold: 90,
        confidence: 80,
        message: `Rafales violentes > ${data.wind} km/h`
      });
    }
  }

  // 🌡️ Alerte température
  if (data.temp != null) {
    if (data.temp < -15) {
      alerts.push({
        type: "cold",
        value: data.temp,
        threshold: -15,
        confidence: 75,
        message: `Grand froid détecté (${data.temp} °C)`
      });
    }
    if (data.temp > 40) {
      alerts.push({
        type: "heat",
        value: data.temp,
        threshold: 40,
        confidence: 80,
        message: `Canicule extrême (${data.temp} °C)`
      });
    }
  }

  return alerts;
}

/**
 * Filtrage et classement des alertes selon la règle Patrick (fiabilité)
 * @param {Array} rawAlerts - sorties de detectAlerts
 * @param {Object} context - { country, capital, continent }
 * @returns {Object} alertes filtrées + statut publication
 */
export function classifyAlerts(rawAlerts, context = {}) {
  const processed = [];

  for (const a of rawAlerts) {
    let status = "memory"; // défaut = en mémoire

    if (a.confidence < 70) {
      status = "discard"; // en mémoire uniquement
    } else if (a.confidence >= 70 && a.confidence < 90) {
      status = "review"; // à valider manuellement
    } else if (a.confidence >= 90) {
      status = "publish"; // publication auto
    }

    processed.push({
      ...a,
      status,
      country: context.country || null,
      capital: context.capital || null,
      continent: context.continent || null,
      firstDetectedByUs: true, // on marque systématiquement premier
      detectedAt: new Date().toISOString()
    });
  }

  return processed;
}
