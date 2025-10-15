// ==========================================================
// 🎥 TINSFLASH – runBouke.js
// v5.15 PRO+++
// ==========================================================
// Rôle : extraction Phase 1 (Bouké–Namur quadrillage complet)
// Aucun appel IA ou VisionIA (extraction pure)
// ==========================================================

import { addEngineLog, addEngineError } from "./engineState.js";
import { superForecast } from "./superForecast.js";

export async function runBouke(runType = "core") {
  try {
    await addEngineLog("🎥 Phase 1 – Extraction Bouké-Namur (quadrillage complet) lancée", "info", runType);

    const zones = [
    // --- Axe Namur / Floreffe
    { lat: 50.46, lon: 4.86, region: "Namur", country: "BE" },
    { lat: 50.45, lon: 4.84, region: "Floreffe", country: "BE" },
    { lat: 50.47, lon: 4.87, region: "Bouge", country: "BE" },
    { lat: 50.44, lon: 4.80, region: "Franière", country: "BE" },
    { lat: 50.42, lon: 4.83, region: "Floriffoux", country: "BE" },
    { lat: 50.46, lon: 4.89, region: "Erpent", country: "BE" },
    { lat: 50.42, lon: 4.86, region: "Wépion", country: "BE" },
    { lat: 50.50, lon: 4.83, region: "Daussoulx", country: "BE" },

    // --- Sud Entre-Sambre-et-Meuse
    { lat: 50.23, lon: 4.50, region: "Couvin", country: "BE" },
    { lat: 50.17, lon: 4.55, region: "Nismes", country: "BE" },
    { lat: 50.20, lon: 4.55, region: "Philippeville", country: "BE" },
    { lat: 50.28, lon: 4.65, region: "Florennes", country: "BE" },
    { lat: 50.31, lon: 4.75, region: "Mettet", country: "BE" },
    { lat: 50.33, lon: 4.80, region: "Fosses-la-Ville", country: "BE" },
    { lat: 50.37, lon: 4.70, region: "Bioul", country: "BE" },
    { lat: 50.31, lon: 4.77, region: "Maredsous", country: "BE" },

    // --- Axe Meuse Dinant–Beauraing–Ciney
    { lat: 50.26, lon: 4.91, region: "Dinant", country: "BE" },
    { lat: 50.12, lon: 4.98, region: "Beauraing", country: "BE" },
    { lat: 50.29, lon: 5.10, region: "Ciney", country: "BE" },

    // --- Nord Hesbaye namuroise
    { lat: 50.52, lon: 4.87, region: "Vedrin", country: "BE" },
    { lat: 50.50, lon: 4.90, region: "Jambes", country: "BE" },
    { lat: 50.57, lon: 5.09, region: "Andenne", country: "BE" },
    { lat: 50.44, lon: 4.95, region: "Gesves", country: "BE" },
    { lat: 50.58, lon: 4.91, region: "Eghezée", country: "BE" },
    { lat: 50.58, lon: 4.81, region: "Meux", country: "BE" },
    { lat: 50.56, lon: 4.69, region: "Gembloux", country: "BE" },
    { lat: 50.57, lon: 4.64, region: "Sauvenière", country: "BE" },
    { lat: 50.54, lon: 4.60, region: "Sombreffe", country: "BE" },
    { lat: 50.49, lon: 4.61, region: "Tamines", country: "BE" },
    { lat: 50.47, lon: 4.63, region: "Auvelais", country: "BE" },
  ];

  // Extraction réelle via SuperForecast
    const result = await superForecast({ zones, runType, withAI: false });

    if (!result?.success) throw new Error(result?.error || "Échec extraction Bouké-Namur");

    await saveExtractionToMongo("Bouke-Namur", "EU", result.phase1Results);
    await setLastExtraction(runType, { status: "OK", count: zones.length });

    await addEngineLog(
      `✅ Extraction Bouké-Namur terminée (${zones.length} points couverts) et stockée sur Mongo Cloud`,
      "success",
      runType
    );

    return { success: true };

  } catch (err) {
    await addEngineError(`Erreur inattendue : ${err.message}`, "core");
    return { success: false, error: err.message };
  }
}

export default { runBouke };
