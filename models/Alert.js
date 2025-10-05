// PATH: models/Alert.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    // === Données principales ===
    title: { type: String, required: true },
    description: { type: String, required: true },
    country: { type: String, required: true },  // ex. "FR", "BE", "USA-CA"
    region: { type: String, default: "" },
    continent: { type: String, default: "" },

    // === Localisation géographique ===
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },

    // === Métadonnées ===
    source: { type: String, default: "TINSFLASH Nuclear Core" },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "extreme"],
      default: "medium",
    },
    certainty: { type: Number, min: 0, max: 100, required: true }, // taux de fiabilité

    // === Statut de détection ===
    status: {
      type: String,
      enum: [
        "✅ Premier détecteur", // premium : on est les premiers
        "⚠️ Déjà signalé",
        "❌ Doublon",
      ],
      default: "✅ Premier détecteur",
    },

    // === État d’évolution dans la console ===
    workflow: {
      type: String,
      enum: [
        "under-surveillance", // <70 %
        "toValidate",         // 70–89 %
        "published",          // ≥90 %
        "archived",
      ],
      default: "under-surveillance",
    },

    // === Données IA & analyses ===
    aiAnalysis: {
      type: Object,
      default: null, // réponse de J.E.A.N
    },
    aiAnalysisAt: { type: Date, default: null },

    // === Exports et partenaires ===
    exported: { type: Boolean, default: false },
    exportTargets: { type: [String], default: [] }, // NASA, NWS, Copernicus, etc.
    exportedAt: { type: Date, default: null },

    // === Validation manuelle / auto ===
    validatedBy: { type: String, default: null }, // "auto" ou nom admin
    validatedAt: { type: Date, default: null },

    // === Suivi et tendances ===
    trend: { type: String, enum: ["rising", "falling", "stable"], default: "stable" },
    lastRunId: { type: String, default: null },
    runCount: { type: Number, default: 1 }, // pour la logique "3 run consécutifs"

    // === Données externes / satellites ===
    satelliteConfirmed: { type: Boolean, default: false },
    externalRefs: {
      type: Object,
      default: {}, // éventuelles correspondances NOAA / EUMETSAT / Weather.gov
    },

    // === Horodatage ===
    issuedAt: { type: Date, default: Date.now },
    lastUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", AlertSchema);
