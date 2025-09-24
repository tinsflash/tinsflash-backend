// services/alertsService.js
import Alert from "../models/Alerts.js";
import { addLog } from "./logsService.js";

/**
 * Vérifie si une alerte similaire existe déjà (même zone + message proche)
 */
async function isDuplicate(zone, message) {
  const existing = await Alert.findOne({
    zone,
    message: { $regex: message.slice(0, 30), $options: "i" }, // comparaison début message
  });
  return !!existing;
}

/**
 * Crée une alerte avec la logique nucléaire IA
 */
export async function createAlert(data) {
  try {
    const { zone, type, message, confidence, source = "JEAN" } = data;

    if (!zone || !message) {
      throw new Error("Zone et message requis");
    }

    // Vérification doublon
    if (await isDuplicate(zone, message)) {
      await addLog(`❌ Doublon détecté pour la zone ${zone}`);
      return await Alert.create({
        zone,
        type,
        message,
        confidence,
        status: "❌",
        source,
        published: false,
      });
    }

    // Détermination statut selon % confiance
    let status = "⚠️";
    let published = false;

    if (confidence >= 90) {
      status = "✅";
      published = true;
      await addLog(`🚨 Alerte publiée automatiquement pour ${zone} (${confidence}%)`);
    } else if (confidence >= 70) {
      status = "⚠️";
      published = false;
      await addLog(`⏳ Alerte en attente validation admin (${zone}, ${confidence}%)`);
    } else {
      status = "❌";
      published = false;
      await addLog(`ℹ️ Alerte ignorée (<70%) pour ${zone} (${confidence}%)`);
    }

    // Création en base
    const alert = await Alert.create({
      zone,
      type,
      message,
      confidence,
      status,
      source,
      published,
    });

    return alert;
  } catch (err) {
    await addLog("❌ Erreur createAlert: " + err.message);
    throw err;
  }
}

/**
 * Récupère toutes les alertes (limite 100 dernières)
 */
export async function getAlerts(limit = 100) {
  return await Alert.find().sort({ createdAt: -1 }).limit(limit);
}

/**
 * Met à jour une alerte (validation, correction)
 */
export async function updateAlert(id, updates) {
  const alert = await Alert.findByIdAndUpdate(id, updates, { new: true });
  if (alert) {
    await addLog(`✏️ Alerte mise à jour: ${alert._id}`);
  }
  return alert;
}

/**
 * Supprime une alerte
 */
export async function deleteAlert(id) {
  const alert = await Alert.findByIdAndDelete(id);
  if (alert) {
    await addLog(`🗑️ Alerte supprimée: ${alert._id}`);
  }
  return alert;
}

export default { createAlert, getAlerts, updateAlert, deleteAlert };
