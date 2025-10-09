// PATH: services/runGlobalCaribbean.js
// 🌴 Référentiel zones Caraïbes & Amérique Centrale – TINSFLASH PRO+++
// Ce fichier définit les zones météo pour les Antilles, la mer des Caraïbes,
// le Golfe du Mexique, et l’Amérique centrale.
// Il est lu par zonesCovered.js puis runGlobal.js
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Caraïbes / Amérique Centrale
 */
export async function logCaribbeanCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Caraïbes & Amérique Centrale – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌴 ZONES DÉTAILLÉES
// ===========================
export const CARIBBEAN_ZONES = {
  // --- AMÉRIQUE CENTRALE ---
  Mexico: [
    { lat: 19.43, lon: -99.13, region: "Mexico City - Plateau Central" },
    { lat: 20.97, lon: -89.62, region: "Mérida - Yucatán" },
    { lat: 21.16, lon: -86.85, region: "Cancún - Riviera Maya" },
    { lat: 17.06, lon: -96.72, region: "Oaxaca - Montagnes Sud" },
    { lat: 25.67, lon: -100.31, region: "Monterrey - Nord" },
    { lat: 16.75, lon: -93.12, region: "Tuxtla Gutiérrez - Chiapas" }
  ],
  Guatemala: [
    { lat: 14.63, lon: -90.55, region: "Guatemala City - Plateau" },
    { lat: 15.47, lon: -90.37, region: "Cobán - Hautes Terres" },
    { lat: 13.92, lon: -90.82, region: "Escuintla - Côte Pacifique" }
  ],
  Belize: [
    { lat: 17.50, lon: -88.20, region: "Belize City - Côte Caraïbe" },
    { lat: 16.52, lon: -88.37, region: "Placencia - Sud" }
  ],
  Honduras: [
    { lat: 14.08, lon: -87.21, region: "Tegucigalpa - Centre" },
    { lat: 15.50, lon: -88.03, region: "San Pedro Sula - Nord" },
    { lat: 16.32, lon: -86.52, region: "Île Roatán - Caraïbes" }
  ],
  ElSalvador: [
    { lat: 13.70, lon: -89.20, region: "San Salvador - Volcans" },
    { lat: 13.35, lon: -88.44, region: "San Miguel - Sud-Est" }
  ],
  Nicaragua: [
    { lat: 12.13, lon: -86.25, region: "Managua - Centre" },
    { lat: 11.98, lon: -85.86, region: "Granada - Lac Nicaragua" },
    { lat: 12.44, lon: -86.88, region: "León - Nord-Ouest" }
  ],
  CostaRica: [
    { lat: 9.93, lon: -84.08, region: "San José - Vallée Centrale" },
    { lat: 10.02, lon: -83.05, region: "Puerto Limón - Caraïbes" },
    { lat: 9.75, lon: -84.18, region: "Quepos - Côte Pacifique" }
  ],
  Panama: [
    { lat: 8.98, lon: -79.52, region: "Panama City - Canal" },
    { lat: 9.35, lon: -79.90, region: "Colón - Mer des Caraïbes" },
    { lat: 9.34, lon: -82.25, region: "Bocas del Toro - Archipel" }
  ],

  // --- CARAÏBES PRINCIPALES ---
  Cuba: [
    { lat: 23.13, lon: -82.38, region: "La Havane - Nord-Ouest" },
    { lat: 21.52, lon: -77.78, region: "Camagüey - Centre" },
    { lat: 20.02, lon: -75.83, region: "Santiago - Sud-Est" }
  ],
  Haiti: [
    { lat: 18.54, lon: -72.34, region: "Port-au-Prince - Ouest" },
    { lat: 19.75, lon: -72.20, region: "Cap-Haïtien - Nord" }
  ],
  DominicanRepublic: [
    { lat: 18.47, lon: -69.89, region: "Saint-Domingue - Sud" },
    { lat: 19.45, lon: -70.70, region: "Santiago - Nord" },
    { lat: 18.48, lon: -69.30, region: "Punta Cana - Est" }
  ],
  Jamaica: [
    { lat: 17.98, lon: -76.80, region: "Kingston - Sud-Est" },
    { lat: 18.47, lon: -77.92, region: "Montego Bay - Nord" }
  ],
  PuertoRico: [
    { lat: 18.46, lon: -66.10, region: "San Juan - Nord" },
    { lat: 18.22, lon: -67.15, region: "Mayagüez - Ouest" }
  ],
  Bahamas: [
    { lat: 25.04, lon: -77.35, region: "Nassau - New Providence" },
    { lat: 26.53, lon: -78.70, region: "Grand Bahama - Freeport" },
    { lat: 24.31, lon: -75.45, region: "Exuma - Centre" }
  ],
  TrinidadTobago: [
    { lat: 10.67, lon: -61.52, region: "Port of Spain - Trinidad" },
    { lat: 11.26, lon: -60.68, region: "Scarborough - Tobago" }
  ],
  Barbados: [
    { lat: 13.10, lon: -59.61, region: "Bridgetown - Capital" }
  ],
  SaintLucia: [
    { lat: 13.91, lon: -60.98, region: "Castries - Nord-Ouest" }
  ],
  Martinique: [
    { lat: 14.61, lon: -61.05, region: "Fort-de-France - Centre" },
    { lat: 14.73, lon: -60.95, region: "Le Robert - Côte Atlantique" }
  ],
  Guadeloupe: [
    { lat: 16.27, lon: -61.53, region: "Pointe-à-Pitre - Basse-Terre" },
    { lat: 15.88, lon: -61.21, region: "Les Saintes - Archipel Sud" }
  ],
  SaintMartin: [
    { lat: 18.07, lon: -63.05, region: "Marigot - Île Nord" }
  ],
  AntiguaBarbuda: [
    { lat: 17.12, lon: -61.84, region: "Saint John's - Antigua" },
    { lat: 17.63, lon: -61.77, region: "Barbuda - Nord" }
  ],
  SaintKittsNevis: [
    { lat: 17.30, lon: -62.72, region: "Basseterre - St Kitts" },
    { lat: 17.15, lon: -62.60, region: "Charlestown - Nevis" }
  ],
  Dominica: [
    { lat: 15.30, lon: -61.39, region: "Roseau - Capital" }
  ],
  Grenada: [
    { lat: 12.06, lon: -61.75, region: "Saint George's - Capital" }
  ],
  Aruba: [
    { lat: 12.52, lon: -70.03, region: "Oranjestad - Island" }
  ],
  Curacao: [
    { lat: 12.11, lon: -68.93, region: "Willemstad - Island" }
  ],
  SaintVincentGrenadines: [
    { lat: 13.16, lon: -61.22, region: "Kingstown - Capital" }
  ],
  CaymanIslands: [
    { lat: 19.31, lon: -81.25, region: "George Town - Grand Cayman" }
  ],
  TurksCaicos: [
    { lat: 21.78, lon: -72.27, region: "Cockburn Town - Grand Turk" }
  ],
  Bermuda: [
    { lat: 32.30, lon: -64.78, region: "Hamilton - North Atlantic" }
  ]
};

// ===========================
// ✅ Export global – zones Caraïbes / Amérique Centrale
// ===========================
export function getAllCaribbeanZones() {
  const all = [];
  for (const [country, zones] of Object.entries(CARIBBEAN_ZONES)) {
    for (const z of zones) {
      all.push({
        country,
        region: z.region,
        lat: z.lat,
        lon: z.lon,
        continent: "Central America / Caribbean"
      });
    }
  }
  return all;
}

export default { CARIBBEAN_ZONES, getAllCaribbeanZones };
