const { sendNotification } = require("../utils/notifier");

function analyzeForecast(forecast) {
  let alerts = [];

  forecast.forEach((f) => {
    if (f.wind > 80) {
      alerts.push({
        type: "vent violent",
        severity: "rouge",
        ts: f.ts,
        certainty: 0.95,
      });
    }
    if (f.rain > 50) {
      alerts.push({
        type: "inondation",
        severity: "orange",
        ts: f.ts,
        certainty: 0.9,
      });
    }
  });

  return alerts;
}

function processAlerts(forecast) {
  const alerts = analyzeForecast(forecast);

  alerts.forEach((a) => {
    if (a.certainty >= 0.9) {
      // auto-publier
      sendNotification(a);
    } else {
      // envoyer en admin console
      console.log("⚠️ Alerte à valider en console:", a);
    }
  });

  return alerts;
}

module.exports = { processAlerts };

