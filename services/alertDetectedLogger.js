// ==========================================================
// 🌍 TINSFLASH – alertDetectedLogger.js (v5.3 PRO+++)
// ==========================================================
// 🎯 Objectif : journaliser toutes les alertes détectées par
// la Phase 2 IA J.E.A.N. (analyse des modèles + images satellites).
// Enregistre les alertes dans MongoDB (collection: alerts_detected)
// et prépare la console admin pour les afficher en direct.
// ==========================================================

import mongoose from "mongoose";
import { addEngineLog, addEngineError } from "./engineState.js";

// ==========================================================
// 🧱 Schéma Mongo
// ==========================================================
const DetectedAlertSchema = new mongoose.Schema({
  phenomenon: { type: String, required: true },
  zone: { type: String, required: true },
  country: { type: String },
  lat: { type: Number },
  lon: { type: Number },
  alertLevel: { type: String, enum: ["info", "jaune", "orange", "rouge", "extrême"], required: true },
  source: { type: String, default: "TINSFLASH" },
  confidence: { type: Number, default: 1.0 },
  detectedAt: { type: Date, default: Date.now },
  fromPhase: { type: String, default: "IA.JEAN" },
  visualEvidence: { type: Boolean, default: false }, // si IA a confirmé via image satellite
  comparedToExternal: { type: Boolean, default: false },
  primeur: { type: Boolean, default: false },
  details: { type: Object, default: {} },
});

const DetectedAlert = mongoose.model("alerts_detected", DetectedAlertSchema);

// ==========================================================
// 🚀 Enregistrement d'une alerte
// ==========================================================
export async function logDetectedAlert({
  phenomenon,
  zone,
  country,
  lat,
  lon,
  alertLevel,
  confidence = 1.0,
  visualEvidence = false,
  comparedToExternal = false,
  primeur = false,
  details = {},
}) {
  try {
    const newAlert = new DetectedAlert({
      phenomenon,
      zone,
      country,
      lat,
      lon,
      alertLevel,
      confidence,
      visualEvidence,
      comparedToExternal,
      primeur,
      details,
    });

    await newAlert.save();

    await addEngineLog(`🚨 Nouvelle alerte détectée : ${phenomenon} (${zone}) [${alertLevel}]`);
    if (primeur) await addEngineLog(`🥇 PRIMEUR confirmée pour ${zone}`, "alertDetectedLogger");

    return { success: true };
  } catch (err) {
    await addEngineError(`❌ Erreur logDetectedAlert : ${err.message}`, "alertDetectedLogger");
    return { success: false, error: err.message };
  }
}

// ==========================================================
// 📊 Récupération des alertes (pour admin console)
// ==========================================================
export async function getDetectedAlerts(limit = 50) {
  try {
    const alerts = await DetectedAlert.find({})
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();
    return alerts;
  } catch (err) {
    await addEngineError(`❌ Erreur getDetectedAlerts : ${err.message}`, "alertDetectedLogger");
    return [];
  }
}

// ==========================================================
// 🧩 Export par défaut
// ==========================================================
export default { logDetectedAlert, getDetectedAlerts };
