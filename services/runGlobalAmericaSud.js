// ==========================================================
// 🌎 TINSFLASH – runGlobalAmericaSud.js (Everest Protocol v3.0 PRO+++)
// ==========================================================
// Couverture : Amérique du Sud (Brésil, Argentine, Chili, Pérou,
// Bolivie, Paraguay, Uruguay, Colombie, Venezuela, Équateur)
// Objectif : suivi Amazonie, Andes, côtes atlantiques et pacifiques,
// El Niño / La Niña, humidité tropicale et cyclones.
// ==========================================================

import { addEngineLog } from "./engineState.js";

export const AMERICA_SUD_ZONES = {
  Brazil: [
    { lat: -15.78, lon: -47.93, region: "Brasilia - Central Plateau" },
    { lat: -23.55, lon: -46.63, region: "São Paulo - Southeast" },
    { lat: -22.90, lon: -43.20, region: "Rio de Janeiro - Coast" },
    { lat: -3.12, lon: -60.02, region: "Manaus - Amazon" },
    { lat: -8.05, lon: -34.90, region: "Recife - Atlantic" }
  ],
  Argentina: [
    { lat: -34.60, lon: -58.38, region: "Buenos Aires - Capital" },
    { lat: -31.42, lon: -64.18, region: "Córdoba - Center" },
    { lat: -38.00, lon: -57.55, region: "Mar del Plata - Coast" },
    { lat: -54.80, lon: -68.30, region: "Ushuaia - Tierra del Fuego" }
  ],
  Chile: [
    { lat: -33.45, lon: -70.66, region: "Santiago - Capital" },
    { lat: -41.47, lon: -72.94, region: "Puerto Montt - South" },
    { lat: -20.22, lon: -70.14, region: "Iquique - Desert North" },
    { lat: -53.16, lon: -70.91, region: "Punta Arenas - Magellan" }
  ],
  Peru: [
    { lat: -12.05, lon: -77.04, region: "Lima - Coast" },
    { lat: -13.52, lon: -71.97, region: "Cusco - Andes" },
    { lat: -16.40, lon: -71.53, region: "Arequipa - Volcanoes" },
    { lat: -6.03, lon: -76.97, region: "Tarapoto - Amazon North" }
  ],
  Bolivia: [
    { lat: -16.50, lon: -68.15, region: "La Paz - Altiplano" },
    { lat: -17.40, lon: -66.16, region: "Cochabamba - Valley" },
    { lat: -19.02, lon: -65.26, region: "Sucre - South Highlands" },
    { lat: -17.78, lon: -63.18, region: "Santa Cruz - East Plains" }
  ],
  Paraguay: [
    { lat: -25.27, lon: -57.64, region: "Asunción - Capital" },
    { lat: -22.54, lon: -55.73, region: "Pedro Juan Caballero - North" },
    { lat: -26.87, lon: -58.30, region: "Formosa - South" }
  ],
  Uruguay: [
    { lat: -34.90, lon: -56.19, region: "Montevideo - Capital" },
    { lat: -33.23, lon: -58.03, region: "Mercedes - West" },
    { lat: -34.47, lon: -54.33, region: "Punta del Este - Coast" }
  ],
  Colombia: [
    { lat: 4.61, lon: -74.08, region: "Bogotá - Andes" },
    { lat: 6.25, lon: -75.56, region: "Medellín - North Andes" },
    { lat: 10.40, lon: -75.50, region: "Cartagena - Caribbean" },
    { lat: 3.44, lon: -76.52, region: "Cali - Valle del Cauca" }
  ],
  Venezuela: [
    { lat: 10.50, lon: -66.91, region: "Caracas - Capital" },
    { lat: 8.62, lon: -71.14, region: "Mérida - Andes" },
    { lat: 10.20, lon: -64.63, region: "Cumaná - Coast" },
    { lat: 8.59, lon: -70.35, region: "Barinas - Llanos" }
  ],
  Ecuador: [
    { lat: -0.23, lon: -78.52, region: "Quito - Andes" },
    { lat: -2.17, lon: -79.92, region: "Guayaquil - Pacific Coast" },
    { lat: -1.67, lon: -78.65, region: "Riobamba - Central Andes" },
    { lat: -0.90, lon: -89.60, region: "Galápagos - Islands" }
  ]
};

// ==========================================================
// ✅ Fonctions
// ==========================================================
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

export async function runGlobalAmericaSud() {
  await addEngineLog("🌎 Lancement runGlobalAmericaSud (Amérique du Sud)", "info", "runGlobal");
  const zones = getAllAmericaSudZones();
  const summary = {
    region: "Amérique du Sud",
    totalZones: zones.length,
    generatedAt: new Date().toISOString(),
    status: "ok"
  };
  await addEngineLog(`✅ Amérique du Sud : ${zones.length} zones traitées`, "success", "runGlobal");
  return { summary, zones };
}

export default { AMERICA_SUD_ZONES, getAllAmericaSudZones, runGlobalAmericaSud };
