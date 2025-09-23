// services/alertsService.js
import Alert from "../models/Alert.js";
import { addLog } from "./logsService.js";

/**
 * 🔹 Récupérer toutes les alertes
 */
export async function getAlerts() {
  return await Alert.find().sort({ createdAt: -1 });
}

/**
 * 🔹 Ajouter une alerte
 * @param {Object} data 
 */
export async function addAlert(data) {
  const alert = new Alert({
    title: data.title,
    description: data.description,
    severity: data.severity,
    certainty: data.certainty,
    affectedZones: data.affectedZones || [],
    status: data.status || "pending", // pending | validated | published
  });

  const saved = await alert.save();
  addLog(`⚠️ Nouvelle alerte ajoutée: ${saved.title} (Certitude: ${saved.certainty}%)`);

  return saved;
}

/**
 * 🔹 Supprimer une alerte
 */
export async function deleteAlert(id) {
  const result = await Alert.findByIdAndDelete(id);
  addLog(`🗑️ Alerte supprimée: ${id}`);
  return result;
}

/**
 * 🔹 Valider une alerte (admin)
 */
export async function validateAlert(id) {
  const alert = await Alert.findByIdAndUpdate(
    id,
    { status: "validated" },
    { new: true }
  );
  addLog(`✅ Alerte validée: ${alert?.title || id}`);
  return alert;
}

/**
 * 🔹 Publier automatiquement une alerte (si certitude > 90 %)
 */
export async function autoPublishAlert(data) {
  if (data.certainty >= 90) {
    const alert = new Alert({
      ...data,
      status: "published",
    });
    const saved = await alert.save();
    addLog(`🚨 Alerte publiée automatiquement: ${saved.title} (Certitude ${saved.certainty}%)`);
    return saved;
  }
  return null;
}

export default {
  getAlerts,
  addAlert,
  deleteAlert,
  validateAlert,
  autoPublishAlert,
};
