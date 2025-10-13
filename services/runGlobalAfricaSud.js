// PATH: services/runGlobalAfricaSud.js
// 🌍 Référentiel zones Afrique Australe – TINSFLASH PRO+++
// Couvre : Afrique du Sud, Namibie, Botswana, Zimbabwe, Mozambique, Madagascar
// Objectif : suivi vents australs, anticyclones, houles de l’océan Indien
// ==========================================================

import { addEngineLog, addEngineError, updateEngineState, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js"; // ✅ ajout Mongo
import fs from "fs";
import path from "path";

export const AFRICA_SUD_ZONES = {
  "South Africa": [
    { lat: -25.74, lon: 28.19, region: "Pretoria - Capital" },
    { lat: -33.92, lon: 18.42, region: "Cape Town - South Coast" },
    { lat: -29.86, lon: 31.03, region: "Durban - East Coast" },
    { lat: -26.20, lon: 28.04, region: "Johannesburg - Highveld" },
  ],
  Namibia: [
    { lat: -22.56, lon: 17.08, region: "Windhoek - Capital" },
    { lat: -23.33, lon: 15.00, region: "Walvis Bay - Coast" },
    { lat: -20.46, lon: 16.65, region: "Otjiwarongo - Interior" },
  ],
  Botswana: [
    { lat: -24.65, lon: 25.91, region: "Gaborone - Capital" },
    { lat: -19.99, lon: 23.42, region: "Maun - Delta Okavango" },
    { lat: -21.17, lon: 27.51, region: "Francistown - North" },
  ],
  Zimbabwe: [
    { lat: -17.83, lon: 31.05, region: "Harare - Capital" },
    { lat: -20.17, lon: 28.58, region: "Bulawayo - South" },
  ],
  Mozambique: [
    { lat: -25.96, lon: 32.57, region: "Maputo - Capital" },
    { lat: -19.83, lon: 34.86, region: "Beira - Central Coast" },
    { lat: -15.11, lon: 39.26, region: "Pemba - North Coast" },
  ],
  Madagascar: [
    { lat: -18.93, lon: 47.52, region: "Antananarivo - Capital" },
    { lat: -20.29, lon: 44.31, region: "Morondava - West Coast" },
    { lat: -21.45, lon: 48.33, region: "Tôlanaro - South Coast" },
  ],
};

export function getAllAfricaSudZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_SUD_ZONES)) {
    for (const z of zones) {
      all.push({ country, region: z.region, lat: z.lat, lon: z.lon, continent: "Africa" });
    }
  }
  return all;
}

// ==========================================================
// 🚀 RUN OFFICIEL – Afrique Australe
// ==========================================================
export async function runGlobalAfricaSud() {
  await addEngineLog("🌍 Démarrage runGlobalAfricaSud (Afrique Australe)", "info", "runGlobal");
  const zones = getAllAfricaSudZones();

  try {
    // 🔄 Résumé
    const summary = {
      region: "Africa Sud",
      totalZones: zones.length,
      generatedAt: new Date().toISOString(),
      status: "ok",
    };

    // 💾 Sauvegarde locale
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "africa_sud.json");
    fs.writeFileSync(filePath, JSON.stringify({ summary, zones }, null, 2), "utf8");

    // ☁️ Sauvegarde Mongo réelle
    await saveExtractionToMongo({
      id: `AF-SUD-${Date.now()}`,
      region: "Africa Sud",
      zones: Object.keys(AFRICA_SUD_ZONES),
      file: filePath,
      dataCount: zones.length,
      status: "done",
      timestamp: new Date(),
    });

    // ⚙️ Mise à jour moteur
    await setLastExtraction({
      id: `africasud-${Date.now()}`,
      zones: ["Africa Sud"],
      files: [filePath],
      status: "done",
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Africa Sud",
      zonesCount: zones.length,
    });

    await addEngineLog(`✅ Afrique Australe : ${zones.length} zones traitées`, "success", "runGlobal");
    return { summary, zones };
  } catch (err) {
    await addEngineError(`Erreur runGlobalAfricaSud : ${err.message}`, "runGlobalAfricaSud");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { AFRICA_SUD_ZONES, getAllAfricaSudZones, runGlobalAfricaSud };
