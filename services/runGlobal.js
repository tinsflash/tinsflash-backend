// ==========================================================
// 🌍 TINSFLASH – runGlobal.js (ARCHIVE – Neutralisé PRO+++)
// ==========================================================
// 🔸 Ce module est désormais archivé : remplacé par superForecast.js
// 🔸 Les exports sont conservés pour compatibilité Render et imports
// 🔸 Aucune action réelle n’est exécutée ici
// ==========================================================

import { addEngineLog } from "./engineState.js";

// ==========================================================
// 💤 Fonction neutre (préserve compatibilité Render)
// ==========================================================
export async function runGlobal() {
  await addEngineLog(
    "ℹ️ [ARCHIVE] runGlobal.js neutralisé – utilisez superForecast.js pour tous les runs.",
    "info",
    "runGlobal"
  );

  return {
    status: "archived",
    message: "runGlobal neutralisé – exécuter superForecast.js à la place.",
    success: true,
    zones: 0,
  };
}

// ==========================================================
// 🧩 EXPORT PAR DÉFAUT
// ==========================================================
export default { runGlobal };
