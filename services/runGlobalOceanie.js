// ==========================================================
// 🌊 TINSFLASH – runGlobalOceanie.js
// Everest Protocol v5.3.0 PRO+++
// ==========================================================
// Objectif : anticiper cyclones, typhons, feux, tsunamis, vagues de chaleur
// Couverture étendue Océanie + Pacifique Sud + dorsale volcanique
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES – Océanie & Pacifique Sud (46 points stratégiques)
// ==========================================================
export const OCEANIA_ZONES = {
  AustralieSud: [
    { lat: -37.81, lon: 144.96, region: "Melbourne – Sud-Est" },
    { lat: -34.93, lon: 138.60, region: "Adelaide – Côtes Sud" },
    { lat: -42.88, lon: 147.33, region: "Hobart – Tasmanie" },
    { lat: -35.28, lon: 149.13, region: "Canberra – Plateau central" },
    { lat: -38.34, lon: 141.61, region: "Portland – Couloir tempêtes" },
  ],

  AustralieNord: [
    { lat: -12.46, lon: 130.84, region: "Darwin – Typhons Nord" },
    { lat: -19.26, lon: 146.82, region: "Townsville – Feux tropicaux" },
    { lat: -16.92, lon: 145.77, region: "Cairns – Cyclones côtiers" },
    { lat: -14.45, lon: 132.26, region: "Katherine – Désert intérieur" },
    { lat: -23.70, lon: 133.87, region: "Alice Springs – Aridité" },
  ],

  AustralieEst: [
    { lat: -33.87, lon: 151.21, region: "Sydney – Couloir océanique" },
    { lat: -27.47, lon: 153.02, region: "Brisbane – Orages humides" },
    { lat: -28.02, lon: 153.40, region: "Gold Coast – Cyclones côtiers" },
    { lat: -25.27, lon: 152.85, region: "Hervey Bay – Inondations" },
    { lat: -24.87, lon: 152.35, region: "Bundaberg – Ouragans" },
  ],

  AustralieOuest: [
    { lat: -31.95, lon: 115.86, region: "Perth – Côtes Ouest" },
    { lat: -21.93, lon: 114.13, region: "Exmouth – Cyclones Indiens" },
    { lat: -25.03, lon: 113.16, region: "Shark Bay – Marées & houle" },
    { lat: -18.02, lon: 122.22, region: "Broome – Risque inondations" },
    { lat: -32.06, lon: 115.74, region: "Fremantle – Surcotes" },
  ],

  NouvelleZelande: [
    { lat: -36.85, lon: 174.76, region: "Auckland – Côtes Nord" },
    { lat: -41.29, lon: 174.78, region: "Wellington – Couloir tempêtes" },
    { lat: -45.87, lon: 170.50, region: "Dunedin – Sud polaire" },
    { lat: -43.53, lon: 172.63, region: "Christchurch – Séismes & vents" },
    { lat: -38.68, lon: 176.07, region: "Taupo – Volcan actif" },
  ],

  PapouasieIndonesie: [
    { lat: -9.47, lon: 147.19, region: "Port Moresby – Cyclones Pacifique" },
    { lat: -3.65, lon: 128.18, region: "Ambon – Arc volcanique" },
    { lat: -0.90, lon: 134.08, region: "Manokwari – Plaque Pacifique" },
    { lat: -2.53, lon: 140.70, region: "Jayapura – Séismes côtiers" },
  ],

  ArchipelsSudPacifique: [
    { lat: -18.14, lon: 178.44, region: "Suva – Fidji" },
    { lat: -21.14, lon: 175.20, region: "Nuku’alofa – Tonga" },
    { lat: -13.83, lon: -171.75, region: "Apia – Samoa" },
    { lat: -17.54, lon: -149.57, region: "Tahiti – Polynésie française" },
    { lat: -5.69, lon: 155.46, region: "Bougainville – Volcan actif" },
    { lat: -8.52, lon: 179.20, region: "Tuvalu – Montée des eaux" },
  ],

  Micronesie: [
    { lat: 7.44, lon: 151.84, region: "Palau – Typhons tropicaux" },
    { lat: 6.92, lon: 158.16, region: "Chuuk – Cyclones humides" },
    { lat: 9.52, lon: 138.12, region: "Yap – Convergence équatoriale" },
    { lat: 13.44, lon: 144.79, region: "Guam – Typhons Ouest Pacifique" },
  ],

  DorsalePacifique: [
    { lat: -14.50, lon: 167.51, region: "Espiritu Santo – Vanuatu" },
    { lat: -20.90, lon: 167.23, region: "Loyalty Islands – Nouvelle-Calédonie" },
    { lat: -22.27, lon: 166.44, region: "Nouméa – Ouragans & houle" },
    { lat: -19.07, lon: 169.90, region: "Tanna – Volcan Yasur" },
  ],
};

// ==========================================================
// 🚀 Extraction réelle – Océanie (Mongo + Typhons + Feux + Séismes)
// ==========================================================
export async function runGlobalOceanie() {
  try {
    await addEngineLog("🌊 Extraction Océanie (Typhons + Feux + Séismes + Mongo)", "info", "runGlobalOceanie");

    const zones = [];
    for (const [regionGroup, subzones] of Object.entries(OCEANIA_ZONES)) {
      for (const z of subzones) {
        zones.push({
          sourceRun: "runGlobalOceanie",
          zoneId: `OCEANIA-${regionGroup}-${z.region}`,
          country: "Oceania",
          ...z,
          continent: "Oceania",
          timestampRun: new Date().toISOString(),
        });
      }
    }

    const result = await superForecast({ zones, runType: "Oceanie" });
    const timestamp = new Date().toISOString();

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `oceanie_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Oceanie",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Oceanie",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(`✅ Océanie : ${zones.length} zones traitées & Mongo sauvegardé`, "success", "runGlobalOceanie");

    return { summary: { region: "Oceanie", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalOceanie : ${err.message}`, "runGlobalOceanie");
    return { error: err.message };
  }
}

export default { OCEANIA_ZONES, runGlobalOceanie };
export { runGlobalOceanie as runOceanie };
