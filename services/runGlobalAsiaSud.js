// ==========================================================
// 🌏 TINSFLASH – runGlobalAsiaSud.js
// Everest Protocol v4.1 PRO+++ (HydroRisk + Volcanic + Monsoon zones ready)
// ==========================================================
// Couvre : Inde, Pakistan, Bangladesh, Népal, Bhoutan,
// Sri Lanka, Maldives, Afghanistan
// Objectif : suivi mousson, Himalaya, zones sismiques & inondations
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES – Asie du Sud (HydroRisk + Volcans Himalaya inclus)
// ==========================================================
export const ASIA_SUD_ZONES = {
  India: [
    { lat: 28.61, lon: 77.21, region: "New Delhi - Nord" },
    { lat: 19.07, lon: 72.87, region: "Mumbai - Côte Ouest" },
    { lat: 13.08, lon: 80.27, region: "Chennai - Côte Est" },
    { lat: 22.57, lon: 88.36, region: "Kolkata - Gange Est" },
    { lat: 12.97, lon: 77.59, region: "Bangalore - Plateau Sud" },
    { lat: 9.93, lon: 76.26, region: "Kochi - Kerala - Mousson" },
    { lat: 31.10, lon: 77.17, region: "Shimla - Himalaya Sud" },
    // 🌋 Zones volcaniques/tectoniques indiennes
    { lat: 10.25, lon: 77.48, region: "Ghats Ouest - Instabilité orographique" },
    { lat: 13.33, lon: 77.20, region: "Plateau Deccan - Zone sismique" },
  ],
  Pakistan: [
    { lat: 33.68, lon: 73.04, region: "Islamabad - Nord" },
    { lat: 24.86, lon: 67.01, region: "Karachi - Sud" },
    { lat: 31.58, lon: 74.36, region: "Lahore - Est" },
    { lat: 30.18, lon: 66.97, region: "Quetta - Montagnes Ouest" },
    { lat: 34.02, lon: 71.56, region: "Peshawar - Nord-Ouest" },
    { lat: 27.72, lon: 68.83, region: "Sukkur - Vallée Indus" },
  ],
  Bangladesh: [
    { lat: 23.81, lon: 90.41, region: "Dhaka - Centre" },
    { lat: 22.35, lon: 91.83, region: "Chittagong - Côte Sud" },
    { lat: 24.89, lon: 91.87, region: "Sylhet - Nord-Est" },
    { lat: 25.75, lon: 89.27, region: "Rangpur - Nord" },
  ],
  Nepal: [
    { lat: 27.71, lon: 85.32, region: "Kathmandu - Vallée Centrale" },
    { lat: 28.20, lon: 83.98, region: "Pokhara - Himalaya Central" },
    { lat: 29.37, lon: 82.18, region: "Simikot - Himalaya Nord" },
    // 🌋 Volcans & séismes himalayens
    { lat: 27.98, lon: 86.92, region: "Everest - Toit du monde" },
    { lat: 28.60, lon: 84.00, region: "Annapurna - Failles sismiques" },
  ],
  Bhutan: [
    { lat: 27.47, lon: 89.64, region: "Thimphu - Capitale" },
    { lat: 27.35, lon: 91.55, region: "Trashigang - Est" },
    { lat: 26.88, lon: 89.38, region: "Phuentsholing - Sud" },
  ],
  SriLanka: [
    { lat: 6.93, lon: 79.85, region: "Colombo - Côte Ouest" },
    { lat: 7.29, lon: 80.64, region: "Kandy - Montagnes Centrales" },
    { lat: 8.56, lon: 81.23, region: "Trincomalee - Côte Est" },
    { lat: 5.95, lon: 80.55, region: "Matara - Sud" },
  ],
  Maldives: [
    { lat: 4.18, lon: 73.51, region: "Malé - Atoll Central" },
    { lat: 0.69, lon: 73.15, region: "Addu - Atoll Sud" },
    { lat: 5.10, lon: 73.07, region: "Baa - Atoll Nord" },
  ],
  Afghanistan: [
    { lat: 34.52, lon: 69.18, region: "Kaboul - Centre" },
    { lat: 31.61, lon: 65.71, region: "Kandahar - Sud" },
    { lat: 36.72, lon: 67.11, region: "Mazar-e-Sharif - Nord" },
    { lat: 34.34, lon: 62.20, region: "Herat - Ouest" },
    { lat: 35.31, lon: 69.45, region: "Panjshir - Vallée Nord-Est" },
  ],
};

// ==========================================================
// 🧠 Extraction réelle – Asie du Sud (Phase 1)
// ==========================================================
export async function runGlobalAsiaSud() {
  try {
    await addEngineLog("🌏 Démarrage extraction Asie du Sud (HydroRisk+Volcans)", "info", "runGlobalAsiaSud");

    const zones = [];
    for (const [country, subzones] of Object.entries(ASIA_SUD_ZONES)) {
      for (const z of subzones) zones.push({ country, ...z, continent: "Asia" });
    }

    if (!zones.length) {
      await addEngineError("Aucune zone Asie du Sud trouvée", "runGlobalAsiaSud");
      return { status: "fail", message: "Aucune zone trouvée" };
    }

    // --- Extraction réelle via superForecast ---
    const result = await superForecast({ zones, runType: "AsieSud" });
    const timestamp = new Date().toISOString();

    // --- Sauvegarde locale + Mongo ---
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `asia_sud_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Asie du Sud",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "AsieSud",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ Asie du Sud : ${zones.length} zones traitées (HydroRisk+Volcans, Mongo + ${path.basename(outFile)})`,
      "success",
      "runGlobalAsiaSud"
    );

    return { summary: { region: "Asie du Sud", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalAsiaSud : ${err.message}`, "runGlobalAsiaSud");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { ASIA_SUD_ZONES, runGlobalAsiaSud };
export { runGlobalAsiaSud as runAsiaSud };
