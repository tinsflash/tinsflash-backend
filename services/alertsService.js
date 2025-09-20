// services/alertsService.js
import Forecast from "../models/Forecast.js";
import Alert from "../models/Alert.js";
import fetch from "node-fetch";

const RAINVIEWER_MAPS = "https://api.rainviewer.com/public/maps.json";

export async function getAlerts() {
  const alerts = [];
  const runs = await Forecast.find().sort({ createdAt: -1 }).limit(5);

  for (const run of runs) {
    const fc = run.forecast || {};
    const reliability = fc.reliability || 0;

    if (fc.precipitation > 10 || fc.wind > 80 || fc.anomaly) {
      const alert = {
        time: run.time,
        reliability,
        status: run.status,
        forecast: {
          temperature: fc.temperature || fc.temperature_max || "N/A",
          precipitation: fc.precipitation || 0,
          wind: fc.wind || 0,
          description: fc.description || "N/A",
          anomaly: fc.anomaly || null,
        },
        message: buildAlertMessage(fc, reliability),
        radarImage: await getLatestRadarImage(),
        validationRequired: reliability >= 70 && reliability < 90,
        autoSend: reliability >= 90,
        validated: reliability >= 90, // auto validées si >=90
      };

      // Sauvegarde en DB si nouvelle
      await Alert.create(alert);
      alerts.push(alert);
    }
  }

  return alerts;
}

function buildAlertMessage(fc, reliability) {
  let msg = `⚠️ Alerte météo — Fiabilité ${reliability}%\n`;

  if (fc.precipitation > 10) msg += `🌧️ Fortes précipitations (${fc.precipitation} mm/h)\n`;
  if (fc.wind > 80) msg += `💨 Vent violent (${fc.wind} km/h)\n`;
  if (fc.anomaly) msg += `❗ Anomalie: ${fc.anomaly}\n`;

  msg += `\nPrévision: ${fc.description || "N/A"}`;
  return msg;
}

async function getLatestRadarImage() {
  try {
    const res = await fetch(RAINVIEWER_MAPS);
    const data = await res.json();
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      return `https://tilecache.rainviewer.com/v2/radar/${latest}/256/{z}/{x}/{y}/2/1_1.png`;
    }
  } catch (err) {
    console.error("Erreur récupération radar:", err.message);
  }
  return null;
}
