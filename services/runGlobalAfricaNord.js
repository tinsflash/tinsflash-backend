// ==========================================================
// 💤 runGlobalAfricaNord.js (ARCHIVE NEUTRALISÉE – TINSFLASH PRO+++)
// ==========================================================
// Ce fichier est conservé pour compatibilité Render / Mongo / imports.
// Il ne déclenche plus aucun run ni extraction.
// ==========================================================

import { addEngineLog } from "./engineState.js";

// ==========================================================
// 🚫 FONCTION NEUTRALISÉE
// ==========================================================
export async function runGlobalAfricaNord() {
  await addEngineLog("⏸️ runGlobalAfricaNord neutralisé – archive de compatibilité", "info", "runGlobalAfricaNord");
  return { success: false, message: "Ce run est neutralisé (voir runGlobalAfrique.js centralisé)" };
}

// ==========================================================
// 📦 EXPORTS OFFICIELS
// ==========================================================
export default { runGlobalAfricaNord };
