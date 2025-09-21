// services/alertsService.js
import Alert from "../models/Alert.js";

/**
 * Récupère toutes les alertes météo
 */
async function getAlerts() {
  try {
    return await Alert.find().sort({ createdAt: -1 });
  } catch (err) {
    console.error("❌ Erreur getAlerts:", err.message);
    return [];
  }
}

/**
 * Ajoute une alerte météo
 * - Auto-validée si certitude ≥ 90 %
 * - A valider manuellement si certitude 70–89 %
 */
async function addAlert(data) {
  try {
    if (!data.type || !data.location || !data.severity) {
      throw new Error("Champs requis manquants pour l’alerte");
    }

    // Auto-validation si certitude ≥ 90 %
    if (data.certainty >= 90) {
      data.validated = true;
    } else {
      data.validated = false; // Nécessite validation manuelle
    }

    const alert = new Alert(data);
    await alert.save();

    console.log(
      `⚠️ Nouvelle alerte ajoutée: ${data.type} (${data.certainty}%) - ${data.validated ? "Validée auto" : "En attente"}`
    );

    return alert;
  } catch (err) {
    console.error("❌ Erreur addAlert:", err.message);
    throw err;
  }
}

/**
 * Supprime une alerte
 */
async function deleteAlert(id) {
  try {
    await Alert.findByIdAndDelete(id);
    console.log(`🗑 Alerte supprimée: ${id}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Erreur deleteAlert:", err.message);
    throw err;
  }
}

/**
 * Valide manuellement une alerte (pour certitude entre 70 et 89 %)
 */
async function validateAlert(id) {
  try {
    const alert = await Alert.findById(id);
    if (!alert) throw new Error("Alerte non trouvée");

    if (alert.certainty < 70) {
      throw new Error("Alerte trop faible (<70%) pour validation manuelle");
    }

    alert.validated = true;
    await alert.save();

    console.log(`✅ Alerte validée manuellement: ${id} (${alert.certainty}%)`);
    return alert;
  } catch (err) {
    console.error("❌ Erreur validateAlert:", err.message);
    throw err;
  }
}

export default {
  getAlerts,
  addAlert,
  deleteAlert,
  validateAlert,
};
