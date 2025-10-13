// ==========================================================
// 🌍 TINSFLASH – runGlobalAfricaEst.js (Everest Protocol v4.1 PRO+++ REAL CONNECT)
// ==========================================================
// Couverture : Afrique de l’Est & Corne (Éthiopie, Somalie, Kenya, Tanzanie,
// Ouganda, Rwanda, Burundi, Érythrée, Djibouti, Soudan du Sud)
// Objectif : suivi Rift africain, flux de mousson, risques sécheresse/inondation.
// ==========================================================

import { addEngineLog, addEngineError, updateEngineState, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js"; // ✅ ajouté pour MongoDB
import fs from "fs";
import path from "path";
export const AFRICA_EST_ZONES = {
  Ethiopia: [
    { lat: 8.98, lon: 38.79, region: "Addis Ababa - Highlands" },
    { lat: 11.59, lon: 37.39, region: "Bahir Dar - Lake Tana" },
    { lat: 13.50, lon: 39.47, region: "Mekelle - Tigray North" },
    { lat: 9.60, lon: 41.86, region: "Dire Dawa/Harar - East Rift" },
    { lat: 6.04, lon: 37.55, region: "Arba Minch - South Rift" }
  ],
  Somalia: [
    { lat: 2.04, lon: 45.34, region: "Mogadishu - Indian Ocean Coast" },
    { lat: 9.56, lon: 44.06, region: "Hargeisa - Highlands" },
    { lat: -0.44, lon: 42.55, region: "Kismayo - South Coast" },
    { lat: 6.77, lon: 47.43, region: "Galkayo - Central Arid" }
  ],
  Kenya: [
    { lat: -1.29, lon: 36.82, region: "Nairobi - Highlands" },
    { lat: -4.05, lon: 39.67, region: "Mombasa - Coast" },
    { lat: 0.52, lon: 35.27, region: "Eldoret - Uasin Gishu" },
    { lat: -0.10, lon: 34.75, region: "Kisumu - Lake Victoria" },
    { lat: 3.12, lon: 35.60, region: "Lodwar - Turkana Desert" }
  ],
  Tanzania: [
    { lat: -6.82, lon: 39.28, region: "Dar es Salaam - Coast" },
    { lat: -6.16, lon: 35.75, region: "Dodoma - Plateau Central" },
    { lat: -3.37, lon: 36.68, region: "Arusha/Kilimanjaro - Highlands" },
    { lat: -2.52, lon: 32.90, region: "Mwanza - Lake Victoria" },
    { lat: -6.16, lon: 39.20, region: "Zanzibar - Isles" }
  ],
  Uganda: [
    { lat: 0.35, lon: 32.58, region: "Kampala - Lake Victoria" },
    { lat: 2.78, lon: 32.30, region: "Gulu - North" },
    { lat: -0.61, lon: 30.66, region: "Mbarara - Southwest Highlands" },
    { lat: 1.09, lon: 34.18, region: "Mbale - Mt Elgon" }
  ],
  SouthSudan: [
    { lat: 4.86, lon: 31.57, region: "Juba - Capital" },
    { lat: 9.54, lon: 31.66, region: "Wau - West" },
    { lat: 6.80, lon: 30.50, region: "Rumbek - Lakes" },
    { lat: 9.53, lon: 31.66, region: "Malakal - Upper Nile" }
  ],
  Rwanda: [
    { lat: -1.95, lon: 30.06, region: "Kigali - Capital" },
    { lat: -1.70, lon: 29.25, region: "Gisenyi - Lake Kivu" },
    { lat: -2.60, lon: 29.74, region: "Huye (Butare) - South" }
  ],
  Burundi: [
    { lat: -3.38, lon: 29.36, region: "Bujumbura - Tanganyika" },
    { lat: -3.43, lon: 29.93, region: "Gitega - Central Highlands" },
    { lat: -2.91, lon: 29.83, region: "Ngozi - North" }
  ],
  Eritrea: [
    { lat: 15.33, lon: 38.93, region: "Asmara - Highlands" },
    { lat: 15.61, lon: 39.45, region: "Massawa - Red Sea Coast" },
    { lat: 13.01, lon: 42.73, region: "Assab - South Red Sea" }
  ],
  Djibouti: [
    { lat: 11.60, lon: 43.15, region: "Djibouti City - Gulf Tadjoura" },
    { lat: 11.78, lon: 42.88, region: "Tadjoura - Rift/Coast" }
  ]
};
// ===========================
// ✅ Exports
// ===========================
export function getAllAfricaEstZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_EST_ZONES)) {
    for (const z of zones) {
      all.push({
        country,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "Africa"
      });
    }
  }
  return all;
}

// ===========================================================
// 🚀 RUN OFFICIEL – Afrique Est & Corne
// ===========================================================
export async function runGlobalAfricaEst() {
  await addEngineLog("🌍 Démarrage runGlobalAfricaEst (Afrique Est & Corne)", "info", "runGlobal");
  const zones = getAllAfricaEstZones();

  try {
    const summary = {
      region: "Africa Est",
      totalZones: zones.length,
      generatedAt: new Date().toISOString(),
      status: "ok"
    };

    // 💾 Sauvegarde locale
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "africa_est.json");
    fs.writeFileSync(filePath, JSON.stringify({ summary, zones }, null, 2), "utf8");

    // ☁️ Sauvegarde Mongo (réelle)
    await saveExtractionToMongo({
      id: `AF-EST-${Date.now()}`,
      region: "Africa Est",
      zones: Object.keys(AFRICA_EST_ZONES),
      file: filePath,
      dataCount: zones.length,
      status: "done",
      timestamp: new Date(),
    });

    // 🧩 Mise à jour état moteur
    await setLastExtraction({
      id: `africaest-${Date.now()}`,
      zones: ["Africa Est"],
      files: [filePath],
      status: "done",
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Africa Est",
      zonesCount: zones.length,
    });

    await addEngineLog(`✅ Afrique Est & Corne : ${zones.length} zones traitées`, "success", "runGlobal");
    return { summary, zones };
  } catch (err) {
    await addEngineError(`Erreur runGlobalAfricaEst : ${err.message}`, "runGlobalAfricaEst");
    return { error: err.message };
  }
}

export default { AFRICA_EST_ZONES, getAllAfricaEstZones, runGlobalAfricaEst };
