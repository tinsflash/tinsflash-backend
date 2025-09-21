// services/alertsService.js
import Alert from "../models/Alert.js";

async function getAlerts() {
  try {
    return await Alert.find().sort({ createdAt: -1 });
  } catch (err) {
    console.error("❌ AlertsService error:", err.message);
    return [];
  }
}

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

async function deleteAlert(id) {
  try {
    return await Alert.findByIdAndDelete(id);
  } catch (err) {
    console.error("❌ DeleteAlert error:", err.message);
    return null;
  }
}

export default { getAlerts, addAlert, deleteAlert };
