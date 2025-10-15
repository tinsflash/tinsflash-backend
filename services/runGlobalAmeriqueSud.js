// ==========================================================
// 🌎 TINSFLASH – runGlobalAmeriqueSud.js
// Everest Protocol v5.2.1 PRO+++ (HydroRisk + Volcanic + Extended Amazon)
// ==========================================================
// Couverture : Brésil, Argentine, Chili, Pérou, Colombie, Bolivie,
// Paraguay, Uruguay, Venezuela, Équateur
// Objectif : suivi tropical, andin, volcanique et hydrique — base IA J.E.A.N.
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";
// ----------------------------------------------------------
// 🛰️ VisionIA – capture et analyse satellite automatique
// ----------------------------------------------------------
import { runVisionIA } from "./runVisionIA.js";
// ==========================================================
// 🗺️ ZONES – Amérique du Sud (HydroRisk + Volcans + Climat tropical étendu)
// ==========================================================
export const AMERICA_SUD_ZONES = {
  Brazil: [
    { lat: -15.78, lon: -47.93, region: "Brasília - Central Plateau" },
    { lat: -23.55, lon: -46.63, region: "São Paulo - South East" },
    { lat: -22.90, lon: -43.20, region: "Rio de Janeiro - Coast" },
    { lat: -12.97, lon: -38.50, region: "Salvador - North East Coast" },
    { lat: -3.12, lon: -60.02, region: "Manaus - Amazon Basin" },
    { lat: -1.45, lon: -48.50, region: "Belém - Amazon Delta" },
    { lat: -8.05, lon: -34.90, region: "Recife - Atlantic Coast" },
    { lat: -2.92, lon: -44.24, region: "São Luís - Maranhão" },
    { lat: -9.66, lon: -35.71, region: "Maceió - Tropical Coast" },
  ],
  Argentina: [
    { lat: -34.61, lon: -58.38, region: "Buenos Aires - Capital" },
    { lat: -31.42, lon: -64.19, region: "Córdoba - Interior" },
    { lat: -32.89, lon: -68.84, region: "Mendoza - Andes Foothills" },
    { lat: -38.00, lon: -57.56, region: "Mar del Plata - Coast" },
    { lat: -51.62, lon: -69.22, region: "Río Gallegos - Patagonia South" },
    { lat: -54.80, lon: -68.30, region: "Ushuaia - Tierra del Fuego" },
  ],
  Chile: [
    { lat: -33.46, lon: -70.65, region: "Santiago - Central Valley" },
    { lat: -23.65, lon: -70.40, region: "Antofagasta - Desert Coast" },
    { lat: -41.47, lon: -72.94, region: "Puerto Montt - Lakes Region" },
    { lat: -53.16, lon: -70.90, region: "Punta Arenas - Extreme South" },
    // 🌋 Zones volcaniques
    { lat: -38.69, lon: -71.53, region: "Volcan Villarrica - Active" },
    { lat: -39.35, lon: -71.73, region: "Volcan Osorno - Active" },
    { lat: -37.85, lon: -71.20, region: "Volcan Llaima - Andes" },
  ],
  Peru: [
    { lat: -12.05, lon: -77.05, region: "Lima - Pacific Coast" },
    { lat: -13.52, lon: -71.97, region: "Cusco - Andes" },
    { lat: -16.40, lon: -71.53, region: "Arequipa - South Highlands" },
    { lat: -5.19, lon: -80.63, region: "Piura - North Coast" },
    { lat: -6.03, lon: -76.97, region: "Tarapoto - Amazon North" },
    // 🌋 Volcans majeurs Pérou
    { lat: -16.35, lon: -71.54, region: "Volcan Misti - Active" },
    { lat: -15.78, lon: -71.87, region: "Volcan Sabancaya - Eruptive Zone" },
  ],
  Colombia: [
    { lat: 4.71, lon: -74.07, region: "Bogotá - Highlands" },
    { lat: 6.25, lon: -75.56, region: "Medellín - Valley" },
    { lat: 3.45, lon: -76.53, region: "Cali - South West" },
    { lat: 10.40, lon: -75.50, region: "Cartagena - Caribbean Coast" },
    // 🌋 Volcans
    { lat: 1.22, lon: -77.36, region: "Volcan Galeras - Active" },
    { lat: 4.89, lon: -75.32, region: "Nevado del Ruiz - Active" },
  ],
  Bolivia: [
    { lat: -16.50, lon: -68.12, region: "La Paz - Highlands" },
    { lat: -17.78, lon: -63.18, region: "Santa Cruz - Plains" },
    { lat: -19.58, lon: -65.75, region: "Sucre - South" },
    { lat: -21.52, lon: -67.63, region: "Salar de Uyuni - Altiplano" },
  ],
  Paraguay: [
    { lat: -25.29, lon: -57.65, region: "Asunción - Capital" },
    { lat: -24.18, lon: -57.08, region: "San Pedro - Interior" },
    { lat: -22.54, lon: -55.73, region: "Pedro Juan Caballero - North" },
    { lat: -26.87, lon: -58.30, region: "Pilar - South River" },
  ],
  Uruguay: [
    { lat: -34.90, lon: -56.19, region: "Montevideo - Capital" },
    { lat: -33.26, lon: -54.38, region: "Treinta y Tres - Inland" },
    { lat: -34.47, lon: -57.84, region: "Colonia - Coast" },
    { lat: -34.47, lon: -54.33, region: "Punta del Este - Coast" },
  ],
  Venezuela: [
    { lat: 10.50, lon: -66.91, region: "Caracas - Capital" },
    { lat: 8.62, lon: -71.14, region: "Mérida - Andes" },
    { lat: 10.20, lon: -64.63, region: "Cumaná - Coast" },
    { lat: 8.59, lon: -70.35, region: "Barinas - Llanos" },
  ],
  Ecuador: [
    { lat: -0.18, lon: -78.47, region: "Quito - Andes" },
    { lat: -2.17, lon: -79.92, region: "Guayaquil - Coast" },
    { lat: -0.96, lon: -80.73, region: "Manta - Pacific Coast" },
    // 🌋 Volcans équatoriens
    { lat: -0.68, lon: -78.44, region: "Volcan Cotopaxi - Active" },
    { lat: -1.47, lon: -78.44, region: "Volcan Tungurahua - Active" },
    { lat: 0.02, lon: -77.99, region: "Volcan Cayambe - North Andes" },
    { lat: -0.90, lon: -89.60, region: "Galápagos - Islands" },
  ],
};

