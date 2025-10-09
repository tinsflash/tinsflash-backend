// PATH: services/runGlobalAfricaSud.js
// 🌍 Référentiel zones Afrique Australe – TINSFLASH PRO+++
// Couvre : Afrique du Sud, Namibie, Botswana, Zimbabwe, Zambie, Mozambique,
// Lesotho, Eswatini, Madagascar, Malawi + zones océaniques (Canal du Mozambique, Cap)
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Afrique Australe
 */
export async function logAfricaSudCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Afrique Australe – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌍 ZONES DÉTAILLÉES
// ===========================
export const AFRICA_SUD_ZONES = {
  SouthAfrica: [
    { lat: -25.75, lon: 28.19, region: "Pretoria - Capital" },
    { lat: -26.20, lon: 28.04, region: "Johannesburg - Highveld" },
    { lat: -29.85, lon: 31.02, region: "Durban - Indian Ocean Coast" },
    { lat: -33.93, lon: 18.42, region: "Cape Town - Atlantic Coast" },
    { lat: -29.12, lon: 26.22, region: "Bloemfontein - Central Plateau" },
    { lat: -34.45, lon: 19.22, region: "Cape Agulhas - Southern Tip" },
    { lat: -29.38, lon: 29.53, region: "Drakensberg - Lesotho Border" }
  ],
  Namibia: [
    { lat: -22.56, lon: 17.08, region: "Windhoek - Capital" },
    { lat: -23.31, lon: 15.00, region: "Walvis Bay - Atlantic Coast" },
    { lat: -26.64, lon: 15.15, region: "Lüderitz - Desert Coast" },
    { lat: -20.46, lon: 16.65, region: "Otjiwarongo - Central" },
    { lat: -18.06, lon: 21.98, region: "Rundu - Kavango River" }
  ],
  Botswana: [
    { lat: -24.65, lon: 25.91, region: "Gaborone - Capital" },
    { lat: -19.98, lon: 23.42, region: "Maun - Okavango Delta" },
    { lat: -21.17, lon: 27.50, region: "Francistown - North-East" },
    { lat: -22.57, lon: 27.10, region: "Serowe - Central" }
  ],
  Zimbabwe: [
    { lat: -17.83, lon: 31.05, region: "Harare - Capital" },
    { lat: -20.17, lon: 28.58, region: "Bulawayo - South" },
    { lat: -18.02, lon: 25.83, region: "Victoria Falls - North-West" },
    { lat: -19.45, lon: 29.82, region: "Masvingo - Great Zimbabwe" }
  ],
  Zambia: [
    { lat: -15.42, lon: 28.28, region: "Lusaka - Capital" },
    { lat: -12.97, lon: 28.64, region: "Ndola - Copperbelt" },
    { lat: -13.13, lon: 27.85, region: "Kitwe - Industrial Belt" },
    { lat: -17.83, lon: 25.83, region: "Livingstone - Zambezi" }
  ],
  Mozambique: [
    { lat: -25.96, lon: 32.58, region: "Maputo - Capital" },
    { lat: -19.84, lon: 34.84, region: "Beira - Coast" },
    { lat: -15.11, lon: 39.27, region: "Nampula - North" },
    { lat: -11.28, lon: 40.28, region: "Pemba - Tropical Coast" },
    { lat: -16.23, lon: 39.90, region: "Quelimane - Delta" }
  ],
  Lesotho: [
    { lat: -29.31, lon: 27.48, region: "Maseru - Capital Highlands" },
    { lat: -29.58, lon: 28.23, region: "Thaba-Tseka - Drakensberg Core" }
  ],
  Eswatini: [
    { lat: -26.32, lon: 31.13, region: "Mbabane - Capital" },
    { lat: -26.50, lon: 31.38, region: "Manzini - Central" }
  ],
  Madagascar: [
    { lat: -18.91, lon: 47.54, region: "Antananarivo - Capital" },
    { lat: -20.16, lon: 57.50, region: "Toamasina - East Coast" },
    { lat: -21.45, lon: 47.08, region: "Fianarantsoa - Central Highlands" },
    { lat: -23.35, lon: 43.67, region: "Toliara - South Coast" },
    { lat: -12.27, lon: 49.29, region: "Antsiranana - North" }
  ],
  Malawi: [
    { lat: -13.97, lon: 33.79, region: "Lilongwe - Capital" },
    { lat: -15.78, lon: 35.02, region: "Blantyre - South" },
    { lat: -11.47, lon: 34.02, region: "Mzuzu - North Plateau" }
  ],
  OceanicZones: [
    { lat: -35.00, lon: 18.00, region: "Cape of Good Hope - Atlantic/Indian Junction" },
    { lat: -20.50, lon: 37.50, region: "Mozambique Channel - Mid Ocean" },
    { lat: -30.00, lon: 25.00, region: "South Atlantic Subtropical High" },
    { lat: -40.00, lon: 20.00, region: "Southern Ocean - Antarctic Confluence" }
  ]
};

// ===========================
// ✅ Export global – zones Afrique Australe
// ===========================
export function getAllAfricaSudZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_SUD_ZONES)) {
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

export default { AFRICA_SUD_ZONES, getAllAfricaSudZones };
