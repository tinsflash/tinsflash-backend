// ==========================================================
// 🛰️ TINSFLASH — services/runVisionIA.js
// Phase 1B : capture + analyse VisionIA (IR / Visible / Radar)
// ==========================================================
// Dépendances : puppeteer + jimp
// Utilisé dans : runGlobal.js (ou runGlobalEurope.js, etc.)
// ==========================================================
import { addEngineLog, addEngineError } from "./engineState.js";
import { fetchVisionCaptures } from "./visionFetchers.js";
import { analyzeVision } from "./visionService.js";
import mongoose from "mongoose";

// ----------------------------------------------------------
// 🔧 Modèle de stockage VisionIA dans MongoDB
// ----------------------------------------------------------
const VisionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  zone: { type: String },
  active: { type: Boolean },
  confidence: { type: Number },
  type: { type: String },
  details: { type: Object },
});

const VisionModel =
  mongoose.models.VisionIA || mongoose.model("VisionIA", VisionSchema);

// ----------------------------------------------------------
// 🚀 Fonction principale : Run VisionIA
// ----------------------------------------------------------
export async function runVisionIA(zone = "Europe") {
  await addEngineLog(`🛰️ VisionIA — démarrage Phase 1B (${zone})`, "info", "vision");

  try {
    // 1️⃣ Captures satellites (automatique)
    const captures = await fetchVisionCaptures();
    await addEngineLog(`📸 VisionIA — ${captures.length} capture(s) effectuée(s)`, "info", "vision");

    // 2️⃣ Analyse des captures
    const analysis = await analyzeVision(null, null, zone);

    // 3️⃣ Sauvegarde MongoDB
    const entry = new VisionModel({
      zone,
      active: analysis.active,
      confidence: analysis.confidence,
      type: analysis.type,
      details: analysis.details,
    });
    await entry.save();

    await addEngineLog(
      `✅ VisionIA — résultat : ${analysis.type} (${analysis.confidence} %)`,
      "success",
      "vision"
    );

    return analysis;
  } catch (e) {
    await addEngineError("VisionIA runVisionIA: " + e.message, "vision");
    return { active: false, confidence: 0, type: "none", details: {} };
  }
}

export default { runVisionIA };
