// services/alertsService.js
import Alert from "../models/Alert.js";
import { alertThresholds } from "../config/alertThresholds.js";

/**
 * Crée une alerte météo en fonction des seuils définis
 * @param {String} type - type de phénomène (vent, pluie, etc.)
 * @param {Number} reliability - fiabilité en %
 * @param {Object} data - infos complémentaires (zone, intensité, conséquences…)
 * @param {Boolean} isFirstDetector - vrai si on est les premiers à l’avoir détectée
 */
export async function processAlert(type, reliability, data, isFirstDetector = false) {
  const thresholds = alertThresholds[type];
  if (!thresholds) return null;

  let category = "ignored";

  // ≥ 90 % → publication automatique (primeur ou non)
  if (reliability >= thresholds.publication) {
    category = "auto-published";
  }
  // entre 70 et 90 % → à valider
  else if (reliability >= thresholds.primeur) {
    category = isFirstDetector ? "primeur" : "to-validate";
  }

  const alert = new Alert({
    type,
    zone: data.zone,
    reliability,
    firstDetector: isFirstDetector,
    intensity: data.intensity,
    consequences: data.consequences,
    recommendations: data.recommendations,
    start: data.start,
    end: data.end,
    category,
    status: category === "ignored" ? "inactive" : "active"
  });

  await alert.save();
  return alert;
}

/**
 * Récupère toutes les alertes actives
 */
export async function getActiveAlerts() {
  return Alert.find({ status: "active" }).sort({ createdAt: -1 }).lean();
}

/**
 * Met à jour le statut d'une alerte (validée, ignorée, etc.)
 */
export async function updateAlertStatus(id, action) {
  const validActions = ["validated", "ignored"];
  if (!validActions.includes(action)) {
    throw new Error("Action invalide");
  }

  return Alert.findByIdAndUpdate(
    id,
    { category: action, status: action === "ignored" ? "inactive" : "active" },
    { new: true }
  ).lean();
}
