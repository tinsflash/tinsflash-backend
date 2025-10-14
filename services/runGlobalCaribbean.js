// ==========================================================
// 🌴 TINSFLASH – runGlobalCaribbean.js
// Everest Protocol v5.3.0 PRO+++
// ==========================================================
// Objectif : détecter cyclones, pluies extrêmes, volcans et tsunamis
// avant tous les modèles officiels (NOAA / ECMWF / MeteoFrance)
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES – Caraïbes / Amérique Centrale (44 points stratégiques)
// ==========================================================
export const CARIBBEAN_ZONES = {
  AntillesFrançaises: [
    { lat: 16.27, lon: -61.53, region: "Basse-Terre - Guadeloupe" },
    { lat: 14.61, lon: -61.05, region: "Fort-de-France - Martinique" },
    { lat: 15.30, lon: -61.38, region: "Roseau - Dominique (Volcan actif)" },
    { lat: 17.12, lon: -62.63, region: "Basseterre - Saint-Kitts-et-Nevis" },
    { lat: 18.07, lon: -63.05, region: "Philipsburg - Saint-Martin" },
  ],

  GrandesAntilles: [
    { lat: 23.13, lon: -82.38, region: "La Havane - Cuba Ouest" },
    { lat: 20.02, lon: -75.83, region: "Santiago - Cuba Est" },
    { lat: 18.54, lon: -72.34, region: "Port-au-Prince - Haïti" },
    { lat: 18.47, lon: -69.89, region: "Saint-Domingue - République Dominicaine" },
    { lat: 18.46, lon: -66.10, region: "San Juan - Porto Rico" },
  ],

  PetitesAntillesSud: [
    { lat: 13.09, lon: -59.61, region: "Bridgetown - Barbade" },
    { lat: 12.05, lon: -61.75, region: "Saint-Georges - Grenade" },
    { lat: 12.11, lon: -68.93, region: "Willemstad - Curaçao" },
    { lat: 11.00, lon: -63.92, region: "Isla Margarita - Venezuela Nord" },
  ],

  CaraibesNord: [
    { lat: 25.04, lon: -77.35, region: "Nassau - Bahamas Centre" },
    { lat: 21.58, lon: -72.27, region: "Providenciales - Turks & Caicos" },
    { lat: 24.56, lon: -81.78, region: "Key West - Dorsale Floride" },
    { lat: 26.12, lon: -79.42, region: "Atlantique Nord - Couloir cyclonique" },
  ],

  AmeriqueCentrale: [
    { lat: 17.50, lon: -88.20, region: "Belize City - Côte caraïbe" },
    { lat: 15.50, lon: -84.33, region: "Puerto Lempira - Honduras Est" },
    { lat: 13.35, lon: -86.09, region: "Managua - Nicaragua" },
    { lat: 12.10, lon: -83.70, region: "Bluefields - Risque cyclonique" },
    { lat: 9.93, lon: -84.08, region: "San José - Costa Rica (HydroRisk)" },
    { lat: 8.98, lon: -79.52, region: "Panama City - Dorsale Pacifique" },
  ],

  VolcansActifs: [
    { lat: 16.70, lon: -62.18, region: "Soufrière Hills - Montserrat" },
    { lat: 14.50, lon: -60.87, region: "Mont Pelée - Martinique" },
    { lat: 13.33, lon: -61.17, region: "La Soufrière - Saint-Vincent" },
    { lat: 10.83, lon: -61.32, region: "Trinité - Tobago Nord" },
  ],

  AtlantiqueLarge: [
    { lat: 19.5, lon: -55.2, region: "Bassin cyclonique central Atlantique" },
    { lat: 14.2, lon: -49.8, region: "Formation cyclonique Sud Atlantique" },
    { lat: 22.7, lon: -50.5, region: "Couloir ouragan Nord Atlantique" },
    { lat: 10.0, lon: -42.0, region: "Dorsale intertropicale Atlantique" },
  ],

  GolfeDuMexique: [
    { lat: 25.68, lon: -100.31, region: "Monterrey - Mexique Nord" },
    { lat: 22.22, lon: -97.85, region: "Tampico - Côtes du Golfe" },
    { lat: 19.43, lon: -99.13, region: "Mexico City - Plateau central" },
    { lat: 21.16, lon: -86.85, region: "Cancún - Zone cyclonique" },
    { lat: 18.75, lon: -88.30, region: "Chetumal - Péninsule Yucatán" },
  ],
};

// ==========================================================
// 🚀 Extraction réelle – Caraïbes (Mongo + Cyclones + Volcans)
// ==========================================================
export async function runGlobalCaribbean() {
  try {
    await addEngineLog("🌴 Extraction Caraïbes (Cyclone Corridor + Volcans + Mongo)", "info", "runGlobalCaribbean");

    const zones = [];
    for (const [regionGroup, subzones] of Object.entries(CARIBBEAN_ZONES)) {
      for (const z of subzones) {
        zones.push({
          sourceRun: "runGlobalCaribbean",
          zoneId: `CARIB-${regionGroup}-${z.region}`,
          country: "Caraïbes",
          ...z,
          continent: "NorthAmerica",
          timestampRun: new Date().toISOString(),
        });
      }
    }

    const result = await superForecast({ zones, runType: "Caribbean" });
    const timestamp = new Date().toISOString();

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `caribbean_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Caribbean",
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

    await addEngineLog(`✅ Caraïbes : ${zones.length} zones traitées & Mongo sauvegardé`, "success", "runGlobalCaribbean");

    return { summary: { region: "Caribbean", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalCaribbean : ${err.message}`, "runGlobalCaribbean");
    return { error: err.message };
  }
}

export default { CARIBBEAN_ZONES, runGlobalCaribbean };
export { runGlobalCaribbean as runCaribbean };
