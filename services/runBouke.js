// ==========================================================
// 🌍 TINSFLASH – runBouke.js
// Everest Protocol v3.96 – Zone spéciale médias Bouké (Province de Namur)
// ==========================================================

import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

// ==========================================================
// 📍 Définition précise des points Bouké (Province de Namur)
// ==========================================================
// Ici, on peut ajouter d’autres coordonnées locales si besoin
export const BOUKE_ZONES = [
  { name: "Bouké (Floriffoux)", lat: 50.468, lon: 4.786 },
  { name: "Namur centre", lat: 50.465, lon: 4.867 },
  { name: "Floreffe", lat: 50.439, lon: 4.765 },
  { name: "Fosses-la-Ville", lat: 50.395, lon: 4.660 },
  { name: "Sambreville", lat: 50.440, lon: 4.600 },
  { name: "Malonne", lat: 50.440, lon: 4.790 },
  { name: "Jambes", lat: 50.454, lon: 4.879 },
];

// ==========================================================
// ⚙️ Fonction d’extraction météo locale Bouké
// ==========================================================
export async function runBouke() {
  try {
    const zones = BOUKE_ZONES;
    await addEngineLog(`🛰️ Démarrage runBouke (${zones.length} points)`, "info", "runBouke");

    const result = await superForecast({ zones, runType: "Bouke" });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Bouke",
      zonesCount: zones.length,
    });

    await addEngineLog(
      `✅ runBouke terminé (${zones.length} zones analysées)`,
      "success",
      "runBouke"
    );

    return result;
  } catch (err) {
    await addEngineError(`❌ Erreur runBouke : ${err.message}`, "runBouke");
    return { error: err.message };
  }
}
