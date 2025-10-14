// ==========================================================
// 🧹 CLEANUP SERVICE – TINSFLASH PRO+++
// Nettoyage automatique Mongo : extractions, prévisions, alertes
// ==========================================================

import { addEngineLog, addEngineError } from "./engineState.js";
import { ExtractionModel } from "../models/ExtractionModel.js";
import Forecast from "../models/Forecast.js";
import mongoose from "mongoose";

// Suppression > 48 h : extractions
// Suppression > 72 h : forecasts
// Suppression > 3 jours : alerts_detected
export async function cleanupOldData() {
  try {
    const now = Date.now();

    const delExtraction = await ExtractionModel.deleteMany({
      insertedAt: { $lt: new Date(now - 48 * 60 * 60 * 1000) },
    });

    const delForecast = await Forecast.deleteMany({
      analysedAt: { $lt: new Date(now - 72 * 60 * 60 * 1000) },
    });

    const AlertsDetected = mongoose.connection.collection("alerts_detected");
    const delAlerts = await AlertsDetected.deleteMany({
      detectedAt: { $lt: new Date(now - 3 * 24 * 60 * 60 * 1000) },
    });

    await addEngineLog(
      `🧹 Nettoyage terminé – Extractions:${delExtraction.deletedCount}, Prévisions:${delForecast.deletedCount}, Alertes:${delAlerts.deletedCount}`,
      "success",
      "CLEANUP"
    );

    return {
      extractions: delExtraction.deletedCount,
      forecasts: delForecast.deletedCount,
      alerts: delAlerts.deletedCount,
    };
  } catch (err) {
    await addEngineError("❌ Erreur cleanup : " + err.message, "CLEANUP");
    throw err;
  }
}

export default { cleanupOldData };
