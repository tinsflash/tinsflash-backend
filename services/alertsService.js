// services/alertsService.js
import Alert from "../models/Alert.js";
import { getRadarLayers } from "./radarService.js";

/**
 * Génère et sauvegarde une alerte météo
 * @param {Object} forecast - prévisions météo finales issues du superForecast
 * @returns {Object} - alerte sauvegardée ou erreur
 */
export async function generateAlert(forecast) {
  try {
    if (!forecast) {
      throw new Error("Aucune donnée météo fournie");
    }

    // Détection seuils d’alerte
    const reliability = forecast.reliability || 0;
    let validationRequired = false;
    let autoSend = false;

    if (reliability >= 90) {
      autoSend = true; // on diffuse automatiquement
    } else if (reliability >= 70) {
      validationRequired = true; // nécessite validation manuelle
    }

    // Construire le message d’alerte
    const message = `
      ⚠️ Alerte météo détectée
      ${forecast.description || "Conditions particulières"}
      - Température: ${forecast.temperature}°C
      - Précipitations: ${forecast.precipitation || 0} mm
      - Vent: ${forecast.wind || 0} km/h
      Fiabilité: ${reliability}%
    `;

    // Capture radar simplifiée (URL des tuiles radar actuelles)
    const radarLayers = await getRadarLayers();
    const radarImage = radarLayers?.[0]?.url || "N/A";

    // Sauvegarde MongoDB
    const alert = new Alert({
      time: new Date(),
      reliability,
      status: reliability >= 90 ? "Auto-envoyée" : "En attente",
      forecast: {
        temperature: forecast.temperature,
        precipitation: forecast.precipitation,
        wind: forecast.wind,
        description: forecast.description,
        anomaly: forecast.anomaly || null,
      },
      message,
      radarImage,
      validationRequired,
      autoSend,
      validated: autoSend, // auto validée si fiabilité >= 90
    });

    await alert.save();

    return {
      success: true,
      alert,
    };
  } catch (err) {
    console.error("❌ Erreur génération alerte :", err);
    return { success: false, error: err.message };
  }
}

/**
 * Récupère les dernières alertes
 */
export async function getAlerts(limit = 10) {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(limit);
    return alerts;
  } catch (err) {
    console.error("❌ Erreur récupération alertes :", err);
    return [];
  }
}
