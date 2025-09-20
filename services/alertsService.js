// services/alertsService.js
import Alert from "../models/Alert.js";

// ==============================
// ⚠️ Gestion des alertes météo
// ==============================

// Récupérer toutes les alertes
async function getAlerts() {
  try {
    return await Alert.find().sort({ createdAt: -1 });
  } catch (err) {
    console.error("❌ AlertsService error:", err.message);
    return [];
  }
}

// Ajouter une alerte
async function addAlert(level, message, reliability = 50) {
  try {
    const alert = new Alert({
      level,
      message,
      reliability,
      createdAt: new Date(),
    });
    await alert.save();
    return alert;
  } catch (err) {
    console.error("❌ AddAlert error:", err.message);
    return null;
  }
}

// Supprimer une alerte
async function deleteAlert(id) {
  try {
    return await Alert.findByIdAndDelete(id);
  } catch (err) {
    console.error("❌ DeleteAlert error:", err.message);
    return null;
  }
}

// ✅ Export par défaut attendu par server.js
export default { getAlerts, addAlert, deleteAlert };
