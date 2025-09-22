// services/alertsService.js
import Alert from "../models/Alert.js";

async function getAlerts() {
  return await Alert.find().sort({ createdAt: -1 }).limit(50);
}

async function addAlert(data) {
  if (!data.type || !data.zone || !data.certainty) {
    throw new Error("Champs obligatoires manquants pour l'alerte");
  }

  let severity;
  if (data.certainty >= 90) severity = "rouge";
  else if (data.certainty >= 70) severity = "orange";
  else severity = "jaune";

  const alert = new Alert({
    type: data.type,
    description: data.description || "",
    zone: data.zone,
    certainty: data.certainty,
    severity,
    source: data.source || "Tinsflash AI"
  });

  await alert.save();
  return alert;
}

async function deleteAlert(id) {
  return await Alert.findByIdAndDelete(id);
}

export default { getAlerts, addAlert, deleteAlert };
