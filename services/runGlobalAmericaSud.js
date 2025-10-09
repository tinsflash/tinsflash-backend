// PATH: services/runGlobalAmericaSud.js
// 🌎 Référentiel zones Amérique du Sud – TINSFLASH PRO+++
// Ce fichier définit les zones météo de référence pour l’Amérique du Sud
// (Amazonie, Andes, côtes Pacifique et Atlantique).
// Il est lu par zonesCovered.js puis runGlobal.js
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Amérique du Sud
 */
export async function logAmericaSudCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Amérique du Sud – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌎 ZONES DÉTAILLÉES
// ===========================
export const AMERICA_SUD_ZONES = {
  // --- AMÉRIQUE DU SUD PRINCIPALE ---
  Brazil: [
    { lat: -15.78, lon: -47.93, region: "Brasilia - Central Plateau" },
    { lat: -23.55, lon: -46.63, region: "São Paulo - Southeast" },
    { lat: -22.91, lon: -43.17, region: "Rio de Janeiro - Coast" },
    { lat: -3.12, lon: -60.02, region: "Manaus - Amazon Basin" },
    { lat: -8.05, lon: -34.88, region: "Recife - Northeast Coast" },
    { lat: -12.97, lon: -38.51, region: "Salvador - Bahia Coast" },
    { lat: -16.68, lon: -49.25, region: "Goiânia - Cerrado" },
    { lat: -30.03, lon: -51.23, region: "Porto Alegre - South Atlantic" }
  ],
  Argentina: [
    { lat: -34.60, lon: -58.38, region: "Buenos Aires - Pampas" },
    { lat: -32.89, lon: -68.83, region: "Mendoza - Andes West" },
    { lat: -24.78, lon: -65.41, region: "Salta - Northwest Highlands" },
    { lat: -38.95, lon: -68.06, region: "Neuquén - Patagonia North" },
    { lat: -51.62, lon: -69.22, region: "Río Gallegos - Patagonia South" },
    { lat: -54.80, lon: -68.30, region: "Ushuaia - Tierra del Fuego" }
  ],
  Chile: [
    { lat: -33.45, lon: -70.66, region: "Santiago - Central Andes" },
    { lat: -23.65, lon: -70.40, region: "Antofagasta - Atacama Desert" },
    { lat: -36.82, lon: -73.05, region: "Concepción - South Coast" },
    { lat: -41.47, lon: -72.93, region: "Puerto Montt - Lakes Region" },
    { lat: -53.16, lon: -70.91, region: "Punta Arenas - Magellan Strait" }
  ],
  Peru: [
    { lat: -12.05, lon: -77.04, region: "Lima - Pacific Coast" },
    { lat: -13.53, lon: -71.97, region: "Cusco - Andes" },
    { lat: -16.40, lon: -71.53, region: "Arequipa - South Andes" },
    { lat: -3.75, lon: -73.25, region: "Iquitos - Amazon Basin" }
  ],
  Bolivia: [
    { lat: -16.50, lon: -68.12, region: "La Paz - Andes" },
    { lat: -17.78, lon: -63.18, region: "Santa Cruz - Lowlands" },
    { lat: -19.03, lon: -65.26, region: "Sucre - Central Highlands" }
  ],
  Colombia: [
    { lat: 4.71, lon: -74.07, region: "Bogotá - Central Andes" },
    { lat: 6.24, lon: -75.58, region: "Medellín - North Andes" },
    { lat: 10.40, lon: -75.50, region: "Cartagena - Caribbean Coast" },
    { lat: 3.45, lon: -76.53, region: "Cali - Southwest Valleys" },
    { lat: 0.02, lon: -77.53, region: "San Miguel - Amazon Border" }
  ],
  Venezuela: [
    { lat: 10.49, lon: -66.88, region: "Caracas - North Coast" },
    { lat: 8.32, lon: -62.72, region: "Ciudad Guayana - Orinoco Basin" },
    { lat: 7.89, lon: -72.50, region: "San Cristóbal - Andes West" },
    { lat: 10.64, lon: -71.64, region: "Maracaibo - Lake Region" }
  ],
  Ecuador: [
    { lat: -0.18, lon: -78.47, region: "Quito - Andes" },
    { lat: -2.17, lon: -79.92, region: "Guayaquil - Pacific Coast" },
    { lat: -0.95, lon: -90.97, region: "Galápagos Islands" }
  ],
  Paraguay: [
    { lat: -25.29, lon: -57.65, region: "Asunción - Capital" },
    { lat: -23.36, lon: -57.43, region: "Concepción - North Interior" },
    { lat: -27.33, lon: -55.87, region: "Encarnación - South Border" }
  ],
  Uruguay: [
    { lat: -34.90, lon: -56.19, region: "Montevideo - Capital Coast" },
    { lat: -33.23, lon: -58.02, region: "Paysandú - Northwest" },
    { lat: -34.43, lon: -57.83, region: "Colonia - Rio de la Plata" }
  ],
  Guyana: [
    { lat: 6.80, lon: -58.16, region: "Georgetown - Atlantic Coast" },
    { lat: 5.47, lon: -58.45, region: "Linden - Interior" }
  ],
  Suriname: [
    { lat: 5.87, lon: -55.17, region: "Paramaribo - Coast" },
    { lat: 4.22, lon: -55.45, region: "Brokopondo - Forest Interior" }
  ],
  FrenchGuiana: [
    { lat: 4.93, lon: -52.33, region: "Cayenne - Coast" },
    { lat: 5.16, lon: -52.64, region: "Kourou - Space Center" },
    { lat: 3.90, lon: -53.02, region: "Maripasoula - Amazon Interior" }
  ]
};

// ===========================
// ✅ Export global – zones Amérique du Sud
// ===========================
export function getAllAmericaSudZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AMERICA_SUD_ZONES)) {
    for (const z of zones) {
      all.push({
        country,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "South America"
      });
    }
  }
  return all;
}

export default { AMERICA_SUD_ZONES, getAllAmericaSudZones };
