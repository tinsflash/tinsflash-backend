// PATH: services/runGlobalAsiaEst.js
// 🌏 Référentiel zones Asie de l'Est – TINSFLASH PRO+++
// Ce fichier définit les zones météo pour l’Asie de l’Est : Chine, Japon,
// Corées, Taïwan, Mongolie, Hong Kong, et zones maritimes Pacifique Ouest.
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Asie de l'Est
 */
export async function logAsiaEstCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Asie de l'Est – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌏 ZONES DÉTAILLÉES
// ===========================
export const ASIA_EST_ZONES = {
  // --- CHINE ---
  China: [
    { lat: 39.90, lon: 116.40, region: "Beijing - Capitale Nord" },
    { lat: 31.23, lon: 121.47, region: "Shanghai - Côte Est" },
    { lat: 23.13, lon: 113.26, region: "Guangzhou - Sud-Est" },
    { lat: 22.32, lon: 114.17, region: "Hong Kong - Delta de la Rivière des Perles" },
    { lat: 29.56, lon: 106.55, region: "Chongqing - Centre-Sud" },
    { lat: 30.66, lon: 104.07, region: "Chengdu - Plateau Sichuan" },
    { lat: 41.80, lon: 123.41, region: "Shenyang - Nord-Est" },
    { lat: 34.34, lon: 108.93, region: "Xi’an - Centre Historique" },
    { lat: 25.04, lon: 102.72, region: "Kunming - Yunnan" },
    { lat: 45.75, lon: 126.65, region: "Harbin - Mandchourie Nord" },
    { lat: 35.42, lon: 119.45, region: "Qingdao - Mer Jaune" },
    { lat: 43.82, lon: 87.61, region: "Urumqi - Xinjiang" },
    { lat: 29.65, lon: 91.13, region: "Lhassa - Tibet Himalaya" }
  ],

  // --- JAPON ---
  Japan: [
    { lat: 35.68, lon: 139.69, region: "Tokyo - Capitale" },
    { lat: 34.69, lon: 135.50, region: "Osaka - Centre Industriel" },
    { lat: 35.02, lon: 135.75, region: "Kyoto - Vallée Kansai" },
    { lat: 43.06, lon: 141.35, region: "Sapporo - Hokkaido Nord" },
    { lat: 33.59, lon: 130.40, region: "Fukuoka - Kyushu Sud" },
    { lat: 26.21, lon: 127.68, region: "Naha - Okinawa" }
  ],

  // --- CORÉE DU SUD ---
  SouthKorea: [
    { lat: 37.57, lon: 126.98, region: "Séoul - Capitale" },
    { lat: 35.16, lon: 129.06, region: "Busan - Côte Sud" },
    { lat: 35.82, lon: 127.15, region: "Jeonju - Centre" },
    { lat: 33.50, lon: 126.53, region: "Jeju - Île Sud" }
  ],

  // --- CORÉE DU NORD ---
  NorthKorea: [
    { lat: 39.03, lon: 125.75, region: "Pyongyang - Capitale" },
    { lat: 40.67, lon: 129.20, region: "Hamhung - Côte Est" },
    { lat: 42.46, lon: 130.76, region: "Rason - Extrême Nord-Est" }
  ],

  // --- MONGOLIE ---
  Mongolia: [
    { lat: 47.92, lon: 106.91, region: "Oulan-Bator - Capitale Plateau" },
    { lat: 46.36, lon: 105.82, region: "Choibalsan - Est Aride" },
    { lat: 44.89, lon: 110.12, region: "Sainshand - Désert de Gobi" },
    { lat: 48.01, lon: 91.64, region: "Khovd - Montagnes Ouest" }
  ],

  // --- TAÏWAN ---
  Taiwan: [
    { lat: 25.03, lon: 121.56, region: "Taipei - Nord" },
    { lat: 24.15, lon: 120.67, region: "Taichung - Centre" },
    { lat: 22.63, lon: 120.30, region: "Kaohsiung - Sud" },
    { lat: 23.48, lon: 120.45, region: "Alishan - Montagnes" }
  ],

  // --- HONG KONG & MACAO ---
  HongKong: [
    { lat: 22.32, lon: 114.17, region: "Hong Kong - Îles Sud-Est" }
  ],
  Macau: [
    { lat: 22.19, lon: 113.54, region: "Macao - Péninsule Sud" }
  ]
};

// ===========================
// ✅ Export global – zones Asie de l'Est
// ===========================
export function getAllAsiaEstZones() {
  const all = [];
  for (const [country, zones] of Object.entries(ASIA_EST_ZONES)) {
    for (const z of zones) {
      all.push({
        country,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "East Asia"
      });
    }
  }
  return all;
}

export default { ASIA_EST_ZONES, getAllAsiaEstZones };
