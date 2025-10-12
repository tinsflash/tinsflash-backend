// ==========================================================
// 🇧🇪 TINSFLASH – runBelgique.js (Everest Protocol v3.9 PRO+++)
// ==========================================================
// Extraction nationale – Belgique entière (haute densité)
// Objectif : couverture plus fine que les services météo officiels
// ==========================================================

import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function runBelgique() {
  try {
    await addEngineLog("🇧🇪 Démarrage runBelgique (national complet)", "info", "runBelgique");

    const zones = [ ... ]; // (tes 60 localités déjà présentes, inchangées)

    const result = await superForecast({ zones, runType: "Belgique" });
    await addEngineLog(`✅ runBelgique terminé (${zones.length} zones nationales)`, "success", "runBelgique");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runBelgique : ${err.message}`, "runBelgique");
    console.error("❌ Erreur runBelgique :", err.message);
    return { error: err.message };
  }
}

// ==========================================================
// 🔁 Export des zones (pour zonesCovered.js)
// ==========================================================
export const BELGIQUE_ZONES = zones;
