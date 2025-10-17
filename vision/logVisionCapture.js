// ====================================================================
// FICHIER : /vision/logVisionCapture.js
// ====================================================================
// 🪶 VisionIA – Journalisation vers engineState (TINSFLASH PRO+++ v6.3)
// ====================================================================

import { addEngineLog } from "../services/engineState.js";

// ====================================================================
// 🧠 addVisionLog
// - Enregistre tous les messages VisionIA dans les logs moteur
// - Fonctionne même si le moteur principal n’est pas encore lancé
// - Respect total des signatures et exports d’origine
// ====================================================================
export async function addVisionLog(message, level = "info", module = "visionIA") {
  const timestamp = new Date().toISOString();

  // Affichage console local / Render
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);

  try {
    await addEngineLog(`[${module}] ${message}`, level, module);
  } catch (err) {
    // Si Mongo/Engine non initialisé ou déconnecté
    console.log(`[VisionIA LOG] (${level.toUpperCase()}) ${message}`);
  }
}
