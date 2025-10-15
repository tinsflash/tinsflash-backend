// ==========================================================
// 🇪🇺 TINSFLASH – runGlobalEurope.js (Everest Protocol v4.1 PRO+++ REAL CONNECT)
// ==========================================================
// Extraction complète – Europe 27 + UK + Scandinavie + Balkans + Méditerranée
// 100 % réel, complet et compatible Render (ESM strict)
// ==========================================================

import fs from "fs";
import path from "path";
import { superForecast } from "./superForecast.js";
import {
  addEngineLog,
  addEngineError,
  updateEngineState,
  setLastExtraction,
} from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js"; // ✅ ajouté pour la sauvegarde Mongo réelle
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
// ==========================================================
// 🧠 Fonction principale – Extraction réelle
// ==========================================================
// Zones détaillées par pays
// ===========================
export const EUROPE_ZONES = {   
  // --- Localités européennes conservées intégralement ---
      Belgique: [
        { lat: 50.85, lon: 4.35, country: "Belgium", region: "Brussels-Central" },
        { lat: 51.22, lon: 4.40, country: "Belgium", region: "North-Sea-Coast" },
        { lat: 50.47, lon: 4.87, country: "Belgium", region: "Condroz" },
        { lat: 50.25, lon: 5.57, country: "Belgium", region: "Ardennes" }
      ],

  France: [
    { lat: 48.85, lon: 2.35, region: "Île-de-France" },
    { lat: 43.6, lon: 1.44, region: "Southwest - Toulouse" },
    { lat: 45.76, lon: 4.84, region: "Central-East - Lyon" },
    { lat: 43.29, lon: 5.37, region: "Mediterranean - Provence" },
    { lat: 44.83, lon: -0.57, region: "West - Bordeaux/Atlantique" },
    { lat: 42.70, lon: 2.90, region: "Pyrénées" },
    { lat: 45.90, lon: 6.12, region: "Alpes" },
    { lat: 45.04, lon: 3.88, region: "Massif-Central" },
    { lat: 48.11, lon: -1.68, region: "Bretagne" },
    { lat: 49.50, lon: 0.10, region: "Normandie" }
  ],
  Germany: [
    { lat: 52.52, lon: 13.40, region: "Berlin - East" },
    { lat: 50.11, lon: 8.68, region: "Frankfurt - Central" },
    { lat: 48.13, lon: 11.58, region: "Munich - Bavaria" },
    { lat: 53.55, lon: 9.99, region: "Hamburg - North" },
    { lat: 51.45, lon: 7.01, region: "Ruhr - Industrial" },
    { lat: 47.57, lon: 10.70, region: "Alpes-Bavaroises" },
    { lat: 48.00, lon: 8.23, region: "Forêt-Noire" }
  ],
  Netherlands: [
    { lat: 52.37, lon: 4.90, region: "West - Amsterdam" },
    { lat: 51.92, lon: 4.48, region: "Southwest - Rotterdam" },
    { lat: 53.22, lon: 6.57, region: "North - Groningen" },
    { lat: 52.08, lon: 5.12, region: "Central - Utrecht" }
  ],
  Luxembourg: [
    { lat: 49.61, lon: 6.13, region: "Central - Luxembourg City" },
    { lat: 49.76, lon: 6.10, region: "North - Ardennes" }
  ],
  Switzerland: [
    { lat: 46.95, lon: 7.44, region: "Central - Bern" },
    { lat: 46.20, lon: 6.15, region: "West - Geneva" },
    { lat: 47.37, lon: 8.54, region: "North - Zurich" },
    { lat: 46.01, lon: 8.96, region: "South - Ticino" },
    { lat: 46.87, lon: 9.53, region: "Alpes-Grisons" }
  ],
  Austria: [
    { lat: 48.21, lon: 16.37, region: "Vienna - East" },
    { lat: 47.80, lon: 13.04, region: "Salzburg - Alps" },
    { lat: 47.07, lon: 15.44, region: "Graz - South" },
    { lat: 47.27, lon: 11.40, region: "Tyrol - Innsbruck" }
  ],
// --- Scandinavie ---
  Denmark: [
    { lat: 55.68, lon: 12.57, region: "East - Copenhagen" },
    { lat: 57.05, lon: 9.92, region: "North - Aalborg" },
    { lat: 55.40, lon: 10.39, region: "Central - Odense" }
  ],
  Norway: [
    { lat: 59.91, lon: 10.75, region: "Oslo - South" },
    { lat: 63.43, lon: 10.39, region: "Trondheim - Central" },
    { lat: 69.65, lon: 18.95, region: "Tromsø - North" },
    { lat: 67.28, lon: 14.40, region: "Lofoten Islands" }
  ],
  Sweden: [
    { lat: 59.33, lon: 18.06, region: "Stockholm - South" },
    { lat: 57.71, lon: 11.97, region: "Gothenburg - West Coast" },
    { lat: 63.83, lon: 20.25, region: "Umeå - North" },
    { lat: 67.85, lon: 20.23, region: "Kiruna - Arctic" }
  ],
  Finland: [
    { lat: 60.17, lon: 24.94, region: "Helsinki - South" },
    { lat: 62.24, lon: 25.75, region: "Jyväskylä - Central" },
    { lat: 65.01, lon: 25.47, region: "Oulu - North" },
    { lat: 66.50, lon: 25.72, region: "Lapland - Rovaniemi" }
  ],
  Iceland: [
    { lat: 64.13, lon: -21.90, region: "Southwest - Reykjavik" },
    { lat: 65.68, lon: -18.10, region: "North - Akureyri" }
  ],

  // --- Europe Centrale & Est ---
  Poland: [
    { lat: 52.23, lon: 21.01, region: "Central - Warsaw" },
    { lat: 50.06, lon: 19.94, region: "South - Krakow" },
    { lat: 51.11, lon: 17.03, region: "West - Wroclaw" },
    { lat: 54.35, lon: 18.64, region: "North - Gdansk" },
    { lat: 49.30, lon: 19.95, region: "Tatras - Zakopane" }
  ],
  Czechia: [
    { lat: 50.08, lon: 14.43, region: "Central - Prague" },
    { lat: 49.20, lon: 16.61, region: "South - Brno" },
    { lat: 50.08, lon: 17.40, region: "East - Ostrava" }
  ],
  Slovakia: [
    { lat: 48.15, lon: 17.11, region: "West - Bratislava" },
    { lat: 49.08, lon: 19.61, region: "North - Tatras - Žilina" },
    { lat: 48.73, lon: 21.25, region: "East - Košice" }
  ],
  Hungary: [
    { lat: 47.50, lon: 19.04, region: "Central - Budapest" },
    { lat: 46.07, lon: 18.23, region: "South - Pécs" },
    { lat: 47.53, lon: 21.63, region: "East - Debrecen" }
  ],
  Romania: [
    { lat: 44.43, lon: 26.10, region: "South - Bucharest" },
    { lat: 46.77, lon: 23.59, region: "Northwest - Cluj-Napoca" },
    { lat: 45.76, lon: 21.23, region: "West - Timișoara" },
    { lat: 47.16, lon: 27.58, region: "East - Iași" },
    { lat: 45.52, lon: 25.58, region: "Central - Carpathians - Brașov" },
    { lat: 44.16, lon: 28.64, region: "Southeast - Constanța (Black Sea)" }
  ],
  Moldova: [
    { lat: 47.01, lon: 28.86, region: "Central - Chișinău" },
    { lat: 46.83, lon: 29.64, region: "South - Tighina" }
  ],
  Ukraine: [
    { lat: 50.45, lon: 30.52, region: "Kyiv - Central" },
    { lat: 48.62, lon: 22.30, region: "West - Uzhhorod" },
    { lat: 46.48, lon: 30.73, region: "South - Odessa" },
    { lat: 49.99, lon: 36.23, region: "East - Kharkiv" },
    { lat: 47.90, lon: 33.38, region: "Dnipropetrovsk" },
    { lat: 47.10, lon: 37.55, region: "Donbass - Mariupol" }
  ],

  // --- Pays Baltes ---
  Estonia: [
    { lat: 59.44, lon: 24.75, region: "North - Tallinn" },
    { lat: 58.38, lon: 26.73, region: "South - Tartu" },
    { lat: 58.25, lon: 22.48, region: "West - Saaremaa Island" }
  ],
  Latvia: [
    { lat: 56.95, lon: 24.10, region: "Central - Riga" },
    { lat: 56.51, lon: 21.01, region: "West - Liepāja" },
    { lat: 55.88, lon: 26.52, region: "East - Daugavpils" }
  ],
  Lithuania: [
    { lat: 54.68, lon: 25.28, region: "Central - Vilnius" },
    { lat: 55.70, lon: 21.14, region: "West - Klaipėda (Baltic Sea)" },
    { lat: 54.90, lon: 23.89, region: "South - Kaunas" }
  ],
  // --- Péninsule Ibérique ---
  Spain: [
    { lat: 40.41, lon: -3.70, region: "Madrid - Central Meseta" },
    { lat: 41.38, lon: 2.17, region: "Barcelona - Catalonia" },
    { lat: 36.72, lon: -4.42, region: "Andalusia - Malaga" },
    { lat: 43.26, lon: -2.93, region: "North - Basque Country" },
    { lat: 42.81, lon: -1.65, region: "Pyrenees" },
    { lat: 39.57, lon: 2.65, region: "Balearic Islands" },
    { lat: 28.12, lon: -15.43, region: "Canary Islands" }
  ],
  Portugal: [
    { lat: 38.72, lon: -9.13, region: "Lisbon - West" },
    { lat: 41.15, lon: -8.61, region: "North - Porto" },
    { lat: 37.01, lon: -7.93, region: "South - Algarve" },
    { lat: 32.65, lon: -16.91, region: "Madeira" },
    { lat: 37.74, lon: -25.67, region: "Azores" }
  ],

  // --- Italie & Méditerranée ---
  Italy: [
    { lat: 45.46, lon: 9.19, region: "North - Milan" },
    { lat: 41.90, lon: 12.50, region: "Central - Rome" },
    { lat: 40.85, lon: 14.27, region: "South - Naples" },
    { lat: 44.49, lon: 11.34, region: "North-East - Bologna" },
    { lat: 43.71, lon: 10.40, region: "Tuscany - Florence" },
    { lat: 46.50, lon: 11.35, region: "Dolomites" },
    { lat: 37.60, lon: 14.02, region: "Sicily - Etna" },
    { lat: 40.12, lon: 9.01, region: "Sardinia" }
  ],
  Malta: [
    { lat: 35.90, lon: 14.51, region: "Malta - Valletta" },
    { lat: 36.04, lon: 14.24, region: "Gozo Island" }
  ],
  Greece: [
    { lat: 37.98, lon: 23.72, region: "Central - Athens" },
    { lat: 40.64, lon: 22.94, region: "North - Thessaloniki" },
    { lat: 35.34, lon: 25.13, region: "South - Crete - Heraklion" },
    { lat: 39.62, lon: 19.92, region: "Ionian Islands - Corfu" },
    { lat: 36.44, lon: 28.23, region: "Dodecanese - Rhodes" }
  ],
  Cyprus: [
    { lat: 35.17, lon: 33.36, region: "Central - Nicosia" },
    { lat: 34.68, lon: 33.04, region: "South - Limassol" },
    { lat: 34.77, lon: 32.42, region: "West - Paphos" }
  ],

  // --- Balkans ---
  Croatia: [
    { lat: 45.81, lon: 15.98, region: "Inland - Zagreb" },
    { lat: 43.51, lon: 16.44, region: "Dalmatian Coast - Split" },
    { lat: 42.65, lon: 18.09, region: "South Coast - Dubrovnik" },
    { lat: 46.16, lon: 16.83, region: "North - Varaždin" }
  ],
  Slovenia: [
    { lat: 46.06, lon: 14.51, region: "Central - Ljubljana" },
    { lat: 46.55, lon: 15.65, region: "East - Maribor" },
    { lat: 46.38, lon: 13.82, region: "West - Julian Alps" }
  ],
  BosniaHerzegovina: [
    { lat: 43.85, lon: 18.41, region: "Central - Sarajevo" },
    { lat: 44.77, lon: 17.19, region: "North - Banja Luka" },
    { lat: 43.26, lon: 17.68, region: "South - Mostar" }
  ],
  Serbia: [
    { lat: 44.82, lon: 20.45, region: "Central - Belgrade" },
    { lat: 43.32, lon: 21.90, region: "South - Niš" },
    { lat: 45.26, lon: 19.83, region: "North - Novi Sad" }
  ],
  Montenegro: [
    { lat: 42.44, lon: 19.26, region: "Coast - Bar" },
    { lat: 42.78, lon: 19.48, region: "North - Podgorica" }
  ],
  Kosovo: [
    { lat: 42.66, lon: 21.16, region: "Central - Pristina" },
    { lat: 42.87, lon: 20.87, region: "West - Peja" }
  ],
  NorthMacedonia: [
    { lat: 41.99, lon: 21.43, region: "Central - Skopje" },
    { lat: 41.12, lon: 20.80, region: "Southwest - Ohrid" }
  ],
  Albania: [
    { lat: 41.33, lon: 19.82, region: "Central - Tirana" },
    { lat: 40.73, lon: 19.57, region: "South - Vlore" },
    { lat: 42.07, lon: 19.52, region: "North - Shkodër" }
  ],
  // --- Iles Britanniques ---
  UnitedKingdom: [
    { lat: 51.50, lon: -0.12, region: "South - London" },
    { lat: 55.95, lon: -3.18, region: "North - Edinburgh" },
    { lat: 53.48, lon: -2.24, region: "West - Manchester" },
    { lat: 51.48, lon: -3.18, region: "Wales - Cardiff" },
    { lat: 54.60, lon: -5.93, region: "Northern Ireland - Belfast" }
  ],
  Ireland: [
    { lat: 53.34, lon: -6.26, region: "East - Dublin" },
    { lat: 52.66, lon: -8.62, region: "West - Limerick" },
    { lat: 51.90, lon: -8.47, region: "South - Cork" }
  ]
};

