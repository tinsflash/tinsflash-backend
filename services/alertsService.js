// services/alertsService.js
import Alert from "../models/Alert.js";
import comparator from "./comparator.js";
import forecastVision from "./forecastVision.js";
import { addLog } from "./logsService.js";

/**
 * Génère et enregistre une alerte
 * @param {*} forecast Prévision fusionnée
 * @param {string} zone Zone couverte ou non
 */
async function generateAlert(forecast, zone = "covered") {
  try {
    const alertDetails = forecastVision.detectSevereEvent(forecast);

    if (!alertDetails) return null;

    const { type, severity, confidence, location } = alertDetails;
    const alert = new Alert({
      type,
      severity,
      confidence,
      zone,
      location,
      timestamp: new Date(),
      status: confidence >= 90 ? "published" : "pending",
    });

    await alert.save();

    if (confidence >= 90) {
      addLog(`⚠️ Alerte publiée automatiquement (${zone}) : ${type}, ${location}, confiance ${confidence}%`);
    } else {
      addLog(`⚠️ Alerte détectée (${zone}, en attente validation) : ${type}, ${location}, confiance ${confidence}%`);
    }

    return alert;
  } catch (err) {
    addLog("❌ Erreur génération alerte: " + err.message);
    return null;
  }
}

/**
 * Récupérer toutes les alertes
 */
async function getAlerts() {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    return alerts;
  } catch (err) {
    addLog("❌ Erreur getAlerts: " + err.message);
    return [];
  }
}

/**
 * Ajouter manuellement une alerte (admin)
 */
async function addAlert(alertData) {
  try {
    const alert = new Alert({
      ...alertData,
      timestamp: new Date(),
    });
    await alert.save();
    addLog(`📝 Alerte ajoutée manuellement : ${alert.type}, ${alert.location}`);
    return alert;
  } catch (err) {
    addLog("❌ Erreur ajout alerte: " + err.message);
    return null;
  }
}

/**
 * Supprimer une alerte (admin)
 */
async function deleteAlert(id) {
  try {
    await Alert.findByIdAndDelete(id);
    addLog(`🗑️ Alerte supprimée (ID: ${id})`);
    return { success: true };
  } catch (err) {
    addLog("❌ Erreur suppression alerte: " + err.message);
    return { success: false };
  }
}

/**
 * Vérifier et publier les alertes mondiales
 */
async function checkGlobalAlerts(globalForecasts) {
  try {
    const anomalies = comparator.findGlobalAnomalies(globalForecasts);

    for (const anomaly of anomalies) {
      const existing = await Alert.findOne({
        type: anomaly.type,
        location: anomaly.zone,
        timestamp: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // 6h
      });

      if (existing) {
        addLog(`🌍 Alerte mondiale déjà existante : ${anomaly.type} (${anomaly.zone})`);
        continue;
      }

      const alert = new Alert({
        type: anomaly.type,
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        zone: "global",
        location: anomaly.zone,
        timestamp: new Date(),
        status: anomaly.confidence >= 90 ? "published" : "pending",
      });

      await alert.save();

      if (anomaly.confidence >= 90) {
        addLog(`🌍⚠️ Nouvelle alerte mondiale publiée : ${anomaly.type}, ${anomaly.zone}, confiance ${anomaly.confidence}%`);
      } else {
        addLog(`🌍⚠️ Nouvelle alerte mondiale détectée (en attente admin) : ${anomaly.type}, ${anomaly.zone}, confiance ${anomaly.confidence}%`);
      }
    }
  } catch (err) {
    addLog("❌ Erreur checkGlobalAlerts: " + err.message);
  }
}

export default {
  generateAlert,
  getAlerts,
  addAlert,
  deleteAlert,
  checkGlobalAlerts,
};
