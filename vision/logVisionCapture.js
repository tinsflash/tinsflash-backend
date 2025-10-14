// ====================================================================
// FICHIER : /vision/logVisionCapture.js
// ====================================================================
// 🪶 VisionIA – Journalisation vers engineState
// ====================================================================

import { addEngineLog } from "../services/engineState.js";

export async function addVisionLog(message, level = "info") {
  console.log(message);
  try {
    await addEngineLog(message, level, "visionIA");
  } catch {
    // si le moteur principal n'est pas encore lancé
    console.log(`[VisionIA LOG] ${level.toUpperCase()} - ${message}`);
  }
}
