// ==========================================================
// 💤 runGlobalAfricaOuest.js (ARCHIVE NEUTRALISÉE – TINSFLASH PRO+++)
// ==========================================================
// Ce fichier est conservé pour compatibilité Render / Mongo / imports.
// Il ne déclenche plus aucun run ni extraction.
// ==========================================================

import { addEngineLog } from "./engineState.js";

export async function runGlobalAfricaOuest() {
  await addEngineLog("⏸️ runGlobalAfricaOuest neutralisé – archive de compatibilité", "info", "runGlobalAfricaOuest");
  return { success: false, message: "Ce run est neutralisé (voir runGlobalAfrique.js centralisé)" };
}

export default { runGlobalAfricaOuest };
