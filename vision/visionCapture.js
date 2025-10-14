// ====================================================================
// FICHIER : /vision/visionCapture.js
// ====================================================================
// 🌍 TINSFLASH – VisionIA v6.2 PURE_CAPTURE
// 📸 Phase 1B – Capture visuelle multi-satellites et multi-couches
// ====================================================================

import { captureSatelliteMulti } from "./captureSatelliteMulti.js";
import { storeCapture } from "./storeCapture.js";
import { cleanupOldCaptures } from "./cleanupOldCaptures.js";
import { addVisionLog } from "./logVisionCapture.js";

export async function runVisionCapture(zones = []) {
  try {
    await addVisionLog("📸 [VisionIA] Démarrage capture multi-satellite + multi-couches", "info");

    const captures = await captureSatelliteMulti(zones);
    const stored = await storeCapture(captures);

    await cleanupOldCaptures();
    await addVisionLog(`✅ [VisionIA] ${stored.length} captures enregistrées`, "success");

    return { success: true, stored };
  } catch (err) {
    await addVisionLog(`❌ Erreur VisionIA : ${err.message}`, "error");
    return { error: err.message };
  }
}
