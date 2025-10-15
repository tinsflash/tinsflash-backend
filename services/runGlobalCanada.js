// ==========================================================
// 🇨🇦 TINSFLASH – runGlobalCanada.js
// Everest Protocol v5.3.0 PRO+++
// ==========================================================
// Objectif : détecter les phénomènes avant les modèles officiels (NOAA, ECMWF)
// Zones enrichies : Arctic Flow, HydroRisk, Cyclones, Wildfire corridor
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";
// ----------------------------------------------------------
// 🛰️ VisionIA – capture et analyse satellite automatique
// ----------------------------------------------------------
import { runVisionIA } from "./runVisionIA.js";
// ==========================================================
// 🗺️ ZONES – CANADA (36 points stratégiques)
// ==========================================================
export const CANADA_ZONES = {
  Atlantique: [
    { lat: 44.65, lon: -63.57, region: "Halifax - Cyclones Atlantique" },
    { lat: 47.56, lon: -52.71, region: "St John's - Vent maritime" },
    { lat: 46.24, lon: -63.13, region: "Charlottetown - Île-du-Prince-Édouard" },
    { lat: 48.39, lon: -68.52, region: "Rimouski - Est du Québec" },
  ],

  Québec: [
    { lat: 46.82, lon: -71.21, region: "Québec - Capitale" },
    { lat: 45.50, lon: -73.57, region: "Montréal - Zone urbaine" },
    { lat: 48.45, lon: -71.25, region: "Saguenay - Neige et relief" },
    { lat: 49.20, lon: -68.15, region: "Baie-Comeau - Côtes du Saint-Laurent" },
    { lat: 52.95, lon: -66.92, region: "Sept-Îles - Côtes Nordiques" },
    { lat: 58.55, lon: -68.43, region: "Kuujjuaq - Arctique Est" },
  ],

  Ontario: [
    { lat: 45.42, lon: -75.69, region: "Ottawa - Vallée de l’Outaouais" },
    { lat: 43.65, lon: -79.38, region: "Toronto - Lac Ontario" },
    { lat: 46.49, lon: -81.01, region: "Sudbury - Zone forestière" },
    { lat: 49.78, lon: -86.49, region: "Thunder Bay - Lac Supérieur" },
    { lat: 50.45, lon: -89.28, region: "Sioux Lookout - Feux de forêt" },
  ],

  Prairies: [
    { lat: 49.89, lon: -97.14, region: "Winnipeg - Centre" },
    { lat: 52.13, lon: -106.68, region: "Saskatoon - Prairies centrales" },
    { lat: 53.54, lon: -113.49, region: "Edmonton - Alberta Nord" },
    { lat: 51.05, lon: -114.07, region: "Calgary - Alberta Sud" },
    { lat: 55.17, lon: -118.80, region: "Grande Prairie - Forêts boréales" },
  ],

  ColombieBritannique: [
    { lat: 49.28, lon: -123.12, region: "Vancouver - Côtes Pacifiques" },
    { lat: 50.12, lon: -122.95, region: "Whistler - Neige & Montagne" },
    { lat: 52.97, lon: -122.49, region: "Williams Lake - Feux de forêt" },
    { lat: 53.91, lon: -122.75, region: "Prince George - Intérieur Nord" },
    { lat: 48.43, lon: -123.37, region: "Victoria - Île Vancouver" },
  ],

  Arctique: [
    { lat: 64.28, lon: -83.38, region: "Nunavut - Glaces mouvantes" },
    { lat: 69.65, lon: -133.71, region: "Inuvik - TNO" },
    { lat: 74.70, lon: -94.83, region: "Resolute Bay - Haute Arctique" },
    { lat: 68.36, lon: -133.72, region: "Tuktoyaktuk - Fonte côtière" },
    { lat: 70.47, lon: -68.59, region: "Pond Inlet - Extrême Nord" },
  ],
};

// ==========================================================
// 🚀 Extraction réelle – Canada (Mongo-compliant)
// ==========================================================
export async function runGlobalCanada() {
  try {
    await addEngineLog("🇨🇦 Démarrage extraction Canada (HydroRisk + Arctic Flow + WildFire)", "info", "runGlobalCanada");

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

    await addEngineLog(`✅ Canada : ${zones.length} zones traitées (Mongo sauvegardé)`, "success", "runGlobalCanada");

    return { summary: { region: "Canada", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalCanada : ${err.message}`, "runGlobalCanada");
   // ==========================================================
// 🛰️ PHASE 1B – VISION IA (SATELLITES IR / VISIBLE / RADAR)
// ==========================================================
try {
  const vision = await runVisionIA("Europe");
  if (vision?.confidence >= 50) {
    await addEngineLog(
      `🌍 VisionIA (${vision.zone}) active – ${vision.type} (${vision.confidence} %)`,
      "info",
      "vision"
    );
  } else {
    await addEngineLog(
      `🌫️ VisionIA (${vision.zone}) inerte – fiabilité ${vision.confidence} %`,
      "warn",
      "vision"
    );
  }
} catch (e) {
  await addEngineError("Erreur exécution VisionIA : " + e.message, "vision");
}
    return { error: err.message };
  }
}

export default { CANADA_ZONES, runGlobalCanada };
export { runGlobalCanada as runCanada };
