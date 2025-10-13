// PATH: services/runGlobalAfricaOuest.js
// 🌍 Référentiel zones Afrique de l’Ouest – TINSFLASH PRO+++
// Couvre : Sénégal, Mali, Côte d’Ivoire, Ghana, Nigeria, Niger, Burkina Faso, Guinée
// Objectif : suivi ITCZ, pluies tropicales, houles atlantiques
// ==========================================================

import { addEngineLog, addEngineError, updateEngineState, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js"; // ✅ ajout Mongo
import fs from "fs";
import path from "path";

export const AFRICA_OUEST_ZONES = {
  Senegal: [
    { lat: 14.69, lon: -17.45, region: "Dakar - Capital" },
    { lat: 14.77, lon: -16.93, region: "Thiès - West" },
    { lat: 13.31, lon: -14.22, region: "Tambacounda - East" },
  ],
  Mali: [
    { lat: 12.65, lon: -8.00, region: "Bamako - Capital" },
    { lat: 14.43, lon: -11.43, region: "Kayes - West" },
    { lat: 16.77, lon: -3.00, region: "Gao - North Sahara Edge" },
  ],
  "Côte d’Ivoire": [
    { lat: 5.35, lon: -4.00, region: "Abidjan - Coast" },
    { lat: 7.68, lon: -5.03, region: "Yamoussoukro - Central" },
    { lat: 9.52, lon: -7.56, region: "Korhogo - North" },
  ],
  Ghana: [
    { lat: 5.55, lon: -0.20, region: "Accra - Capital" },
    { lat: 6.69, lon: -1.62, region: "Kumasi - Forest" },
    { lat: 9.40, lon: -0.84, region: "Tamale - North" },
  ],
  Nigeria: [
    { lat: 9.05, lon: 7.49, region: "Abuja - Capital" },
    { lat: 6.46, lon: 3.40, region: "Lagos - Coast" },
    { lat: 10.52, lon: 7.44, region: "Kaduna - North" },
  ],
  Niger: [
    { lat: 13.52, lon: 2.10, region: "Niamey - Capital" },
    { lat: 14.26, lon: 0.44, region: "Dosso - South" },
    { lat: 18.73, lon: 7.38, region: "Agadez - Sahara" },
  ],
  "Burkina Faso": [
    { lat: 12.36, lon: -1.53, region: "Ouagadougou - Capital" },
    { lat: 11.18, lon: -4.29, region: "Bobo-Dioulasso - South" },
  ],
  Guinea: [
    { lat: 9.52, lon: -13.70, region: "Conakry - Coast" },
    { lat: 10.75, lon: -12.00, region: "Kankan - East" },
  ],
};

// ==========================================================
export function getAllAfricaOuestZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_OUEST_ZONES)) {
    for (const z of zones) {
      all.push({ country, region: z.region, lat: z.lat, lon: z.lon, continent: "Africa" });
    }
  }
  return all;
}

// ==========================================================
// 🚀 RUN OFFICIEL – Afrique de l’Ouest
// ==========================================================
export async function runGlobalAfricaOuest() {
  await addEngineLog("🌍 Démarrage runGlobalAfricaOuest (Afrique de l’Ouest)", "info", "runGlobal");
  const zones = getAllAfricaOuestZones();

  try {
    // 🔄 Résumé
    const summary = {
      region: "Africa Ouest",
      totalZones: zones.length,
      generatedAt: new Date().toISOString(),
      status: "ok",
    };

    // 💾 Sauvegarde locale
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "africa_ouest.json");
    fs.writeFileSync(filePath, JSON.stringify({ summary, zones }, null, 2), "utf8");

    // ☁️ Sauvegarde Mongo (réelle)
    await saveExtractionToMongo({
      id: `AF-OUEST-${Date.now()}`,
      region: "Africa Ouest",
      zones: Object.keys(AFRICA_OUEST_ZONES),
      file: filePath,
      dataCount: zones.length,
      status: "done",
      timestamp: new Date(),
    });

    // ⚙️ Mise à jour moteur
    await setLastExtraction({
      id: `africaouest-${Date.now()}`,
      zones: ["Africa Ouest"],
      files: [filePath],
      status: "done",
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Africa Ouest",
      zonesCount: zones.length,
    });

    await addEngineLog(`✅ Afrique de l’Ouest : ${zones.length} zones traitées`, "success", "runGlobal");
    return { summary, zones };
  } catch (err) {
    await addEngineError(`Erreur runGlobalAfricaOuest : ${err.message}`, "runGlobalAfricaOuest");
    return { error: err.message };
  }
}

// ==========================================================
// 🧩 EXPORT FINAL
// ==========================================================
export default { AFRICA_OUEST_ZONES, getAllAfricaOuestZones, runGlobalAfricaOuest };