// ==========================================================
// ✅ Extraction réelle Amérique du Sud – Phase 1
// ==========================================================
export async function runGlobalAmeriqueSud() {
  try {
    await addEngineLog("🌎 Démarrage extraction Amérique du Sud (HydroRisk+Volcans+Amazon)", "info", "runGlobalAmeriqueSud");

    const zones = [];
    for (const [country, subzones] of Object.entries(AMERICA_SUD_ZONES)) {
      for (const z of subzones) {
        zones.push({
          sourceRun: "runGlobalAmeriqueSud",
          zoneId: `${country}-${z.region}`,
          country,
          ...z,
          continent: "America",
          timestampRun: new Date().toISOString(),
        });
      }
    }

    const result = await superForecast({ zones, runType: "AmériqueSud" });
    const timestamp = new Date().toISOString();

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, `america_sud_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

    await saveExtractionToMongo({
      zone: "Amérique du Sud",
      data: result,
      filePath: outFile,
      timestamp,
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "AmériqueSud",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ Amérique du Sud : ${zones.length} zones traitées (HydroRisk+Volcans+Amazon, Mongo + ${path.basename(outFile)})`,
      "success",
      "runGlobalAmeriqueSud"
    );
// ==========================================================
// 🛰️ PHASE 1B – VISION IA (SATELLITES IR / VISIBLE / RADAR)
// ==========================================================
try {
  const vision = await runVisionIA("Europe");
  if (vision?.confidence >= 50) {
    await addEngineLog(
      `🌍 VisionIA (${vision.zone}) active – ${vision.type} (${vision.confidence} %)`,
      "info",
      "vision"
    );
  } else {
    await addEngineLog(
      `🌫️ VisionIA (${vision.zone}) inerte – fiabilité ${vision.confidence} %`,
      "warn",
      "vision"
    );
  }
} catch (e) {
  await addEngineError("Erreur exécution VisionIA : " + e.message, "vision");
}
    return { summary: { region: "Amérique du Sud", totalZones: zones.length, file: outFile, status: "ok" }, zones };
  } catch (err) {
    await addEngineError(`💥 Erreur runGlobalAmeriqueSud : ${err.message}`, "runGlobalAmeriqueSud");
    return { error: err.message };
  }
}

export default { AMERICA_SUD_ZONES, runGlobalAmeriqueSud };
export { runGlobalAmeriqueSud as runAmeriqueSud };
