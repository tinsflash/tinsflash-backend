// ==========================================================
// 🌏 TINSFLASH – runGlobalAsiaEst.js
// Everest Protocol v4.1 PRO+++ (HydroRisk + Volcanic + Typhoon zones ready)
// ==========================================================
// Couvre : Chine, Japon, Corées, Mongolie, Taïwan, Hong Kong, Macao
// Objectif : suivi typhons, moussons, relief himalayen, activité volcanique
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";

// ==========================================================
// 🗺️ ZONES – Asie de l’Est (avec volcans & typhons)
// ==========================================================
export const ASIA_EST_ZONES = {
  China: [
    { lat: 39.90, lon: 116.40, region: "Beijing - Capitale Nord" },
    { lat: 31.23, lon: 121.47, region: "Shanghai - Côte Est" },
    { lat: 23.13, lon: 113.26, region: "Guangzhou - Sud-Est" },
    { lat: 22.32, lon: 114.17, region: "Hong Kong - Delta Rivière des Perles" },
    { lat: 29.56, lon: 106.55, region: "Chongqing - Centre-Sud" },
    { lat: 30.66, lon: 104.07, region: "Chengdu - Plateau Sichuan" },
    { lat: 41.80, lon: 123.41, region: "Shenyang - Nord-Est" },
    { lat: 34.34, lon: 108.93, region: "Xi’an - Centre Historique" },
    { lat: 25.04, lon: 102.72, region: "Kunming - Yunnan" },
    { lat: 29.65, lon: 91.13, region: "Lhassa - Tibet Himalaya" },
    // 🌋 Volcans chinois majeurs
    { lat: 42.01, lon: 128.06, region: "Mont Paektu/Changbai - Volcan actif" },
  ],
  Japan: [
    { lat: 35.68, lon: 139.69, region: "Tokyo - Capitale" },
    { lat: 34.69, lon: 135.50, region: "Osaka - Centre industriel" },
    { lat: 35.02, lon: 135.75, region: "Kyoto - Vallée Kansai" },
    { lat: 43.06, lon: 141.35, region: "Sapporo - Hokkaido Nord" },
    { lat: 33.59, lon: 130.40, region: "Fukuoka - Kyushu Sud" },
    { lat: 26.21, lon: 127.68, region: "Naha - Okinawa - Zone Typhon" },
    // 🌋 Volcans japonais
    { lat: 35.36, lon: 138.73, region: "Mont Fuji - Actif" },
    { lat: 31.59, lon: 130.65, region: "Sakurajima - Volcan actif" },
    { lat: 37.75, lon: 140.45, region: "Bandai - Volcan Nord Honshu" },
  ],
  SouthKorea: [
    { lat: 37.57, lon: 126.98, region: "Séoul - Capitale" },
    { lat: 35.16, lon: 129.06, region: "Busan - Côte Sud" },
    { lat: 33.50, lon: 126.53, region: "Jeju - Île volcanique" },
  ],
  NorthKorea: [
    { lat: 39.03, lon: 125.75, region: "Pyongyang - Capitale" },
    { lat: 41.10, lon: 128.20, region: "Paektu - Zone volcanique commune" },
  ],
  Mongolia: [
    { lat: 47.92, lon: 106.91, region: "Oulan-Bator - Plateau Central" },
    { lat: 44.89, lon: 110.12, region: "Sainshand - Désert de Gobi" },
    { lat: 48.01, lon: 91.64, region: "Khovd - Montagnes Ouest" },
  ],
  Taiwan: [
    { lat: 25.03, lon: 121.56, region: "Taipei - Nord" },
    { lat: 24.15, lon: 120.67, region: "Taichung - Centre" },
    { lat: 22.63, lon: 120.30, region: "Kaohsiung - Sud" },
    { lat: 23.48, lon: 120.45, region: "Alishan - Montagnes" },
    // 🌋 Zone sismique Taïwan
    { lat: 24.45, lon: 121.80, region: "Hualien - Faille côtière" },
  ],
  HongKong: [{ lat: 22.32, lon: 114.17, region: "Hong Kong - Îles Sud-Est" }],
  Macau: [{ lat: 22.19, lon: 113.54, region: "Macao - Péninsule Sud" }],
};

// ==========================================================
// 🧠 Extraction réelle – Asie de l’Est (Phase 1)
// ==========================================================
export async function runGlobalAsiaEst() {
  try {
    await addEngineLog("🌏 Démarrage extraction Asie de l’Est (HydroRisk+Volcans)", "info", "runGlobalAsiaEst");

    const zones = [];
    for (const [country, subzones] of Object.entries(ASIA_EST_ZONES)) {
      for (const z of subzones) zones.push({ country, ...z, continent: "Asia" });
    }

    if (!zones.length) {
      await addEngineError("Aucune zone Asie de l'Est trouvée", "runGlobalAsiaEst");
      return { status: "fail", message: "Aucune zone trouvée" };
    }

    // --- Extraction réelle via superForecast ---
    const result = await superForecast({ zones, runType: "AsieEst" });
    const timestamp = new Date().toISOString();

    // --- Sauvegarde locale + Mongo ---
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `asia_est_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Asie de l’Est",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "AsieEst",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ Asie de l’Est : ${zones.length} zones traitées (HydroRisk+Volcans, Mongo + ${path.basename(outFile)})`,
      "success",
      "runGlobalAsiaEst"
    );

    return { summary: { region: "Asie de l’Est", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalAsiaEst : ${err.message}`, "runGlobalAsiaEst");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { ASIA_EST_ZONES, runGlobalAsiaEst };
export { runGlobalAsiaEst as runAsiaEst };
