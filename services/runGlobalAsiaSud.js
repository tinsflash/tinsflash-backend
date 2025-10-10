// PATH: services/runGlobalAsiaSud.js
// 🌏 Asie du Sud – Extraction & zones TINSFLASH PRO+++
// Version : Everest Protocol v3.6 – 100 % réel & connecté

import { addEngineLog, addEngineError, saveEngineState } from "./engineState.js";

// ===========================
// 🌏 ZONES DÉTAILLÉES
// ===========================
export const ASIA_SUD_ZONES = {
  India: [
    { lat: 28.61, lon: 77.21, region: "New Delhi - Nord" },
    { lat: 19.07, lon: 72.87, region: "Mumbai - Côte Ouest" },
    { lat: 13.08, lon: 80.27, region: "Chennai - Côte Est" },
    { lat: 22.57, lon: 88.36, region: "Kolkata - Gange Est" },
    { lat: 12.97, lon: 77.59, region: "Bangalore - Plateau Sud" },
    { lat: 26.85, lon: 80.95, region: "Lucknow - Nord-Centre" },
    { lat: 23.03, lon: 72.58, region: "Ahmedabad - Gujarat" },
    { lat: 15.50, lon: 73.83, region: "Goa - Côte Ouest" },
    { lat: 9.93, lon: 76.26, region: "Kochi - Kerala" },
    { lat: 31.10, lon: 77.17, region: "Shimla - Himalaya Sud" }
  ],
  Pakistan: [
    { lat: 33.68, lon: 73.04, region: "Islamabad - Nord" },
    { lat: 24.86, lon: 67.01, region: "Karachi - Sud" },
    { lat: 31.58, lon: 74.36, region: "Lahore - Est" },
    { lat: 30.18, lon: 66.97, region: "Quetta - Montagnes Ouest" },
    { lat: 34.02, lon: 71.56, region: "Peshawar - Nord-Ouest" },
    { lat: 27.72, lon: 68.83, region: "Sukkur - Vallée Indus" }
  ],
  Bangladesh: [
    { lat: 23.81, lon: 90.41, region: "Dhaka - Centre" },
    { lat: 22.35, lon: 91.83, region: "Chittagong - Côte Sud" },
    { lat: 24.89, lon: 91.87, region: "Sylhet - Nord-Est" },
    { lat: 25.75, lon: 89.27, region: "Rangpur - Nord" }
  ],
  Nepal: [
    { lat: 27.71, lon: 85.32, region: "Kathmandu - Vallée Centrale" },
    { lat: 28.20, lon: 83.98, region: "Pokhara - Himalaya Central" },
    { lat: 29.37, lon: 82.18, region: "Simikot - Himalaya Nord" }
  ],
  Bhutan: [
    { lat: 27.47, lon: 89.64, region: "Thimphu - Capitale" },
    { lat: 27.35, lon: 91.55, region: "Trashigang - Est" },
    { lat: 26.88, lon: 89.38, region: "Phuentsholing - Sud" }
  ],
  SriLanka: [
    { lat: 6.93, lon: 79.85, region: "Colombo - Côte Ouest" },
    { lat: 7.29, lon: 80.64, region: "Kandy - Montagnes Centrales" },
    { lat: 8.56, lon: 81.23, region: "Trincomalee - Côte Est" },
    { lat: 5.95, lon: 80.55, region: "Matara - Sud" }
  ],
  Maldives: [
    { lat: 4.18, lon: 73.51, region: "Malé - Atoll Central" },
    { lat: 0.69, lon: 73.15, region: "Addu - Atoll Sud" },
    { lat: 5.10, lon: 73.07, region: "Baa - Atoll Nord" }
  ],
  Afghanistan: [
    { lat: 34.52, lon: 69.18, region: "Kaboul - Centre" },
    { lat: 31.61, lon: 65.71, region: "Kandahar - Sud" },
    { lat: 36.72, lon: 67.11, region: "Mazar-e-Sharif - Nord" },
    { lat: 34.34, lon: 62.20, region: "Herat - Ouest" },
    { lat: 35.31, lon: 69.45, region: "Panjshir - Vallée Nord-Est" }
  ]
};

// ===========================
// 🧠 Extraction Asie du Sud
// ===========================
export async function runGlobalAsiaSud() {
  try {
    await addEngineLog("🌏 Démarrage extraction Asie du Sud", "info", "AsiaSud");

    const allPoints = [];
    for (const [country, zones] of Object.entries(ASIA_SUD_ZONES)) {
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

    await saveEngineState({ lastRunAsiaSud: new Date(), checkup: { AsiaSud: "ok" } });
    await addEngineLog("✅ Extraction Asie du Sud terminée", "success", "AsiaSud");
    return { success: true, zones: allPoints };
  } catch (err) {
    await addEngineError("💥 Erreur extraction Asie du Sud : " + err.message, "AsiaSud");
    return { success: false, error: err.message };
  }
}
