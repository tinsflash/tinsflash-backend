// services/alertsService.js
import Alert from "../models/Alert.js";

const alertsService = {
  // Récupérer toutes les alertes
  async getAlerts() {
    return await Alert.find().sort({ createdAt: -1 }).limit(50);
  },

  // Ajouter une nouvelle alerte
  async addAlert(data) {
    if (!data.type || !data.zone || !data.certainty) {
      throw new Error("Champs obligatoires manquants pour l’alerte");
    }

    const severity =
      data.certainty >= 90 ? "rouge" :
      data.certainty >= 70 ? "orange" : "jaune";

    const alert = new Alert({
      type: data.type,
      description: data.description || "",
      zone: data.zone,
      certainty: data.certainty,
      severity,
      source: data.source || "Tinsflash AI",
    });

    await alert.save();
    return alert;
  },

  // Supprimer une alerte
  async deleteAlert(id) {
    return await Alert.findByIdAndDelete(id);
  },
};

export default alertsService;
