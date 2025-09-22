// services/alertsService.js
import Alert from "../models/Alert.js";
import { addLog } from "./logsService.js";

/**
 * Récupère toutes les alertes
 */
export async function getAlerts() {
  try {
    addLog("📡 Récupération des alertes depuis MongoDB");
    const alerts = await Alert.find().sort({ createdAt: -1 });
    return alerts;
  } catch (err) {
    addLog("❌ Erreur récupération alertes: " + err.message);
    throw err;
  }
}

/**
 * Ajoute une alerte
 */
export async function addAlert(data) {
  try {
    const alert = new Alert(data);
    await alert.save();

    if (alert.certainty >= 90) {
      addLog(`⚠️ Alerte publiée automatiquement (>90%) : ${alert.type} ${alert.zone}`);
    } else if (alert.certainty >= 70) {
      addLog(`🟠 Alerte en attente validation (70–89%) : ${alert.type} ${alert.zone}`);
    } else {
      addLog(`ℹ️ Alerte ignorée (<70%) : ${alert.type} ${alert.zone}`);
    }

    return alert;
  } catch (err) {
    addLog("❌ Erreur ajout alerte: " + err.message);
    throw err;
  }
}

/**
 * Supprime une alerte
 */
export async function deleteAlert(id) {
  try {
    const result = await Alert.findByIdAndDelete(id);
    if (result) {
      addLog(`🗑️ Alerte supprimée : ${result.type} ${result.zone}`);
    }
    return { success: !!result };
  } catch (err) {
    addLog("❌ Erreur suppression alerte: " + err.message);
    throw err;
  }
}
