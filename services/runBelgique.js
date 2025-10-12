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

    // ==========================================================
    // 📍 POINTS MÉTÉO BELGIQUE (≈60 localités)
    // ==========================================================
    const zones = [
      // --- Bruxelles-Capitale
      { name: "Bruxelles", lat: 50.85, lon: 4.35 },
      { name: "Uccle", lat: 50.80, lon: 4.34 },
      { name: "Etterbeek", lat: 50.83, lon: 4.39 },
      { name: "Laeken", lat: 50.88, lon: 4.37 },

      // --- Brabant wallon
      { name: "Wavre", lat: 50.71, lon: 4.60 },
      { name: "Nivelles", lat: 50.60, lon: 4.33 },
      { name: "Ottignies", lat: 50.67, lon: 4.57 },
      { name: "Jodoigne", lat: 50.73, lon: 4.87 },

      // --- Brabant flamand
      { name: "Leuven", lat: 50.88, lon: 4.70 },
      { name: "Tervuren", lat: 50.82, lon: 4.52 },
      { name: "Vilvoorde", lat: 50.93, lon: 4.43 },

      // --- Hainaut
      { name: "Mons", lat: 50.45, lon: 3.95 },
      { name: "La Louvière", lat: 50.47, lon: 4.19 },
      { name: "Charleroi", lat: 50.41, lon: 4.44 },
      { name: "Binche", lat: 50.41, lon: 4.16 },
      { name: "Tournai", lat: 50.61, lon: 3.39 },
      { name: "Ath", lat: 50.63, lon: 3.78 },
      { name: "Chimay", lat: 50.05, lon: 4.32 },
      { name: "Soignies", lat: 50.58, lon: 4.07 },

      // --- Namur
      { name: "Namur", lat: 50.46, lon: 4.86 },
      { name: "Ciney", lat: 50.29, lon: 5.10 },
      { name: "Gembloux", lat: 50.56, lon: 4.69 },
      { name: "Dinant", lat: 50.26, lon: 4.91 },
      { name: "Andenne", lat: 50.50, lon: 5.09 },
      { name: "Profondeville", lat: 50.38, lon: 4.87 },
      { name: "Philippeville", lat: 50.20, lon: 4.54 },
      { name: "Walcourt", lat: 50.25, lon: 4.44 },
      { name: "Éghezée", lat: 50.57, lon: 4.91 },

      // --- Liège
      { name: "Liège", lat: 50.63, lon: 5.57 },
      { name: "Seraing", lat: 50.60, lon: 5.50 },
      { name: "Verviers", lat: 50.59, lon: 5.86 },
      { name: "Huy", lat: 50.52, lon: 5.23 },
      { name: "Spa", lat: 50.49, lon: 5.86 },
      { name: "Eupen", lat: 50.63, lon: 6.03 },
      { name: "Herstal", lat: 50.67, lon: 5.63 },

      // --- Luxembourg
      { name: "Arlon", lat: 49.68, lon: 5.82 },
      { name: "Bastogne", lat: 50.00, lon: 5.72 },
      { name: "Marche-en-Famenne", lat: 50.23, lon: 5.35 },
      { name: "Neufchâteau", lat: 49.84, lon: 5.43 },
      { name: "La Roche-en-Ardenne", lat: 50.18, lon: 5.58 },
      { name: "Virton", lat: 49.56, lon: 5.53 },

      // --- Flandre occidentale
      { name: "Bruges", lat: 51.21, lon: 3.22 },
      { name: "Ostende", lat: 51.22, lon: 2.92 },
      { name: "Ypres", lat: 50.85, lon: 2.89 },
      { name: "Courtrai", lat: 50.82, lon: 3.26 },
      { name: "Dixmude", lat: 51.03, lon: 2.86 },

      // --- Flandre orientale
      { name: "Gand", lat: 51.05, lon: 3.73 },
      { name: "Saint-Nicolas", lat: 51.17, lon: 4.14 },
      { name: "Eeklo", lat: 51.18, lon: 3.56 },
      { name: "Alost", lat: 50.94, lon: 4.03 },
      { name: "Zottegem", lat: 50.87, lon: 3.81 },

      // --- Limbourg
      { name: "Hasselt", lat: 50.93, lon: 5.33 },
      { name: "Genk", lat: 50.96, lon: 5.50 },
      { name: "Tongres", lat: 50.78, lon: 5.46 },
      { name: "Maaseik", lat: 51.10, lon: 5.79 },

      // --- Anvers
      { name: "Anvers", lat: 51.22, lon: 4.40 },
      { name: "Malines", lat: 51.03, lon: 4.48 },
      { name: "Turnhout", lat: 51.32, lon: 4.95 },
      { name: "Geel", lat: 51.17, lon: 4.99 },
    ];

    const result = await superForecast({ zones, runType: "Belgique" });
    await addEngineLog(`✅ runBelgique terminé (${zones.length} zones nationales)`, "success", "runBelgique");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runBelgique : ${err.message}`, "runBelgique");
    console.error("❌ Erreur runBelgique :", err.message);
    return { error: err.message };
  }
}
