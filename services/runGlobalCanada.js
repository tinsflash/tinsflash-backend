// ==========================================================
// 🇨🇦 TINSFLASH – runGlobalCanada.js
// Everest Protocol v4.1 PRO+++ (Relief, Arctic & HydroRisk ready)
// ==========================================================
// Objectif : suivi des flux polaires, tempêtes atlantiques, vagues arctiques
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ Provinces & Territoires – zones clés du Canada
// ==========================================================
export const CANADA_ZONES = {
  BritishColumbia: [
    { lat: 49.28, lon: -123.12, region: "Vancouver - Pacific Coast" },
    { lat: 50.12, lon: -122.95, region: "Whistler - Coastal Mountains" },
    { lat: 53.91, lon: -122.75, region: "Prince George - Central BC" },
    { lat: 58.81, lon: -122.69, region: "Fort St. John - North BC" },
  ],
  Alberta: [
    { lat: 51.05, lon: -114.07, region: "Calgary - Foothills" },
    { lat: 53.55, lon: -113.49, region: "Edmonton - Central Plains" },
    { lat: 51.42, lon: -116.18, region: "Banff - Rocky Mountains" },
  ],
  Saskatchewan: [
    { lat: 52.13, lon: -106.67, region: "Saskatoon - Central" },
    { lat: 55.10, lon: -105.28, region: "La Ronge - Northern Forests" },
  ],
  Manitoba: [
    { lat: 49.89, lon: -97.14, region: "Winnipeg - South Central" },
    { lat: 58.77, lon: -94.16, region: "Churchill - Hudson Bay Coast" },
  ],
  Ontario: [
    { lat: 43.65, lon: -79.38, region: "Toronto - Great Lakes" },
    { lat: 45.42, lon: -75.69, region: "Ottawa - Capital" },
    { lat: 48.38, lon: -89.25, region: "Thunder Bay - Superior Coast" },
  ],
  Quebec: [
    { lat: 45.50, lon: -73.56, region: "Montréal - South" },
    { lat: 46.82, lon: -71.22, region: "Québec City - Capital" },
    { lat: 55.28, lon: -77.75, region: "Kuujjuarapik - Nunavik North" },
  ],
  Atlantic: [
    { lat: 44.65, lon: -63.57, region: "Halifax - Nova Scotia Coast" },
    { lat: 47.56, lon: -52.71, region: "St John's - Newfoundland East" },
    { lat: 46.15, lon: -60.18, region: "Sydney - Cape Breton" },
  ],
  Territories: [
    { lat: 60.72, lon: -135.05, region: "Whitehorse - Yukon Capital" },
    { lat: 62.45, lon: -114.37, region: "Yellowknife - Northwest Territories" },
    { lat: 63.75, lon: -68.52, region: "Iqaluit - Nunavut Capital" },
    { lat: 79.99, lon: -85.93, region: "Alert - High Arctic" },
  ],
};

// ==========================================================
// 🧠 Extraction réelle – Canada (Phase 1)
// ==========================================================
export async function runGlobalCanada() {
  try {
    await addEngineLog("🇨🇦 Démarrage extraction Canada (Relief+Arctic)", "info", "runGlobalCanada");

    const zones = [];
    for (const [province, subzones] of Object.entries(CANADA_ZONES)) {
      for (const z of subzones) zones.push({ country: "Canada", province, ...z, continent: "North America" });
    }

    if (!zones.length) {
      await addEngineError("Aucune zone Canada trouvée", "runGlobalCanada");
      return { status: "fail", message: "Aucune zone trouvée" };
    }

    // --- Extraction réelle via superForecast ---
    const result = await superForecast({ zones, runType: "Canada" });
    const timestamp = new Date().toISOString();

    // --- Sauvegarde locale + Mongo ---
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `canada_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Canada",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Canada",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ Canada : ${zones.length} zones traitées (Relief+Arctic, Mongo + ${path.basename(outFile)})`,
      "success",
      "runGlobalCanada"
    );

    return { summary: { region: "Canada", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalCanada : ${err.message}`, "runGlobalCanada");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { CANADA_ZONES, runGlobalCanada };
export { runGlobalCanada as runCanada };
