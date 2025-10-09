// PATH: services/runGlobalOceania.js
// 🌏 Référentiel zones Océanie & Pacifique Sud – TINSFLASH PRO+++
// Ce fichier définit les zones météo pour l’Australie, la Nouvelle-Zélande,
// la Papouasie, la Polynésie, et les archipels du Pacifique.
// Il est lu par zonesCovered.js puis runGlobal.js
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Océanie / Pacifique Sud
 */
export async function logOceaniaCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Océanie & Pacifique Sud – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌊 ZONES DÉTAILLÉES
// ===========================
export const OCEANIA_ZONES = {
  // --- AUSTRALIE ---
  Australia: [
    { lat: -33.86, lon: 151.21, region: "Sydney - Côte Est" },
    { lat: -37.81, lon: 144.96, region: "Melbourne - Sud" },
    { lat: -27.47, lon: 153.03, region: "Brisbane - Queensland" },
    { lat: -31.95, lon: 115.86, region: "Perth - Ouest" },
    { lat: -34.93, lon: 138.60, region: "Adelaide - Sud" },
    { lat: -12.46, lon: 130.84, region: "Darwin - Nord Tropical" },
    { lat: -42.88, lon: 147.33, region: "Hobart - Tasmanie" },
    { lat: -23.70, lon: 133.87, region: "Alice Springs - Désert Central" },
    { lat: -19.25, lon: 146.82, region: "Townsville - Nord-Est" },
    { lat: -35.28, lon: 149.13, region: "Canberra - Capitale Fédérale" }
  ],

  // --- NOUVELLE-ZÉLANDE ---
  NewZealand: [
    { lat: -36.85, lon: 174.76, region: "Auckland - Nord" },
    { lat: -41.28, lon: 174.77, region: "Wellington - Capitale" },
    { lat: -45.87, lon: 170.50, region: "Dunedin - Sud" },
    { lat: -43.53, lon: 172.63, region: "Christchurch - Côte Est" },
    { lat: -39.49, lon: 176.92, region: "Napier - Côte Nord-Est" }
  ],

  // --- PAPOUASIE / INDONÉSIE EST ---
  PapuaNewGuinea: [
    { lat: -9.47, lon: 147.19, region: "Port Moresby - Sud" },
    { lat: -6.21, lon: 155.57, region: "Bougainville - Est" },
    { lat: -5.22, lon: 145.78, region: "Madang - Nord" },
    { lat: -6.73, lon: 146.99, region: "Lae - Côte Centrale" }
  ],
  IndonesiaEast: [
    { lat: -8.65, lon: 115.22, region: "Bali - Île" },
    { lat: -3.33, lon: 128.92, region: "Ambon - Moluques" },
    { lat: -0.91, lon: 131.25, region: "Sorong - Papouasie Ouest" }
  ],

  // --- POLYNÉSIE FRANÇAISE ---
  FrenchPolynesia: [
    { lat: -17.53, lon: -149.56, region: "Tahiti - Papeete" },
    { lat: -16.50, lon: -151.75, region: "Bora Bora - Îles Sous-le-Vent" },
    { lat: -9.78, lon: -139.03, region: "Marquises - Nuku Hiva" },
    { lat: -23.12, lon: -134.97, region: "Australes - Tubuai" }
  ],

  // --- NOUVELLE-CALÉDONIE ---
  NewCaledonia: [
    { lat: -22.27, lon: 166.45, region: "Nouméa - Sud" },
    { lat: -20.70, lon: 164.93, region: "Koumac - Nord" }
  ],

  // --- FIDJI ---
  Fiji: [
    { lat: -18.14, lon: 178.44, region: "Suva - Île Viti Levu" },
    { lat: -17.80, lon: 177.42, region: "Nadi - Côte Ouest" }
  ],

  // --- VANUATU ---
  Vanuatu: [
    { lat: -17.74, lon: 168.32, region: "Port Vila - Capitale" },
    { lat: -15.51, lon: 167.18, region: "Luganville - Nord" }
  ],

  // --- SAMOA & TONGA ---
  Samoa: [
    { lat: -13.83, lon: -171.77, region: "Apia - Île Upolu" }
  ],
  Tonga: [
    { lat: -21.13, lon: -175.20, region: "Nuku’alofa - Île Tongatapu" }
  ],

  // --- ÎLES COOK ---
  CookIslands: [
    { lat: -21.21, lon: -159.78, region: "Rarotonga - Capitale" }
  ],

  // --- KIRIBATI ---
  Kiribati: [
    { lat: 1.33, lon: 173.03, region: "Tarawa - Îles Gilbert" }
  ],

  // --- MICRONÉSIE & PALAU ---
  Micronesia: [
    { lat: 6.91, lon: 158.16, region: "Pohnpei - Centre" },
    { lat: 7.45, lon: 151.85, region: "Chuuk - Lagons" }
  ],
  Palau: [
    { lat: 7.50, lon: 134.62, region: "Koror - Archipel" }
  ],

  // --- ÎLES SALOMON ---
  SolomonIslands: [
    { lat: -9.43, lon: 160.00, region: "Honiara - Île Guadalcanal" }
  ],

  // --- TIMOR-LESTE ---
  TimorLeste: [
    { lat: -8.56, lon: 125.57, region: "Dili - Capitale" }
  ]
};

// ===========================
// ✅ Export global – zones Océanie / Pacifique Sud
// ===========================
export function getAllOceaniaZones() {
  const all = [];
  for (const [country, zones] of Object.entries(OCEANIA_ZONES)) {
    for (const z of zones) {
      all.push({
        country,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "Oceania"
      });
    }
  }
  return all;
}

export default { OCEANIA_ZONES, getAllOceaniaZones };
