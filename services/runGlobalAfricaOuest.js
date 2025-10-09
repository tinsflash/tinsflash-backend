// PATH: services/runGlobalAfricaOuest.js
// 🌍 Référentiel zones Afrique de l’Ouest – TINSFLASH PRO+++
// Ce fichier définit les zones de référence pour les pays du Golfe de Guinée,
// le Sahel, et la façade atlantique ouest-africaine.
// Lu par zonesCovered.js puis runGlobal.js
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Afrique de l’Ouest
 */
export async function logAfricaOuestCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Afrique de l’Ouest – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌍 ZONES DÉTAILLÉES
// ===========================
export const AFRICA_OUEST_ZONES = {
  Senegal: [
    { lat: 14.69, lon: -17.44, region: "Dakar - Atlantic Coast" },
    { lat: 14.15, lon: -16.07, region: "Kaolack - Central" },
    { lat: 13.52, lon: -14.46, region: "Tambacounda - East" },
    { lat: 15.65, lon: -13.25, region: "Saint-Louis - North Delta" }
  ],
  Mauritania: [
    { lat: 18.08, lon: -15.98, region: "Nouakchott - Coast" },
    { lat: 20.52, lon: -13.05, region: "Atar - Sahara North" },
    { lat: 16.67, lon: -11.40, region: "Kiffa - South Sahel" }
  ],
  Mali: [
    { lat: 12.65, lon: -8.00, region: "Bamako - Capital" },
    { lat: 14.35, lon: -4.90, region: "Timbuktu - Desert Edge" },
    { lat: 11.32, lon: -5.68, region: "Sikasso - South" },
    { lat: 16.27, lon: -0.05, region: "Gao - Sahara East" }
  ],
  Niger: [
    { lat: 13.52, lon: 2.11, region: "Niamey - Capital" },
    { lat: 14.90, lon: 5.26, region: "Maradi - Central" },
    { lat: 18.09, lon: 8.97, region: "Agadez - Sahara" },
    { lat: 16.97, lon: 7.99, region: "Arlit - Desert North" }
  ],
  BurkinaFaso: [
    { lat: 12.37, lon: -1.52, region: "Ouagadougou - Capital" },
    { lat: 10.63, lon: -4.77, region: "Bobo-Dioulasso - West" },
    { lat: 13.29, lon: 0.36, region: "Fada N’Gourma - East" }
  ],
  Guinea: [
    { lat: 9.51, lon: -13.71, region: "Conakry - Coast" },
    { lat: 10.04, lon: -12.28, region: "Labé - Highlands" },
    { lat: 9.10, lon: -10.10, region: "Kankan - Inland" }
  ],
  SierraLeone: [
    { lat: 8.48, lon: -13.23, region: "Freetown - Coast" },
    { lat: 8.90, lon: -11.05, region: "Kenema - East" }
  ],
  Liberia: [
    { lat: 6.31, lon: -10.80, region: "Monrovia - Coast" },
    { lat: 7.00, lon: -9.50, region: "Gbarnga - Inland" }
  ],
  IvoryCoast: [
    { lat: 5.36, lon: -4.01, region: "Abidjan - Coast" },
    { lat: 6.82, lon: -5.28, region: "Yamoussoukro - Capital" },
    { lat: 7.68, lon: -5.03, region: "Bouaké - Central" },
    { lat: 9.51, lon: -7.56, region: "Korhogo - North" }
  ],
  Ghana: [
    { lat: 5.56, lon: -0.20, region: "Accra - Coast" },
    { lat: 6.69, lon: -1.61, region: "Kumasi - Central" },
    { lat: 9.40, lon: -0.83, region: "Tamale - North" },
    { lat: 4.89, lon: -1.75, region: "Takoradi - Gulf Coast" }
  ],
  Togo: [
    { lat: 6.13, lon: 1.22, region: "Lomé - Coast" },
    { lat: 8.98, lon: 1.13, region: "Sokodé - Central" },
    { lat: 9.70, lon: 0.25, region: "Dapaong - North" }
  ],
  Benin: [
    { lat: 6.37, lon: 2.42, region: "Cotonou - Coast" },
    { lat: 7.17, lon: 2.07, region: "Abomey - Central" },
    { lat: 9.33, lon: 2.63, region: "Parakou - North" },
    { lat: 11.05, lon: 3.97, region: "Kandi - Extreme North" }
  ],
  Nigeria: [
    { lat: 6.45, lon: 3.39, region: "Lagos - Coast" },
    { lat: 9.08, lon: 7.40, region: "Abuja - Capital" },
    { lat: 10.52, lon: 7.43, region: "Kaduna - Central North" },
    { lat: 12.00, lon: 8.52, region: "Kano - North" },
    { lat: 11.85, lon: 13.15, region: "Maiduguri - Northeast" },
    { lat: 5.48, lon: 7.02, region: "Port Harcourt - Delta" }
  ],
  CapeVerde: [
    { lat: 14.92, lon: -23.51, region: "Santiago Island - Praia" },
    { lat: 16.89, lon: -25.00, region: "São Vicente - Mindelo" }
  ],
  Gambia: [
    { lat: 13.45, lon: -16.57, region: "Banjul - Coast" },
    { lat: 13.28, lon: -14.67, region: "Basse Santa Su - East" }
  ],
  GuineaBissau: [
    { lat: 11.86, lon: -15.59, region: "Bissau - Coast" },
    { lat: 12.27, lon: -14.67, region: "Gabu - East" }
  ]
};

// ===========================
// ✅ Export global – zones Afrique de l’Ouest
// ===========================
export function getAllAfricaOuestZones() {
  const all = [];
  for (const [country, zones] of Object.entries(AFRICA_OUEST_ZONES)) {
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

export default { AFRICA_OUEST_ZONES, getAllAfricaOuestZones };
