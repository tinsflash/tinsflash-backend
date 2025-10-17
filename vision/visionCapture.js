// ====================================================================
// FICHIER : /vision/visionCapture.js
// ====================================================================
// 🌍 TINSFLASH – VisionIA v6.3 GLOBAL NOAA
// 📸 Phase 1B – Capture visuelle multi-satellites et multi-couches
// 🔧 Mise à jour : intégration du moteur NOAA GOES-19 + GOES-18
// ====================================================================

import { captureSatelliteMulti } from "./captureSatelliteMulti.js";
import { storeCapture } from "./storeCapture.js";
import { cleanupOldCaptures } from "./cleanupOldCaptures.js";
import { addVisionLog } from "./logVisionCapture.js";

// ====================================================================
// 🚀 Exécution principale VisionIA – Phase 1B
// ====================================================================
export async function runVisionCapture(region = "Global") {
  try {
    await addVisionLog(
      `📸 [VisionIA] Démarrage capture multi-satellite NOAA GOES pour ${region}`,
      "info"
    );

    // Lance la capture multi-couches globale (NOAA / GOES-19 + GOES-18)
    const captures = await captureSatelliteMulti(region);

    // Enregistre toutes les captures sur Mongo (fonction storeCapture)
    if (Array.isArray(captures)) {
      for (const c of captures) {
        await storeCapture(c);
      }
    }

    // Nettoyage des anciennes captures (> 30 h)
    await cleanupOldCaptures();

    // Journalisation du résultat global
    const count = Array.isArray(captures) ? captures.length : 0;
    await addVisionLog(
      `✅ [VisionIA] ${count} captures enregistrées sur NOAA / GOES`,
      count > 0 ? "success" : "warn"
    );

    return { success: true, stored: captures };
  } catch (err) {
    await addVisionLog(`❌ [VisionIA] Erreur critique : ${err.message}`, "error");
    return { success: false, error: err.message };
  }
}

// ====================================================================
// 🧩 EXPORTS
// ====================================================================
export default { runVisionCapture };
