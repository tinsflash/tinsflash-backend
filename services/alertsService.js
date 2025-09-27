// PATH: services/alertsService.js
// Gestion des alertes météo (zones couvertes + alertes continentales)

import mongoose from "mongoose";

let AlertModel;
try {
  AlertModel = mongoose.model("Alert");
} catch {
  const schema = new mongoose.Schema(
    {
      scope: { type: String, enum: ["covered", "global"], required: true },
      country: String,       // pour covered
      continent: String,     // pour global
      title: String,
      level: String,         // ex: jaune/orange/rouge
      confidence: Number,    // 0–100
      firstDetectedByUs: Boolean,
      details: Object,
      createdAt: { type: Date, default: Date.now },
    },
    { strict: false }
  );
  AlertModel = mongoose.model("Alert", schema);
}

/**
 * Retourne les alertes actives
 * - covered : par pays dans les zones couvertes
 * - global : par continent pour les zones non couvertes
 */
export async function getActiveAlerts() {
  try {
    const covered = await AlertModel.find({ scope: "covered" })
      .sort({ createdAt: -1 })
      .lean();

    const global = await AlertModel.find({ scope: "global" })
      .sort({ createdAt: -1 })
      .lean();

    return { covered, global };
  } catch (e) {
    console.error("❌ getActiveAlerts:", e.message);
    return { covered: [], global: [], error: e.message };
  }
}
