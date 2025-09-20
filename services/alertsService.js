// services/alertsService.js
import Forecast from "../models/Forecast.js";
import fetch from "node-fetch";

const RAINVIEWER_MAPS = "https://api.rainviewer.com/public/maps.json";

/**
 * Génère des alertes météo à partir des derniers runs
 * - Si fiabilité >= 90% => envoi auto
 * - Si 70–89% => envoi manuel / validation
 */
export async function getAlerts() {
  const alerts = [];
  const runs = await Forecast.find().sort({ createdAt: -1 }).limit(5);

  if (!runs.length) {
    return [{ type: "info", message: "Aucun run météo récent en base" }];
  }

  for (const run of runs) {
    const fc = run.forecast || {};
    const reliability = fc.reliability || 0;

    // Conditions de déclenchement
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
      };

      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Construit un message d’alerte clair
 */
function buildAlertMessage(fc, reliability) {
  let msg = `⚠️ Alerte météo — Fiabilité ${reliability}%\n`;

  if (fc.precipitation > 10) {
    msg += `🌧️ Risque de fortes précipitations (${fc.precipitation} mm/h)\n`;
  }
  if (fc.wind > 80) {
    msg += `💨 Vent violent (${fc.wind} km/h)\n`;
  }
  if (fc.anomaly) {
    msg += `❗ Anomalie détectée: ${fc.anomaly}\n`;
  }

  msg += `\nPrévision: ${fc.description || "N/A"}`;
  return msg;
}

/**
 * Récupère l’image radar la plus récente via RainViewer
 */
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
