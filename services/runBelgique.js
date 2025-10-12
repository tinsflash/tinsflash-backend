// ==========================================================
// 🇧🇪 TINSFLASH – runBelgique.js (Everest Protocol v4.0 PRO+++ REAL CONNECT)
// ==========================================================
// Extraction complète – Belgique (communes principales)
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import {
  addEngineLog,
  addEngineError,
  updateEngineState,
  setLastExtraction,
} from "./engineState.js";

export async function runBelgique() {
  try {
    await addEngineLog("🇧🇪 Démarrage runBelgique", "info", "runBelgique");

    const zones = [
      { name: "Bruxelles", lat: 50.85, lon: 4.35 },
      { name: "Anvers", lat: 51.22, lon: 4.40 },
      { name: "Gand", lat: 51.05, lon: 3.73 },
      { name: "Liège", lat: 50.63, lon: 5.57 },
      { name: "Namur", lat: 50.47, lon: 4.87 },
      { name: "Charleroi", lat: 50.41, lon: 4.44 },
      { name: "Mons", lat: 50.45, lon: 3.95 },
      { name: "Tournai", lat: 50.61, lon: 3.39 },
      { name: "Arlon", lat: 49.68, lon: 5.81 },
      { name: "Bastogne", lat: 50.00, lon: 5.72 },
      { name: "Marche-en-Famenne", lat: 50.23, lon: 5.34 },
      { name: "Hasselt", lat: 50.93, lon: 5.33 },
      { name: "Louvain", lat: 50.88, lon: 4.70 },
      { name: "Bruges", lat: 51.21, lon: 3.22 },
      { name: "Ostende", lat: 51.22, lon: 2.92 },
      { name: "Knokke-Heist", lat: 51.35, lon: 3.27 },
      { name: "Kortrijk", lat: 50.83, lon: 3.27 },
      { name: "La Louvière", lat: 50.48, lon: 4.19 },
      { name: "Wavre", lat: 50.72, lon: 4.60 },
      { name: "Nivelles", lat: 50.60, lon: 4.33 },
      { name: "Dinant", lat: 50.26, lon: 4.91 },
      { name: "Spa", lat: 50.49, lon: 5.86 },
      { name: "Malmedy", lat: 50.43, lon: 6.03 },
      { name: "Eupen", lat: 50.63, lon: 6.03 },
      { name: "Verviers", lat: 50.59, lon: 5.86 },
      { name: "Neufchâteau", lat: 49.83, lon: 5.43 },
    ];

    const result = await superForecast({ zones, runType: "Belgique", withAI: false });

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "belgique.json");
    fs.writeFileSync(filePath, JSON.stringify(result.phase1Results || result, null, 2), "utf8");

    await setLastExtraction({
      id: `belgique-${Date.now()}`,
      zones: ["belgique"],
      files: [filePath],
      status: "done",
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Belgique",
      zonesCount: zones.length,
    });

    await addEngineLog(`✅ runBelgique terminé (${zones.length} zones)`, "success", "runBelgique");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runBelgique : ${err.message}`, "runBelgique");
    return { error: err.message };
  }
}

export const BELGIQUE_ZONES = [];
export default { runBelgique };
