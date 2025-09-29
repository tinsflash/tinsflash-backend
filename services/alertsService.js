// services/alertsService.js
import Alert from "../models/Alerts.js";
import { addEngineLog, addEngineError } from "./engineState.js";

// 📌 Récupérer toutes les alertes actives
export async function getActiveAlerts() {
  try {
    const alerts = await Alert.find({ status: "active" }).lean();

    // Normalisation + enrichissement
    return alerts.map(alert => {
      const reliability = alert.reliability || 0;
      const firstDetector = alert.firstDetector === true;

      // Catégorisation automatique
      let category = "ignored";
      if (firstDetector && reliability >= 90) {
        category = "primeur-auto"; // auto-publiée
      } else if (firstDetector && reliability >= 70) {
        category = "primeur"; // à valider
      } else if (reliability >= 90) {
        category = "auto"; // publiée automatiquement
      } else if (reliability >= 70) {
        category = "pending"; // en attente
      }

      return {
        id: alert._id,
        type: alert.type || "Indéterminé",
        zone: alert.zone || alert.continent || "Zone inconnue",
        intensity: alert.intensity || "Non précisée",
        start: alert.start || null,
        end: alert.end || null,
        reliability,
        firstDetector,
        category,
        description: alert.description || "",
        consequences: alert.consequences || "",
        recommendations: alert.recommendations || "",
        status: alert.status,
        createdAt: alert.createdAt,
      };
    });
  } catch (err) {
    addEngineError("Erreur getActiveAlerts: " + err.message);
    return [];
  }
}

// 📌 Mettre à jour le statut d'une alerte (valider / ignorer / attente)
export async function updateAlertStatus(id, action) {
  try {
    let status = "pending";
    if (action === "validate") status = "validated";
    else if (action === "ignore") status = "ignored";

    const alert = await Alert.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    if (alert) {
      addEngineLog(`Alerte ${id} mise à jour en ${status}`);
    }

    return alert;
  } catch (err) {
    addEngineError("Erreur updateAlertStatus: " + err.message);
    return null;
  }
}

// 📌 Créer et sauvegarder une nouvelle alerte
export async function createAlert(data) {
  try {
    const alert = new Alert({
      type: data.type,
      zone: data.zone || data.continent || "Zone inconnue",
      intensity: data.intensity || "Non précisée",
      start: data.start,
      end: data.end,
      reliability: data.reliability || 0,
      firstDetector: data.firstDetector || false,
      description: data.description || "",
      consequences: data.consequences || "",
      recommendations: data.recommendations || "",
      status: "active",
    });

    await alert.save();
    addEngineLog(`Nouvelle alerte créée: ${alert.type} (${alert.zone})`);

    return alert;
  } catch (err) {
    addEngineError("Erreur createAlert: " + err.message);
    return null;
  }
}

// 📌 Traiter et enregistrer une liste d’alertes
export async function processAlerts(alerts = []) {
  try {
    const results = [];
    for (const a of alerts) {
      const alert = await createAlert(a);
      if (alert) results.push(alert);
    }
    return { count: results.length, alerts: results };
  } catch (err) {
    addEngineError("Erreur processAlerts: " + err.message);
    return { error: err.message };
  }
}
