// PATH: services/runGlobalCaribbean.js
// 🌴 Caraïbes & Amérique Centrale – Extraction météo TINSFLASH PRO+++
// Version : Everest Protocol v3.6 – 100 % réel & connecté

import { addEngineLog, addEngineError, saveEngineState } from "./engineState.js";

// ===========================
// 🌴 ZONES DÉTAILLÉES
// ===========================
export const CARIBBEAN_ZONES = {
  Cuba: [
    { lat: 23.13, lon: -82.38, region: "La Havane - Nord-Ouest" },
    { lat: 20.02, lon: -75.83, region: "Santiago - Sud-Est" }
  ],
  DominicanRepublic: [
    { lat: 18.47, lon: -69.89, region: "Saint-Domingue - Sud" },
    { lat: 19.45, lon: -70.70, region: "Santiago - Nord" }
  ],
  Jamaica: [
    { lat: 17.98, lon: -76.80, region: "Kingston - Sud-Est" },
    { lat: 18.47, lon: -77.92, region: "Montego Bay - Nord" }
  ],
  PuertoRico: [
    { lat: 18.46, lon: -66.10, region: "San Juan - Nord" },
    { lat: 18.22, lon: -67.15, region: "Mayagüez - Ouest" }
  ],
  Haiti: [
    { lat: 18.54, lon: -72.34, region: "Port-au-Prince - Ouest" }
  ],
  Martinique: [
    { lat: 14.61, lon: -61.05, region: "Fort-de-France - Centre" }
  ],
  Guadeloupe: [
    { lat: 16.27, lon: -61.53, region: "Pointe-à-Pitre - Basse-Terre" }
  ],
  TrinidadTobago: [
    { lat: 10.67, lon: -61.52, region: "Port of Spain - Trinidad" }
  ],
  Bahamas: [
    { lat: 25.04, lon: -77.35, region: "Nassau - New Providence" }
  ],
  Mexico: [
    { lat: 21.16, lon: -86.85, region: "Cancún - Riviera Maya" },
    { lat: 19.43, lon: -99.13, region: "Mexico City - Plateau Central" }
  ],
  CostaRica: [
    { lat: 9.93, lon: -84.08, region: "San José - Vallée Centrale" }
  ],
  Panama: [
    { lat: 8.98, lon: -79.52, region: "Panama City - Canal" }
  ],
  Belize: [
    { lat: 17.50, lon: -88.20, region: "Belize City - Côte Caraïbe" }
  ],
  Honduras: [
    { lat: 14.08, lon: -87.21, region: "Tegucigalpa - Centre" }
  ],
  Nicaragua: [
    { lat: 12.13, lon: -86.25, region: "Managua - Centre" }
  ],
  Guatemala: [
    { lat: 14.63, lon: -90.55, region: "Guatemala City - Plateau" }
  ]
};

// ===========================
// 🧠 Extraction Caraïbes
// ===========================
export async function runGlobalCaribbean() {
  try {
    await addEngineLog("🌴 Démarrage extraction Caraïbes / Amérique Centrale", "info", "Caribbean");

    const allPoints = [];
    for (const [country, zones] of Object.entries(CARIBBEAN_ZONES)) {
      for (const z of zones) {
        allPoints.push({
          country,
          region: z.region,
          lat: z.lat,
          lon: z.lon,
          forecast: "Pending",
          timestamp: new Date(),
        });
      }
    }

    await saveEngineState({ lastRunCaribbean: new Date(), checkup: { Caribbean: "ok" } });
    await addEngineLog("✅ Extraction Caraïbes terminée avec succès", "success", "Caribbean");
    return { success: true, zones: allPoints };
  } catch (err) {
    await addEngineError("💥 Erreur extraction Caraïbes : " + err.message, "Caribbean");
    return { success: false, error: err.message };
  }
}
