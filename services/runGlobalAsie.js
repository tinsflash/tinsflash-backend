// ==========================================================
// 🌏 TINSFLASH – runGlobalAsie.js
// Everest Protocol v5.2.2 PRO+++
// ==========================================================
// Fusion et enrichissement Asie Est + Sud
// Couvre : Chine, Japon, Corée, Inde, Pakistan, Bangladesh,
// Népal, Bhoutan, Sri Lanka, Maldives, Afghanistan, Philippines, Indonésie
// Objectif : détection précoce typhons, moussons, séismes, volcans actifs
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES – ASIE (Est + Sud, enrichies HydroRisk + Volcans)
// ==========================================================
export const ASIA_ZONES = {
  // --- Asie du Sud (issu de runGlobalAsiaSud enrichi)
  India: [
    { lat: 28.61, lon: 77.21, region: "New Delhi - Nord" },
    { lat: 19.07, lon: 72.87, region: "Mumbai - Côte Ouest" },
    { lat: 13.08, lon: 80.27, region: "Chennai - Côte Est" },
    { lat: 22.57, lon: 88.36, region: "Kolkata - Gange Est" },
    { lat: 9.93, lon: 76.26, region: "Kochi - Kerala - Mousson" },
    { lat: 31.10, lon: 77.17, region: "Shimla - Himalaya Sud" },
    { lat: 10.25, lon: 77.48, region: "Ghats Ouest - Instabilité orographique" },
    { lat: 13.33, lon: 77.20, region: "Plateau Deccan - Zone sismique" },
  ],
  Pakistan: [
    { lat: 33.68, lon: 73.04, region: "Islamabad - Nord" },
    { lat: 24.86, lon: 67.01, region: "Karachi - Sud" },
    { lat: 30.18, lon: 66.97, region: "Quetta - Montagnes Ouest" },
    { lat: 27.72, lon: 68.83, region: "Sukkur - Vallée Indus" },
  ],
  Bangladesh: [
    { lat: 23.81, lon: 90.41, region: "Dhaka - Centre" },
    { lat: 22.35, lon: 91.83, region: "Chittagong - Côte Sud" },
    { lat: 24.89, lon: 91.87, region: "Sylhet - Nord-Est" },
  ],
  Nepal: [
    { lat: 27.71, lon: 85.32, region: "Kathmandu - Vallée Centrale" },
    { lat: 27.98, lon: 86.92, region: "Everest - Toit du monde" },
    { lat: 28.60, lon: 84.00, region: "Annapurna - Failles sismiques" },
  ],
  SriLanka: [
    { lat: 6.93, lon: 79.85, region: "Colombo - Côte Ouest" },
    { lat: 7.29, lon: 80.64, region: "Kandy - Montagnes Centrales" },
    { lat: 8.56, lon: 81.23, region: "Trincomalee - Côte Est" },
  ],
  Maldives: [
    { lat: 4.18, lon: 73.51, region: "Malé - Atoll Central" },
    { lat: 0.69, lon: 73.15, region: "Addu - Atoll Sud" },
  ],
  Afghanistan: [
    { lat: 34.52, lon: 69.18, region: "Kaboul - Centre" },
    { lat: 36.72, lon: 67.11, region: "Mazar-e-Sharif - Nord" },
    { lat: 34.34, lon: 62.20, region: "Herat - Ouest" },
  ],

  // --- Asie de l’Est
  China: [
    { lat: 39.90, lon: 116.40, region: "Beijing - Nord Est" },
    { lat: 31.23, lon: 121.47, region: "Shanghai - Côte Est" },
    { lat: 23.13, lon: 113.26, region: "Guangzhou - Sud Est" },
    { lat: 22.30, lon: 114.17, region: "Hong Kong - Littoral Sud" },
    { lat: 29.56, lon: 106.55, region: "Chongqing - Intérieur humide" },
    { lat: 30.66, lon: 104.06, region: "Chengdu - Plateau Sichuan" },
    { lat: 26.08, lon: 119.30, region: "Fuzhou - Typhon belt" },
    { lat: 43.83, lon: 87.60, region: "Ürümqi - Ouest continental" },
  ],
  Japan: [
    { lat: 35.68, lon: 139.76, region: "Tokyo - Capitale" },
    { lat: 34.69, lon: 135.50, region: "Osaka - Sud" },
    { lat: 35.01, lon: 135.75, region: "Kyoto - Centre" },
    { lat: 43.06, lon: 141.35, region: "Sapporo - Hokkaido" },
    { lat: 32.78, lon: 130.72, region: "Kumamoto - Sud volcanique" },
  ],
  SouthKorea: [
    { lat: 37.56, lon: 126.97, region: "Séoul - Capitale" },
    { lat: 35.18, lon: 129.07, region: "Busan - Côte Sud" },
    { lat: 36.35, lon: 127.38, region: "Daejeon - Centre" },
  ],
  NorthKorea: [
    { lat: 39.03, lon: 125.75, region: "Pyongyang - Capitale" },
    { lat: 41.80, lon: 129.78, region: "Chongjin - Nord Est" },
  ],
  Taiwan: [
    { lat: 25.03, lon: 121.57, region: "Taipei - Capitale" },
    { lat: 23.48, lon: 120.44, region: "Chiayi - Centre" },
    { lat: 22.63, lon: 120.30, region: "Kaohsiung - Sud" },
  ],
  Philippines: [
    { lat: 14.60, lon: 120.98, region: "Manille - Centre" },
    { lat: 10.31, lon: 123.89, region: "Cebu - Îles centrales" },
    { lat: 8.48, lon: 124.65, region: "Cagayan de Oro - Sud" },
    { lat: 6.92, lon: 122.08, region: "Zamboanga - Extrême Sud" },
  ],
  Indonesia: [
    { lat: -6.21, lon: 106.85, region: "Jakarta - Capitale" },
    { lat: -7.25, lon: 112.75, region: "Surabaya - Java Est" },
    { lat: -8.34, lon: 115.09, region: "Bali - Volcanique" },
    { lat: 1.46, lon: 124.84, region: "Manado - Sulawesi Nord" },
    { lat: -0.92, lon: 100.36, region: "Padang - Sumatra Ouest" },
    { lat: -3.32, lon: 135.50, region: "Papua - Hauts plateaux" },
  ],
};

// ==========================================================
// 🚀 Extraction – Asie (Phase 1 complète)
// ==========================================================
export async function runGlobalAsie() {
  try {
    await addEngineLog("🌏 Démarrage extraction Asie (HydroRisk + Volcans + Mousson)", "info", "runGlobalAsie");

    const zones = [];
    for (const [country, subzones] of Object.entries(ASIA_ZONES)) {
      for (const z of subzones) {
        zones.push({
          sourceRun: "runGlobalAsie",
          zoneId: `${country}-${z.region}`,
          country,
          ...z,
          continent: "Asia",
          timestampRun: new Date().toISOString(),
        });
      }
    }

    const result = await superForecast({ zones, runType: "Asie" });
    const timestamp = new Date().toISOString();

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `asie_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Asie",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Asie",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ Asie : ${zones.length} zones traitées (HydroRisk+Volcans+Mousson, Mongo + ${path.basename(outFile)})`,
      "success",
      "runGlobalAsie"
    );

    return { summary: { region: "Asie", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalAsie : ${err.message}`, "runGlobalAsie");
    return { error: err.message };
  }
}

export default { ASIA_ZONES, runGlobalAsie };
export { runGlobalAsie as runAsie };