// ==========================================================
// 🧠 FONCTION PRINCIPALE
// ==========================================================
export async function runGlobalEurope() {
  try {
    await addEngineLog("🇪🇺 Démarrage runGlobalEurope", "info", "runGlobalEurope");

    // Fusion de toutes les zones
    const zones = Object.values(EUROPE_ZONES).flat();

    const result = await superForecast({
      zones,
      runType: "Europe",
      withAI: false,
    });

    // ======================================================
    // 💾 Sauvegarde locale
    // ======================================================
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "europe.json");
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), "utf8");

    // ======================================================
    // ☁️ Sauvegarde MongoDB (réelle)
    // ======================================================
    await saveExtractionToMongo({
      id: `EU-${Date.now()}`,
      region: "Europe",
      zones: Object.keys(EUROPE_ZONES),
      file: filePath,
      dataCount: zones.length,
      status: "done",
      timestamp: new Date(),
    });

    // ======================================================
    // 🧩 Mise à jour état moteur
    // ======================================================
    await setLastExtraction({
      id: `europe-${Date.now()}`,
      zones: ["Europe"],
      files: [filePath],
      status: "done",
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Europe",
      zonesCount: zones.length,
    });

    await addEngineLog(
      `✅ runGlobalEurope terminé (${zones.length} zones)`,
      "success",
      "runGlobalEurope"
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
    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobalEurope : ${err.message}`, "runGlobalEurope");
    return { error: err.message };
  }
}

export default { runGlobalEurope };

  
