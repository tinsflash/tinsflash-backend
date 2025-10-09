// PATH: services/runGlobalAfricaNord.js
// 🌍 Référentiel zones Afrique du Nord & Moyen-Orient – TINSFLASH PRO+++
// Ce fichier définit les zones de référence pour l’Afrique du Nord, le Sahara, l’Égypte,
// et le Moyen-Orient (Maghreb, Nil, péninsule Arabique, Levant, Turquie).
// Il est lu par zonesCovered.js puis runGlobal.js
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Afrique Nord & Moyen-Orient
 */
export async function logAfricaNordCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Afrique du Nord & Moyen-Orient – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌍 ZONES DÉTAILLÉES
// ===========================
export const AFRICA_NORD_ZONES = {
  // --- MAGHREB ---
  Morocco: [
    { lat: 33.57, lon: -7.59, region: "Casablanca - Atlantic Coast" },
    { lat: 31.63, lon: -8.00, region: "Marrakech - Interior Plains" },
    { lat: 35.76, lon: -5.83, region: "Tangier - Strait of Gibraltar" },
    { lat: 34.02, lon: -6.83, region: "Rabat - Capital" },
    { lat: 30.92, lon: -6.91, region: "Atlas Mountains - Ouarzazate" },
    { lat: 27.15, lon: -13.20, region: "Western Sahara - Laayoune" }
  ],
  Algeria: [
    { lat: 36.75, lon: 3.04, region: "Algiers - Coast" },
    { lat: 35.70, lon: -0.63, region: "Oran - West Coast" },
    { lat: 34.90, lon: 0.13, region: "Tlemcen - Mountains" },
    { lat: 32.48, lon: 3.68, region: "Ghardaïa - Sahara North" },
    { lat: 28.05, lon: 9.55, region: "In Salah - Central Sahara" },
    { lat: 23.70, lon: 5.78, region: "Tamanrasset - Deep Sahara" }
  ],
  Tunisia: [
    { lat: 36.80, lon: 10.18, region: "Tunis - North Coast" },
    { lat: 35.83, lon: 10.63, region: "Sousse - East Coast" },
    { lat: 34.73, lon: 10.76, region: "Sfax - Central Coast" },
    { lat: 33.88, lon: 10.10, region: "Gabès - South Coast" },
    { lat: 33.50, lon: 8.78, region: "Gafsa - Interior" }
  ],
  Libya: [
    { lat: 32.88, lon: 13.19, region: "Tripoli - North Coast" },
    { lat: 32.12, lon: 20.07, region: "Benghazi - East Coast" },
    { lat: 29.10, lon: 15.95, region: "Sabha - Sahara" },
    { lat: 25.55, lon: 13.00, region: "Murzuq - Deep Desert" }
  ],
  Egypt: [
    { lat: 30.04, lon: 31.23, region: "Cairo - Nile Valley" },
    { lat: 29.97, lon: 32.55, region: "Suez - Canal" },
    { lat: 31.20, lon: 29.92, region: "Alexandria - Coast" },
    { lat: 27.18, lon: 31.19, region: "Assiut - Upper Egypt" },
    { lat: 25.69, lon: 32.64, region: "Luxor - Upper Nile" },
    { lat: 24.09, lon: 32.89, region: "Aswan - South Egypt" },
    { lat: 28.55, lon: 33.97, region: "Sinai - Desert East" }
  ],

  // --- MOYEN-ORIENT ---
  Israel: [
    { lat: 31.77, lon: 35.21, region: "Jerusalem - Capital" },
    { lat: 32.08, lon: 34.78, region: "Tel Aviv - Coast" },
    { lat: 32.70, lon: 35.30, region: "Haifa - North Coast" },
    { lat: 30.60, lon: 34.80, region: "Negev - Desert" }
  ],
  Jordan: [
    { lat: 31.95, lon: 35.91, region: "Amman - Capital" },
    { lat: 30.33, lon: 35.43, region: "Petra - Desert South" },
    { lat: 29.53, lon: 35.00, region: "Aqaba - Red Sea" }
  ],
  Lebanon: [
    { lat: 33.89, lon: 35.50, region: "Beirut - Coast" },
    { lat: 34.01, lon: 36.21, region: "Baalbek - Mountains" }
  ],
  Syria: [
    { lat: 33.51, lon: 36.29, region: "Damascus - South" },
    { lat: 35.15, lon: 36.75, region: "Hama - Central" },
    { lat: 35.53, lon: 35.78, region: "Latakia - Coast" },
    { lat: 34.73, lon: 38.28, region: "Palmyra - Desert" }
  ],
  Turkey: [
    { lat: 41.01, lon: 28.97, region: "Istanbul - Marmara" },
    { lat: 39.93, lon: 32.85, region: "Ankara - Capital" },
    { lat: 38.42, lon: 27.14, region: "Izmir - Aegean" },
    { lat: 36.90, lon: 30.70, region: "Antalya - Mediterranean" },
    { lat: 37.16, lon: 38.79, region: "Gaziantep - East Anatolia" },
    { lat: 40.16, lon: 29.06, region: "Bursa - Northwest" }
  ],
  SaudiArabia: [
    { lat: 24.71, lon: 46.67, region: "Riyadh - Central Desert" },
    { lat: 21.39, lon: 39.86, region: "Jeddah - Red Sea Coast" },
    { lat: 26.43, lon: 50.10, region: "Dammam - Persian Gulf" },
    { lat: 18.22, lon: 42.50, region: "Asir Mountains - South" }
  ],
  UnitedArabEmirates: [
    { lat: 25.20, lon: 55.27, region: "Dubai - Coast" },
    { lat: 24.45, lon: 54.38, region: "Abu Dhabi - Capital" },
    { lat: 25.40, lon: 56.25, region: "Fujairah - East Coast" }
  ],
  Qatar: [
    { lat: 25.29, lon: 51.53, region: "Doha - Capital" }
  ],
  Bahrain: [
    { lat: 26.22, lon: 50.58, region: "Manama - Island Capital" }
  ],
  Oman: [
    { lat: 23.59, lon: 58.41, region: "Muscat - Coast" },
    { lat: 22.57, lon: 59.53, region: "Sur - East Coast" },
    { lat: 17.02, lon: 54.09, region: "Salalah - South Monsoon" }
  ],
  Iran: [
    { lat: 35.69, lon: 51.42, region: "Tehran - Capital" },
    { lat: 29.61, lon: 52.53, region: "Shiraz - Central" },
    { lat: 32.65, lon: 51.67, region: "Isfahan - Plateau" },
    { lat: 27.19, lon: 56.27, region: "Bandar Abbas - Gulf Coast" },
    { lat: 36.30, lon: 59.60, region: "Mashhad - Northeast" },
    { lat: 37.56, lon: 45.07, region: "Tabriz - Northwest" }
  ]
};

// ===========================
// ✅ Export global – zones Afrique Nord / Moyen-Orient
// ===========================
export function getAllAfricaNordZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_NORD_ZONES)) {
    for (const z of zones) {
      all.push({
        country,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "Africa/MiddleEast",
      });
    }
  }
  return all;
}

export default { AFRICA_NORD_ZONES, getAllAfricaNordZones };
