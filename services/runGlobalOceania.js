// ==========================================================
// 🌊 TINSFLASH – runGlobalOceania.js
// Everest Protocol v4.1 PRO+++ (El Niño, Volcanic & HydroRisk ready)
// ==========================================================
// Couvre : Australie, Nouvelle-Zélande, Pacifique Sud (Fidji, Tonga, Vanuatu…)
// Objectif : suivi cyclones tropicaux, anomalies ENSO et phénomènes volcaniques
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES DÉTAILLÉES – Océanie & Pacifique Sud
// ==========================================================
export const OCEANIA_ZONES = {
  Australia: [
    { lat: -33.86, lon: 151.21, region: "Sydney - Côte Est" },
    { lat: -37.81, lon: 144.96, region: "Melbourne - Sud" },
    { lat: -27.47, lon: 153.03, region: "Brisbane - Queensland" },
    { lat: -31.95, lon: 115.86, region: "Perth - Ouest" },
    { lat: -12.46, lon: 130.84, region: "Darwin - Nord Tropical" },
    { lat: -23.70, lon: 133.87, region: "Alice Springs - Désert Central" },
    { lat: -35.28, lon: 149.13, region: "Canberra - Capitale" },
    { lat: -42.88, lon: 147.33, region: "Hobart - Tasmanie" },
    { lat: -19.25, lon: 146.82, region: "Townsville - Nord-Est" },
  ],
  NewZealand: [
    { lat: -36.85, lon: 174.76, region: "Auckland - Nord" },
    { lat: -41.28, lon: 174.77, region: "Wellington - Capitale" },
    { lat: -45.87, lon: 170.50, region: "Dunedin - Sud" },
    { lat: -43.53, lon: 172.63, region: "Christchurch - Côte Est" },
    { lat: -39.49, lon: 176.92, region: "Napier - Côte Nord-Est" },
  ],
  FrenchPolynesia: [
    { lat: -17.53, lon: -149.56, region: "Tahiti - Papeete" },
    { lat: -16.50, lon: -151.75, region: "Bora Bora - Îles Sous-le-Vent" },
    { lat: -9.78, lon: -139.03, region: "Marquises - Nuku Hiva" },
    { lat: -23.12, lon: -134.97, region: "Australes - Tubuai" },
  ],
  NewCaledonia: [
    { lat: -22.27, lon: 166.45, region: "Nouméa - Sud" },
    { lat: -20.70, lon: 164.93, region: "Koumac - Nord" },
  ],
  Fiji: [
    { lat: -18.14, lon: 178.44, region: "Suva - Île Viti Levu" },
    { lat: -17.80, lon: 177.42, region: "Nadi - Côte Ouest" },
  ],
  Vanuatu: [
    { lat: -17.74, lon: 168.32, region: "Port Vila - Capitale" },
    { lat: -15.51, lon: 167.18, region: "Luganville - Nord" },
  ],
  Tonga: [
    { lat: -21.13, lon: -175.20, region: "Nuku’alofa - Tongatapu" },
    { lat: -20.54, lon: -175.39, region: "Hunga Tonga - Volcan Sous-Marin" },
  ],
  Samoa: [{ lat: -13.83, lon: -171.77, region: "Apia - Upolu" }],
  CookIslands: [{ lat: -21.21, lon: -159.78, region: "Rarotonga - Capitale" }],
  SolomonIslands: [
    { lat: -9.43, lon: 160.00, region: "Honiara - Guadalcanal" },
    { lat: -8.56, lon: 157.89, region: "Gizo - Archipel Ouest" },
  ],
  PapuaNewGuinea: [
    { lat: -9.47, lon: 147.19, region: "Port Moresby - Sud" },
    { lat: -5.23, lon: 145.79, region: "Mount Hagen - Hautes Terres" },
    { lat: -6.07, lon: 155.69, region: "Rabaul - Volcan Actif" },
  ],
};

// ==========================================================
// 🧠 Extraction réelle – Océanie / Pacifique Sud
// ==========================================================
export async function runGlobalOceania() {
  try {
    await addEngineLog("🌊 Démarrage extraction Océanie / Pacifique Sud (El Niño + Volcans)", "info", "runGlobalOceania");

    const zones = [];
    for (const [country, subzones] of Object.entries(OCEANIA_ZONES)) {
      for (const z of subzones) zones.push({ country, ...z, continent: "Oceania" });
    }

    if (!zones.length) {
      await addEngineError("Aucune zone Océanie trouvée", "runGlobalOceania");
      return { status: "fail", message: "Aucune zone trouvée" };
    }

    // --- Extraction réelle via superForecast ---
    const result = await superForecast({ zones, runType: "Oceania" });
    const timestamp = new Date().toISOString();

    // --- Sauvegarde locale + Mongo ---
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `oceania_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Océanie / Pacifique Sud",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Oceania",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ Océanie : ${zones.length} zones traitées (El Niño+Volcans, Mongo + ${path.basename(outFile)})`,
      "success",
      "runGlobalOceania"
    );

    return { summary: { region: "Océanie / Pacifique Sud", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalOceania : ${err.message}`, "runGlobalOceania");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { OCEANIA_ZONES, runGlobalOceania };
export { runGlobalOceania as runOceania };
