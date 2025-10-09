// PATH: services/runGlobalCanada.js
// 🇨🇦 Référentiel zones Canada – TINSFLASH PRO+++
// Ce fichier ne contient QUE les coordonnées géographiques de référence
// Il est lu par zonesCovered.js puis runGlobal.js
// ==========================================================
// 🔧 Version PRO+++ compatible moteur multi-zones (Everest Protocol v2.8)
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement de la couverture canadienne
 * (provinces, territoires et zones arctiques incluses)
 */
export async function logCanadaCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Canada – 10 provinces + 3 territoires validés",
    "info",
    "zonesCovered"
  );
}

// ===========================
// Zones détaillées par Province / Territoire
// ===========================
export const CANADA_ZONES = {
  // --- CÔTE PACIFIQUE ---
  BritishColumbia: [
    { lat: 49.28, lon: -123.12, region: "Vancouver - Pacific Coast" },
    { lat: 48.43, lon: -123.36, region: "Victoria - Vancouver Island" },
    { lat: 50.12, lon: -122.95, region: "Whistler - Coastal Mountains" },
    { lat: 53.91, lon: -122.75, region: "Prince George - Central BC" },
    { lat: 58.81, lon: -122.69, region: "Fort St. John - North BC" }
  ],

  // --- PRAIRIES DE L'OUEST ---
  Alberta: [
    { lat: 51.05, lon: -114.07, region: "Calgary - Foothills" },
    { lat: 53.55, lon: -113.49, region: "Edmonton - Central Plains" },
    { lat: 52.27, lon: -113.81, region: "Red Deer - Central" },
    { lat: 56.73, lon: -111.38, region: "Fort McMurray - Oil Sands" },
    { lat: 50.70, lon: -113.97, region: "Lethbridge - South Prairies" },
    { lat: 51.42, lon: -116.18, region: "Banff - Rocky Mountains" }
  ],

  Saskatchewan: [
    { lat: 52.13, lon: -106.67, region: "Saskatoon - Central" },
    { lat: 50.45, lon: -104.61, region: "Regina - Capital" },
    { lat: 53.20, lon: -105.75, region: "Prince Albert - Boreal" },
    { lat: 55.10, lon: -105.28, region: "La Ronge - Northern Forests" }
  ],

  Manitoba: [
    { lat: 49.89, lon: -97.14, region: "Winnipeg - South Central" },
    { lat: 50.56, lon: -96.98, region: "Selkirk - Red River" },
    { lat: 53.83, lon: -94.85, region: "The Pas - North" },
    { lat: 58.77, lon: -94.16, region: "Churchill - Hudson Bay Coast" }
  ],

  // --- ONTARIO ET GRANDS LACS ---
  Ontario: [
    { lat: 43.65, lon: -79.38, region: "Toronto - Great Lakes" },
    { lat: 45.42, lon: -75.69, region: "Ottawa - Capital" },
    { lat: 46.49, lon: -81.01, region: "Sudbury - Northern Shield" },
    { lat: 48.38, lon: -89.25, region: "Thunder Bay - Superior Coast" },
    { lat: 42.31, lon: -83.03, region: "Windsor - Detroit Border" }
  ],

  Quebec: [
    { lat: 45.50, lon: -73.56, region: "Montréal - South" },
    { lat: 46.82, lon: -71.22, region: "Québec City - Capital" },
    { lat: 48.43, lon: -71.06, region: "Saguenay - North Fjords" },
    { lat: 49.91, lon: -66.33, region: "Rimouski - Bas-Saint-Laurent" },
    { lat: 53.00, lon: -70.00, region: "Sept-Îles - Côte-Nord" },
    { lat: 55.28, lon: -77.75, region: "Kuujjuarapik - Nunavik" }
  ],

  // --- PROVINCES ATLANTIQUES ---
  NewBrunswick: [
    { lat: 45.96, lon: -66.64, region: "Fredericton - Capital" },
    { lat: 46.09, lon: -64.78, region: "Moncton - East Coast" },
    { lat: 47.00, lon: -65.45, region: "Bathurst - North Bay" }
  ],

  NovaScotia: [
    { lat: 44.65, lon: -63.57, region: "Halifax - Capital" },
    { lat: 45.36, lon: -61.33, region: "Antigonish - North-East" },
    { lat: 46.15, lon: -60.18, region: "Sydney - Cape Breton" },
    { lat: 43.75, lon: -65.32, region: "Yarmouth - South Coast" }
  ],

  PrinceEdwardIsland: [
    { lat: 46.23, lon: -63.13, region: "Charlottetown - Capital" },
    { lat: 46.40, lon: -63.78, region: "Summerside - West" }
  ],

  NewfoundlandLabrador: [
    { lat: 47.56, lon: -52.71, region: "St. John's - East Coast" },
    { lat: 48.95, lon: -57.94, region: "Corner Brook - West Coast" },
    { lat: 53.33, lon: -60.45, region: "Goose Bay - Labrador" },
    { lat: 56.53, lon: -61.68, region: "Nain - Arctic Labrador" }
  ],

  // --- GRAND NORD ET ARCTIQUE ---
  Yukon: [
    { lat: 60.72, lon: -135.05, region: "Whitehorse - Capital" },
    { lat: 62.45, lon: -140.86, region: "Dawson City - Klondike" },
    { lat: 66.56, lon: -133.72, region: "Old Crow - Arctic Circle" }
  ],

  NorthwestTerritories: [
    { lat: 62.45, lon: -114.37, region: "Yellowknife - Capital" },
    { lat: 68.36, lon: -133.73, region: "Inuvik - Mackenzie Delta" },
    { lat: 69.45, lon: -121.23, region: "Tuktoyaktuk - Arctic Coast" },
    { lat: 64.83, lon: -125.50, region: "Fort Simpson - Mackenzie Basin" }
  ],

  Nunavut: [
    { lat: 63.75, lon: -68.52, region: "Iqaluit - Capital (Baffin Island)" },
    { lat: 69.39, lon: -81.82, region: "Coral Harbour - Hudson Bay" },
    { lat: 75.69, lon: -95.89, region: "Resolute Bay - High Arctic" },
    { lat: 79.99, lon: -85.93, region: "Alert - Northernmost Point" }
  ]
};

// ===========================
// Export global – zones Canada
// ===========================
export function getAllCanadaZones() {
  const all = [];
  for (const [province, zones] of Object.entries(CANADA_ZONES)) {
    for (const z of zones) {
      all.push({
        country: "Canada",
        province,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "North America",
      });
    }
  }
  return all;
}

export default { CANADA_ZONES, getAllCanadaZones };
