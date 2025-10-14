// ==========================================================
// 🌍 TINSFLASH – alertPrimeurLogger.js (v5.2 PRO+++)
// ==========================================================
// 🎯 Objectif : détecter si une alerte TINSFLASH est émise
// avant les services officiels (IRM, Météo-France, NOAA, etc.)
// et consigner ce statut dans MongoDB ("alerts_primeurs").
// ==========================================================

import mongoose from "mongoose";
import { addEngineLog, addEngineError } from "./engineState.js";

// ==========================================================
// 🧱 Schéma Mongo
// ==========================================================
const PrimeurSchema = new mongoose.Schema({
  phenomenon: { type: String, required: true },
  zone: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  tinsflashAlertLevel: { type: String, required: true }, // jaune / orange / rouge / extrême
  externalSources: [{ name: String, detectedAt: Date, alertLevel: String }],
  primeurConfirmed: { type: Boolean, default: false },
  delayMinutes: { type: Number, default: 0 }, // différence temporelle
  reliability: { type: Number, default: 1.0 },
});

const Primeur = mongoose.model("alerts_primeurs", PrimeurSchema);

// ==========================================================
// 🧠 Fonction : comparer et loguer la primeur
// ==========================================================
export async function logPrimeurAlert({ phenomenon, zone, tinsflashAlertLevel, externalComparisons }) {
  try {
    const now = new Date();
    let earliestExternal = null;

    if (Array.isArray(externalComparisons) && externalComparisons.length > 0) {
      earliestExternal = externalComparisons.reduce((earliest, curr) => {
        const t = new Date(curr.detectedAt || now);
        return !earliest || t < earliest ? t : earliest;
      }, null);
    }

    const delay =
      earliestExternal && earliestExternal < now
        ? (now - earliestExternal) / 60000 // minutes
        : 0;

    const primeur = new Primeur({
      phenomenon,
      zone,
      tinsflashAlertLevel,
      externalSources: externalComparisons || [],
      primeurConfirmed: delay < 0,
      delayMinutes: delay,
      reliability: delay < 0 ? 1.0 : 0.85,
    });

    await primeur.save();

    const status = delay < 0 ? "✅ PRIMEUR" : "ℹ️ Simultané ou postérieur";
    await addEngineLog(`${status} : ${phenomenon} (${zone}) – Δ ${delay.toFixed(1)} min`);

    return { success: true, status, delay };
  } catch (err) {
    await addEngineError(`❌ Erreur logPrimeurAlert : ${err.message}`, "alertPrimeurLogger");
    return { success: false, error: err.message };
  }
}

// ==========================================================
// 🧩 Export par défaut
// ==========================================================
export default { logPrimeurAlert };
