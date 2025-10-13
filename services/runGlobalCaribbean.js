// ==========================================================
// 🌴 TINSFLASH – runGlobalCaribbean.js
// Everest Protocol v4.1 PRO+++ (Cyclones, HydroRisk & Volcanic zones)
// ==========================================================
// Couvre : Antilles, Amérique Centrale & Golfe du Mexique
// Objectif : suivi cyclones, ouragans, ondes tropicales et activité volcanique
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES DÉTAILLÉES – Caraïbes & Amérique Centrale
// ==========================================================
export const CARIBBEAN_ZONES = {
  Cuba: [
    { lat: 23.13, lon: -82.38, region: "La Havane - Nord-Ouest" },
    { lat: 20.02, lon: -75.83, region: "Santiago - Sud-Est" },
  ],
  DominicanRepublic: [
    { lat: 18.47, lon: -69.89, region: "Saint-Domingue - Sud" },
    { lat: 19.45, lon: -70.70, region: "Santiago - Nord" },
  ],
  Haiti: [
    { lat: 18.54, lon: -72.34, region: "Port-au-Prince - Ouest" },
    { lat: 19.00, lon: -71.70, region: "Cap-Haïtien - Nord" },
  ],
  Jamaica: [
    { lat: 17.98, lon: -76.80, region: "Kingston - Sud-Est" },
    { lat: 18.47, lon: -77.92, region: "Montego Bay - Nord" },
  ],
  PuertoRico: [
    { lat: 18.46, lon: -66.10, region: "San Juan - Nord" },
    { lat: 18.22, lon: -67.15, region: "Mayagüez - Ouest" },
  ],
  LesserAntilles: [
    { lat: 14.61, lon: -61.05, region: "Martinique - Fort-de-France" },
    { lat: 16.27, lon: -61.53, region: "Guadeloupe - Basse-Terre" },
    { lat: 13.10, lon: -59.61, region: "Barbade - Sud-Est" },
    { lat: 15.30, lon: -61.39, region: "Dominique - Volcans" },
    { lat: 17.12, lon: -62.63, region: "Saint-Kitts - Nord" },
    { lat: 18.08, lon: -63.05, region: "Saint-Martin - Nord" },
  ],
  TrinidadTobago: [
    { lat: 10.67, lon: -61.52, region: "Port of Spain - Trinidad" },
    { lat: 11.25, lon: -60.67, region: "Scarborough - Tobago" },
  ],
  Bahamas: [
    { lat: 25.04, lon: -77.35, region: "Nassau - New Providence" },
    { lat: 23.65, lon: -75.90, region: "Exuma - Archipel Central" },
  ],
  Mexico: [
    { lat: 21.16, lon: -86.85, region: "Cancún - Riviera Maya" },
    { lat: 19.43, lon: -99.13, region: "Mexico City - Plateau Central" },
    { lat: 19.51, lon: -98.63, region: "Popocatépetl - Volcan Actif" },
  ],
  Guatemala: [
    { lat: 14.63, lon: -90.55, region: "Guatemala City - Plateau" },
    { lat: 14.47, lon: -90.88, region: "Volcán de Fuego - Actif" },
  ],
  Honduras: [
    { lat: 14.08, lon: -87.21, region: "Tegucigalpa - Centre" },
    { lat: 15.50, lon: -87.00, region: "La Ceiba - Côte Caraïbe" },
  ],
  Nicaragua: [
    { lat: 12.13, lon: -86.25, region: "Managua - Centre" },
    { lat: 11.98, lon: -86.10, region: "Masaya - Volcan" },
  ],
  CostaRica: [
    { lat: 9.93, lon: -84.08, region: "San José - Vallée Centrale" },
    { lat: 10.47, lon: -84.70, region: "Arenal - Volcan Actif" },
  ],
  Panama: [
    { lat: 8.98, lon: -79.52, region: "Panama City - Canal" },
    { lat: 8.77, lon: -82.43, region: "David - Côte Pacifique" },
  ],
  Belize: [
    { lat: 17.50, lon: -88.20, region: "Belize City - Côte Caraïbe" },
  ],
};

// ==========================================================
// 🧠 Extraction réelle – Caraïbes & Amérique Centrale
// ==========================================================
export async function runGlobalCaribbean() {
  try {
    await addEngineLog("🌴 Démarrage extraction Caraïbes / Amérique Centrale (Cyclones+Volcans)", "info", "runGlobalCaribbean");

    const zones = [];
    for (const [country, subzones] of Object.entries(CARIBBEAN_ZONES)) {
      for (const z of subzones) zones.push({ country, ...z, continent: "North America" });
    }

    if (!zones.length) {
      await addEngineError("Aucune zone Caraïbes trouvée", "runGlobalCaribbean");
      return { status: "fail", message: "Aucune zone trouvée" };
    }

    // --- Extraction réelle via superForecast ---
    const result = await superForecast({ zones, runType: "Caribbean" });
    const timestamp = new Date().toISOString();

    // --- Sauvegarde locale + Mongo ---
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `caribbean_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Caraïbes & Amérique Centrale",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Caribbean",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ Caraïbes : ${zones.length} zones traitées (Cyclones+Volcans, Mongo + ${path.basename(outFile)})`,
      "success",
      "runGlobalCaribbean"
    );

    return { summary: { region: "Caraïbes & Amérique Centrale", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalCaribbean : ${err.message}`, "runGlobalCaribbean");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { CARIBBEAN_ZONES, runGlobalCaribbean };
export { runGlobalCaribbean as runCaribbean };
