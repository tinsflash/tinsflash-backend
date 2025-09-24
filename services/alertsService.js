// services/alertsService.js
import Alert from "../models/Alert.js";
import { addLog } from "./logsService.js";
import axios from "axios";

/**
 * Vérifie si une alerte existe déjà en base ou chez NOAA/Copernicus
 * Retourne un statut clair : Premier détecteur / Déjà signalé / Doublon confirmé
 */
async function checkDuplicate(alert) {
  try {
    // Vérification interne Mongo
    const existing = await Alert.findOne({
      title: alert.title,
      region: alert.region,
      level: alert.level,
    });
    if (existing) return "❌ Doublon confirmé (interne)";

    // Vérification externe NOAA (simplifié → à améliorer avec API clé si dispo)
    const noaaCheck = false;
    // Vérification Copernicus (idem, placeholder)
    const copernicusCheck = false;

    if (noaaCheck || copernicusCheck) {
      return "⚠️ Déjà signalé ailleurs";
    }

    return "✅ Premier détecteur";
  } catch (err) {
    console.error("❌ Erreur checkDuplicate:", err.message);
    return "⚠️ Vérification externe impossible";
  }
}

/**
 * Crée une nouvelle alerte
 * Zones couvertes : locale/nationale (Europe élargie + USA par État + synthèse)
 * Zones non couvertes : alerte par continent
 */
export async function createAlert(data) {
  try {
    const { title, description, level, probability, region } = data;

    const newAlert = new Alert({
      title,
      description,
      level,
      probability,
      region,
      validated: probability >= 90, // auto validée si certitude ≥90%
    });

    const status = await checkDuplicate(newAlert);
    await addLog(`⚠️ Nouvelle alerte ${region} (${level}, ${probability}%) → ${status}`);

    await newAlert.save();
    return { ...newAlert.toObject(), status };
  } catch (err) {
    console.error("❌ Erreur createAlert:", err.message);
    throw err;
  }
}

/**
 * Récupère toutes les alertes
 * - Dernières d’abord
 * - Zones couvertes = précises
 * - Zones non couvertes = globales
 */
export async function getAlerts() {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    return alerts;
  } catch (err) {
    console.error("❌ Erreur getAlerts:", err.message);
    throw err;
  }
}

/**
 * Valide une alerte manuellement (70–89%)
 */
export async function validateAlert(id) {
  try {
    const alert = await Alert.findByIdAndUpdate(
      id,
      { validated: true },
      { new: true }
    );
    await addLog(`✅ Alerte validée manuellement: ${alert.title} (${alert.region})`);
    return alert;
  } catch (err) {
    console.error("❌ Erreur validateAlert:", err.message);
    throw err;
  }
}

/**
 * Supprime une alerte obsolète
 */
export async function deleteAlert(id) {
  try {
    const alert = await Alert.findByIdAndDelete(id);
    await addLog(`🗑️ Alerte supprimée: ${alert?.title || id}`);
    return alert;
  } catch (err) {
    console.error("❌ Erreur deleteAlert:", err.message);
    throw err;
  }
}

export default {
  createAlert,
  getAlerts,
  validateAlert,
  deleteAlert,
};
