// ==========================================================
// 🇨🇦 TINSFLASH – runGlobalCanada.js
// Everest Protocol v5.2.3 PRO+++ (HydroRisk + Cyclones + Arctic Influence)
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES – CANADA
// ==========================================================
export const CANADA_ZONES = {
  East: [
    { lat: 45.42, lon: -75.69, region: "Ottawa - Ontario" },
    { lat: 43.65, lon: -79.38, region: "Toronto - Ontario" },
    { lat: 46.82, lon: -71.21, region: "Québec - Capitale" },
    { lat: 47.56, lon: -52.71, region: "St John's - Terre-Neuve" },
    { lat: 44.65, lon: -63.57, region: "Halifax - Nouvelle-Écosse" },
  ],
  West: [
    { lat: 49.28, lon: -123.12, region: "Vancouver - Côtes Pacifiques" },
    { lat: 53.54, lon: -113.49, region: "Edmonton - Prairies" },
    { lat: 51.05, lon: -114.07, region: "Calgary - Alberta" },
    { lat: 48.43, lon: -123.37, region: "Victoria - Île Vancouver" },
  ],
  North: [
    { lat: 64.28, lon: -83.38, region: "Nunavut - Arctique" },
    { lat: 69.65, lon: -133.71, region: "Inuvik - TNO" },
  ],
};

// ==========================================================
// 🚀 Extraction réelle – Canada
// ==========================================================
export async function runGlobalCanada() {
  try {
    await addEngineLog("🇨🇦 Démarrage extraction Canada (HydroRisk + Arctic)", "info", "runGlobalCanada");

    const zones = [];
    for (const [regionGroup, subzones] of Object.entries(CANADA_ZONES)) {
      for (const z of subzones) {
        zones.push({
          sourceRun: "runGlobalCanada",
          zoneId: `CAN-${regionGroup}-${z.region}`,
          country: "Canada",
          ...z,
          continent: "NorthAmerica",
          timestampRun: new Date().toISOString(),
        });
      }
    }

    const result = await superForecast({ zones, runType: "Canada" });
    const timestamp = new Date().toISOString();

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

    await addEngineLog(`✅ Canada : ${zones.length} zones traitées`, "success", "runGlobalCanada");

    return { summary: { region: "Canada", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalCanada : ${err.message}`, "runGlobalCanada");
    return { error: err.message };
  }
}

export default { CANADA_ZONES, runGlobalCanada };
export { runGlobalCanada as runCanada };
