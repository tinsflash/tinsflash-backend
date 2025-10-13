// PATH: services/runGlobalAfricaCentrale.js
// 🌍 Référentiel zones Afrique Centrale – TINSFLASH PRO+++
// Couvre : Congo, RDC, Cameroun, Gabon, Centrafrique, Angola, Tchad, Guinée Équatoriale, São Tomé
// Objectif : suivi humidité, orages, précipitations, flux équatorial et intertropical
// ==========================================================

import { addEngineLog, addEngineError, updateEngineState, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js"; // ✅ ajouté pour sauvegarde Mongo
import fs from "fs";
import path from "path";

/**
 * Journalise le chargement des zones Afrique Centrale
 */
export async function logAfricaCentraleCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Afrique Centrale – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌍 ZONES DÉTAILLÉES
// ===========================
export const AFRICA_CENTRALE_ZONES = {
  Cameroon: [
    { lat: 3.87, lon: 11.52, region: "Yaoundé - Capital" },
    { lat: 4.05, lon: 9.70, region: "Douala - Coast" },
    { lat: 5.88, lon: 10.00, region: "Bafoussam - Highlands" },
    { lat: 2.93, lon: 13.27, region: "Bertoua - East Forest" },
    { lat: 10.60, lon: 14.32, region: "Maroua - North Sahel" }
  ],
  Gabon: [
    { lat: 0.39, lon: 9.45, region: "Libreville - Coast" },
    { lat: -1.57, lon: 13.18, region: "Franceville - Inland" },
    { lat: -0.72, lon: 11.00, region: "Lambaréné - River Ogooué" }
  ],
  RepublicCongo: [
    { lat: -4.27, lon: 15.27, region: "Brazzaville - Capital" },
    { lat: -0.48, lon: 15.90, region: "Owando - Central" },
    { lat: -2.93, lon: 12.72, region: "Pointe-Noire - Coast" }
  ],
  DR_Congo: [
    { lat: -4.33, lon: 15.31, region: "Kinshasa - Capital" },
    { lat: -2.51, lon: 28.86, region: "Bukavu - East Lakes" },
    { lat: 0.52, lon: 25.20, region: "Mbandaka - Equatorial Forest" },
    { lat: -11.67, lon: 27.48, region: "Lubumbashi - South" },
    { lat: -6.13, lon: 23.60, region: "Kananga - Central" },
    { lat: 2.15, lon: 22.47, region: "Kisangani - North" },
    { lat: 3.55, lon: 27.68, region: "Abba - Haut-Uele (Ville natale)" } // 🌿 Ajout spécial
  ],
  CentralAfricanRepublic: [
    { lat: 4.37, lon: 18.55, region: "Bangui - Capital" },
    { lat: 6.98, lon: 18.26, region: "Bossangoa - Central" },
    { lat: 8.41, lon: 20.65, region: "Birao - North" }
  ],
  Angola: [
    { lat: -8.83, lon: 13.24, region: "Luanda - Coast" },
    { lat: -12.37, lon: 13.53, region: "Lobito - Coast South" },
    { lat: -11.20, lon: 13.84, region: "Huambo - Highlands" },
    { lat: -14.92, lon: 13.49, region: "Namibe - Desert Coast" },
    { lat: -9.65, lon: 20.40, region: "Malanje - Interior" }
  ],
  Chad: [
    { lat: 12.13, lon: 15.06, region: "N'Djamena - Capital" },
    { lat: 13.83, lon: 20.83, region: "Abéché - East" },
    { lat: 8.62, lon: 16.06, region: "Moundou - South" },
    { lat: 14.45, lon: 15.32, region: "Ati - Central" },
    { lat: 17.93, lon: 19.11, region: "Faya-Largeau - North Desert" }
  ],
  EquatorialGuinea: [
    { lat: 3.75, lon: 8.78, region: "Malabo - Bioko Island" },
    { lat: 1.59, lon: 10.45, region: "Bata - Mainland Coast" }
  ],
  SaoTomePrincipe: [
    { lat: 0.33, lon: 6.73, region: "São Tomé - Island" },
    { lat: 1.65, lon: 7.41, region: "Príncipe - North Island" }
  ]
};

// ===========================
// ✅ Export global – zones Afrique Centrale
// ===========================
export function getAllAfricaCentraleZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_CENTRALE_ZONES)) {
    for (const z of zones) {
      all.push({
        country,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "Africa",
      });
    }
  }
  return all;
}

// ===========================================================
// 🚀 RUN OFFICIEL – Afrique Centrale (utilisé par server.js)
// ===========================================================
export async function runGlobalAfricaCentrale() {
  await addEngineLog("🌍 Démarrage du runGlobalAfricaCentrale (Afrique Centrale)", "info", "runGlobal");
  const zones = getAllAfricaCentraleZones();

  try {
    // 🔄 Création du résumé
    const summary = {
      region: "Africa Centrale",
      totalZones: zones.length,
      generatedAt: new Date().toISOString(),
      status: "ok",
    };

    // 💾 Sauvegarde locale
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "africa_centrale.json");
    fs.writeFileSync(filePath, JSON.stringify({ summary, zones }, null, 2), "utf8");

    // ☁️ Sauvegarde Mongo (réelle)
    await saveExtractionToMongo({
      id: `AF-CENT-${Date.now()}`,
      region: "Africa Centrale",
      zones: Object.keys(AFRICA_CENTRALE_ZONES),
      file: filePath,
      dataCount: zones.length,
      status: "done",
      timestamp: new Date(),
    });

    // 🧩 Mise à jour état moteur
    await setLastExtraction({
      id: `africacentrale-${Date.now()}`,
      zones: ["Africa Centrale"],
      files: [filePath],
      status: "done",
    });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Africa Centrale",
      zonesCount: zones.length,
    });

    await addEngineLog(`✅ Afrique Centrale : ${zones.length} zones traitées`, "success", "runGlobal");
    return { summary, zones };
  } catch (err) {
    await addEngineError(`Erreur runGlobalAfricaCentrale : ${err.message}`, "runGlobalAfricaCentrale");
    return { error: err.message };
  }
}

// ===========================================================
// 🧩 EXPORT FINAL – pour compatibilité globale
// ===========================================================
export default {
  AFRICA_CENTRALE_ZONES,
  getAllAfricaCentraleZones,
  runGlobalAfricaCentrale,
};
