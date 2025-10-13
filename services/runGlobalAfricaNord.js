// PATH: services/runGlobalAfricaNord.js
// 🌍 Référentiel zones Afrique du Nord – TINSFLASH PRO+++
// Couvre : Maroc, Algérie, Tunisie, Libye, Égypte
// Objectif : surveillance du flux saharien, orages méditerranéens et canicules
// ==========================================================

import { addEngineLog, addEngineError, updateEngineState, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js"; // ✅ ajouté pour la sauvegarde Mongo
import fs from "fs";
import path from "path";

export const AFRICA_NORD_ZONES = {
  Morocco: [
    { lat: 33.97, lon: -6.85, region: "Rabat - Capital Coast" },
    { lat: 34.02, lon: -5.00, region: "Fès - Interior" },
    { lat: 31.63, lon: -8.00, region: "Marrakech - South Plain" },
    { lat: 35.76, lon: -5.83, region: "Tanger - North Coast" },
  ],
  Algeria: [
    { lat: 36.75, lon: 3.05, region: "Alger - Capital" },
    { lat: 35.21, lon: -0.63, region: "Oran - West Coast" },
    { lat: 31.61, lon: 2.21, region: "Ghardaïa - Desert" },
    { lat: 27.87, lon: -0.29, region: "Tamanrasset - Sahara South" },
  ],
  Tunisia: [
    { lat: 36.80, lon: 10.18, region: "Tunis - Capital" },
    { lat: 35.67, lon: 10.10, region: "Sousse - Coast" },
    { lat: 33.88, lon: 10.85, region: "Gabès - Gulf" },
    { lat: 32.93, lon: 10.45, region: "Medenine - South" },
  ],
  Libya: [
    { lat: 32.88, lon: 13.19, region: "Tripoli - Coast" },
    { lat: 31.20, lon: 16.59, region: "Sirte - Central Coast" },
    { lat: 24.08, lon: 23.30, region: "Kufra - Desert" },
    { lat: 32.12, lon: 20.07, region: "Benghazi - East" },
  ],
  Egypt: [
    { lat: 30.04, lon: 31.24, region: "Cairo - Capital" },
    { lat: 31.20, lon: 29.92, region: "Alexandria - Coast" },
    { lat: 25.69, lon: 32.64, region: "Luxor - Upper Egypt" },
    { lat: 27.18, lon: 31.19, region: "Asyut - Interior" },
  ],
};
export function getAllAfricaNordZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_NORD_ZONES)) {
    for (const z of zones) {
      all.push({ country, region: z.region, lat: z.lat, lon: z.lon, continent: "Africa" });
    }
  }
  return all;
}

// ==========================================================
// 🚀 RUN OFFICIEL – Afrique du Nord
// ==========================================================
export async function runGlobalAfricaNord() {
  await addEngineLog("🌍 Démarrage runGlobalAfricaNord (Afrique du Nord)", "info", "runGlobal");
  const zones = getAllAfricaNordZones();

  try {
    // 🔄 Résumé
    const summary = {
      region: "Africa Nord",
      totalZones: zones.length,
      generatedAt: new Date().toISOString(),
      status: "ok",
    };

    // 💾 Sauvegarde locale
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "africa_nord.json");
    fs.writeFileSync(filePath, JSON.stringify({ summary, zones }, null, 2), "utf8");

    // ☁️ Sauvegarde Mongo réelle
    await saveExtractionToMongo({
      id: `AF-NORD-${Date.now()}`,
      region: "Africa Nord",
      zones: Object.keys(AFRICA_NORD_ZONES),
      file: filePath,
      dataCount: zones.length,
      status: "done",
      timestamp: new Date(),
    });

    // ⚙️ Mise à jour état moteur
    await setLastExtraction({
      id: `africanord-${Date.now()}`,
      zones: ["Africa Nord"],
      files: [filePath],
      status: "done",
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Africa Nord",
      zonesCount: zones.length,
    });

    await addEngineLog(`✅ Afrique du Nord : ${zones.length} zones traitées`, "success", "runGlobal");
    return { summary, zones };
  } catch (err) {
    await addEngineError(`Erreur runGlobalAfricaNord : ${err.message}`, "runGlobalAfricaNord");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { AFRICA_NORD_ZONES, getAllAfricaNordZones, runGlobalAfricaNord };

