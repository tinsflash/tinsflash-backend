// ==========================================================
// 🛰️ TINSFLASH – runBouke.js (Everest Protocol v5.2.3 PRO+++)
// ==========================================================
// Phase 1 uniquement – Extraction réelle (pas d’IA ni vidéo)
// Phase 1B = CAPTURE PURE (satellites) — aucune analyse
// Quadrillage haute densité Province de Namur et zones voisines élargi au Sud
// Ajout : Erpent, Bouge, Wépion, Daussoulx, Rochefort, Hamois, Walcourt, Wellin, Gedinne, Vresse-sur-Semois
// Persistance Mongo Cloud (saveExtractionToMongo)
// ==========================================================

import { addEngineLog, addEngineError, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";
import { superForecast } from "./superForecast.js";

// ----------------------------------------------------------
// 🛰️ VisionIA – CAPTURE SEULE (pas d'analyse ici)
// ----------------------------------------------------------
// NOTE: on utilise le module de capture pure pour respecter Phase 1B.
//       Aucune confidence ni interprétation ne sont calculées ici.
import { runVisionCapture } from "../vision/visionCapture.js";

// ==========================================================
// 🚀 RUN BOUKÉ – Quadrillage central Namur élargi au sud
// ==========================================================
export async function runBouke() {
  const runType = "Bouke-Namur";

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

    // --- Sud/Condroz–Famenne–Ardenne (ajouts 2025-10)
    { lat: 50.166, lon: 5.222, region: "Rochefort", country: "BE" },
    { lat: 50.356, lon: 5.157, region: "Hamois", country: "BE" },
    { lat: 50.253, lon: 4.436, region: "Walcourt", country: "BE" },
    { lat: 50.091, lon: 5.113, region: "Wellin", country: "BE" },
    { lat: 49.987, lon: 4.940, region: "Gedinne", country: "BE" },
    { lat: 49.842, lon: 4.928, region: "Vresse-sur-Semois", country: "BE" },
  ];

  try {
    await addEngineLog("🛰️ Phase 1 – Extraction Bouké-Namur (quadrillage complet) lancée", "info", runType);

    // Phase 1 : extraction physique pure
    const result = await superForecast({ zones, runType, withAI: false });

    if (!result?.success) throw new Error(result?.error || "Échec extraction Bouké-Namur");

    // Sauvegarde Mongo + horodatage run
    await saveExtractionToMongo("Bouke-Namur", "EU", result.phase1Results);
    await setLastExtraction(runType, { status: "OK", count: zones.length });

    await addEngineLog(
      `✅ Extraction Bouké-Namur terminée (${zones.length} points couverts) et stockée sur Mongo Cloud`,
      "success",
      runType
    );

    // ==========================================================
    // 🛰️ PHASE 1B – CAPTURE SATELLITES (IR / Visible / Radar) — CAPTURE SEULE
    // ==========================================================
    try {
      // On capture les images pour les zones du run, sans analyse.
      const vision = await runVisionCapture(zones);

      if (vision?.success) {
        await addEngineLog(
          `📸 VisionIA (capture seule) – ${vision.stored?.length || 0} capture(s) sauvegardée(s)`,
          "info",
          "vision"
        );
      } else {
        await addEngineError(
          `⚠️ VisionIA (capture seule) – problème : ${vision?.error || "inconnu"}`,
          "vision"
        );
      }
    } catch (e) {
      await addEngineError("Erreur capture VisionIA : " + e.message, "vision");
    }

    // Fin stricte Phase 1 / 1B — aucune autre phase déclenchée ici
    return { success: true };
  } catch (e) {
    await addEngineError(`runBouke: ${e.message}`, runType);
    return { success: false, error: e.message };
  }
}

export default { runBouke };
