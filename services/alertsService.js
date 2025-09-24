// services/alertsService.js
import Alert from "../models/Alert.js";
import { addLog } from "./logsService.js";

/**
 * Création d'une alerte
 * @param {Object} data - données d'entrée
 */
export async function createAlert(data) {
  try {
    const alert = new Alert({
      title: data.title || "Alerte météo",
      description: data.description || "⚠️ Pas de description fournie",
      country: data.country || "N/A",
      severity: data.severity || "medium",
      certainty: data.certainty || 50,
      issuedAt: data.issuedAt || new Date(),
      source: data.source || "Tinsflash Nuclear Core",
      status: data.status || "✅ Premier détecteur",
    });

    const savedAlert = await alert.save();
    await addLog(`🚨 Nouvelle alerte créée : ${savedAlert.title} (${savedAlert.country})`);

    return savedAlert;
  } catch (err) {
    console.error("❌ Erreur création alerte:", err.message);
    await addLog("❌ Erreur création alerte : " + err.message);
    throw err;
  }
}

/**
 * Récupération des alertes (par pays optionnel)
 */
export async function getAlerts(filter = {}) {
  try {
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    return alerts;
  } catch (err) {
    console.error("❌ Erreur récupération alertes:", err.message);
    throw err;
  }
}

/**
 * Suppression d'une alerte
 */
export async function deleteAlert(id) {
  try {
    const deleted = await Alert.findByIdAndDelete(id);
    if (deleted) {
      await addLog(`🗑️ Alerte supprimée : ${deleted.title} (${deleted.country})`);
    }
    return deleted;
  } catch (err) {
    console.error("❌ Erreur suppression alerte:", err.message);
    throw err;
  }
}

export default { createAlert, getAlerts, deleteAlert };
