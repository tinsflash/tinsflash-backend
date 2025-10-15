// ==========================================================
// 🇧🇪 TINSFLASH – runBelgique.js (Everest Protocol v5.1.8 PRO+++)
// ==========================================================
// Phase 1 uniquement – Extraction physique (sans IA ni vidéo)
// Couverture complète Belgique (maillage par province)
// Persistance directe Mongo Cloud (saveExtractionToMongo)
// ==========================================================

import { addEngineLog, addEngineError, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";
import { superForecast } from "./superForecast.js";
// ----------------------------------------------------------

// ==========================================================
// 🚀 RUN BELGIQUE – Maillage haute précision
// ==========================================================
export async function runBelgique() {
  const runType = "Belgique";

  const zones = [
    // --- Bruxelles (3 points)
    { lat: 50.85, lon: 4.35, region: "Bruxelles-Centre", country: "BE" },
    { lat: 50.83, lon: 4.39, region: "Ixelles", country: "BE" },
    { lat: 50.87, lon: 4.33, region: "Laeken", country: "BE" },

    // --- Brabant wallon (10 points)
    { lat: 50.71, lon: 4.61, region: "Wavre", country: "BE" },
    { lat: 50.68, lon: 4.53, region: "Court-Saint-Étienne", country: "BE" },
    { lat: 50.70, lon: 4.38, region: "Nivelles", country: "BE" },
    { lat: 50.64, lon: 4.48, region: "Genappe", country: "BE" },
    { lat: 50.66, lon: 4.60, region: "Ottignies-Louvain-la-Neuve", country: "BE" },
    { lat: 50.74, lon: 4.54, region: "Rixensart", country: "BE" },
    { lat: 50.60, lon: 4.40, region: "Ittre", country: "BE" },
    { lat: 50.62, lon: 4.33, region: "Rebecq", country: "BE" },
    { lat: 50.75, lon: 4.68, region: "Beauvechain", country: "BE" },
    { lat: 50.73, lon: 4.45, region: "Lasne", country: "BE" },

    // --- Namur (10 points)
    { lat: 50.46, lon: 4.86, region: "Namur", country: "BE" },
    { lat: 50.45, lon: 4.84, region: "Floreffe", country: "BE" },
    { lat: 50.42, lon: 4.83, region: "Floriffoux", country: "BE" },
    { lat: 50.47, lon: 4.87, region: "Bouge", country: "BE" },
    { lat: 50.48, lon: 4.88, region: "Beez", country: "BE" },
    { lat: 50.50, lon: 4.90, region: "Jambes", country: "BE" },
    { lat: 50.44, lon: 4.80, region: "Franière", country: "BE" },
    { lat: 50.52, lon: 4.88, region: "Vedrin", country: "BE" },
    { lat: 50.43, lon: 4.86, region: "Soye", country: "BE" },
    { lat: 50.60, lon: 5.00, region: "Andenne", country: "BE" },

    // --- Liège (10 points)
    { lat: 50.63, lon: 5.58, region: "Liège", country: "BE" },
    { lat: 50.67, lon: 5.87, region: "Verviers", country: "BE" },
    { lat: 50.60, lon: 5.48, region: "Seraing", country: "BE" },
    { lat: 50.74, lon: 5.88, region: "Eupen", country: "BE" },
    { lat: 50.48, lon: 5.86, region: "Spa", country: "BE" },
    { lat: 50.73, lon: 5.57, region: "Herve", country: "BE" },
    { lat: 50.68, lon: 5.38, region: "Waremme", country: "BE" },
    { lat: 50.46, lon: 5.52, region: "Huy", country: "BE" },
    { lat: 50.77, lon: 5.63, region: "Soumagne", country: "BE" },
    { lat: 50.59, lon: 5.69, region: "Chaudfontaine", country: "BE" },

    // --- Luxembourg (10 points)
    { lat: 49.68, lon: 5.82, region: "Arlon", country: "BE" },
    { lat: 49.85, lon: 5.25, region: "Neufchâteau", country: "BE" },
    { lat: 49.86, lon: 5.72, region: "Messancy", country: "BE" },
    { lat: 49.96, lon: 5.47, region: "Bastogne", country: "BE" },
    { lat: 49.88, lon: 5.45, region: "Vaux-sur-Sûre", country: "BE" },
    { lat: 50.03, lon: 5.47, region: "Saint-Hubert", country: "BE" },
    { lat: 50.00, lon: 5.57, region: "Libramont", country: "BE" },
    { lat: 49.98, lon: 5.27, region: "Bertrix", country: "BE" },
    { lat: 49.77, lon: 5.63, region: "Aubange", country: "BE" },
    { lat: 50.06, lon: 5.30, region: "Herbeumont", country: "BE" },

    // --- Hainaut (10 points)
    { lat: 50.41, lon: 4.44, region: "Charleroi", country: "BE" },
    { lat: 50.45, lon: 3.95, region: "La Louvière", country: "BE" },
    { lat: 50.46, lon: 3.97, region: "Binche", country: "BE" },
    { lat: 50.48, lon: 3.97, region: "Morlanwelz", country: "BE" },
    { lat: 50.48, lon: 4.07, region: "Manage", country: "BE" },
    { lat: 50.52, lon: 4.06, region: "Seneffe", country: "BE" },
    { lat: 50.43, lon: 4.15, region: "Fleurus", country: "BE" },
    { lat: 50.47, lon: 3.95, region: "Houdeng", country: "BE" },
    { lat: 50.45, lon: 4.32, region: "Gosselies", country: "BE" },
    { lat: 50.44, lon: 3.97, region: "Soignies", country: "BE" },

    // --- Flandre (3 points / province = 15)
    { lat: 51.22, lon: 4.40, region: "Anvers", country: "BE" },
    { lat: 51.08, lon: 4.40, region: "Boom", country: "BE" },
    { lat: 51.30, lon: 4.75, region: "Herentals", country: "BE" },

    { lat: 51.05, lon: 3.72, region: "Gand", country: "BE" },
    { lat: 51.00, lon: 3.73, region: "Deinze", country: "BE" },
    { lat: 51.06, lon: 3.95, region: "Lokeren", country: "BE" },

    { lat: 51.22, lon: 2.92, region: "Bruges", country: "BE" },
    { lat: 51.18, lon: 2.88, region: "Ostende", country: "BE" },
    { lat: 51.07, lon: 3.20, region: "Tielt", country: "BE" },

    { lat: 51.00, lon: 4.13, region: "Saint-Nicolas", country: "BE" },
    { lat: 51.10, lon: 4.25, region: "Malines", country: "BE" },
    { lat: 50.99, lon: 4.28, region: "Vilvorde", country: "BE" },

    { lat: 51.00, lon: 5.58, region: "Hasselt", country: "BE" },
    { lat: 51.03, lon: 5.42, region: "Genk", country: "BE" },
    { lat: 50.97, lon: 5.24, region: "Tongres", country: "BE" },
  ];

  try {
    await addEngineLog("🇧🇪 Phase 1 – Extraction Belgique (maillage complet) lancée", "info", runType);
    const result = await superForecast({ zones, runType, withAI: false });

    if (!result?.success) throw new Error(result?.error || "Échec extraction Belgique");

    await saveExtractionToMongo("Belgique", "EU", result.phase1Results);
    await setLastExtraction(runType, { status: "OK", count: zones.length });

    await addEngineLog(`✅ Extraction Belgique (${zones.length} zones) terminée et stockée sur Mongo Cloud`, "success", runType);
    return { success: true };
  } catch (e) {
    await addEngineError(`runBelgique: ${e.message}`, runType);
    return { success: false, error: e.message };
  }
}

export default { runBelgique };
