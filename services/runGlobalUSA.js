// ==========================================================
// 🇺🇸 TINSFLASH – runGlobalUSA.js (Everest Protocol v5.1.7 PRO+++)
// ==========================================================
// 🔸 Phase 1 : Extraction pure (physique, sans IA)
// 🔸 Objectif : Couverture USA complète + zones stratégiques (aéroports, NASA, SpaceX)
// ==========================================================

import { superForecast } from "./superForecast.js";
import { addEngineLog, updateEngineState, setLastExtraction } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js";
import fs from "fs";

export async function runGlobalUSA() {
  try {
    await addEngineLog("🇺🇸 Phase 1 – Extraction USA lancée...", "info", "runGlobalUSA");
    await updateEngineState("running", "runGlobalUSA");

    // ==========================================================
    // 🗺️ Zones stratégiques par État (capitale + zones à risque + aéroports + NASA/SpaceX)
    // ==========================================================
    const zones = [
      // --- CÔTE EST ---
      { region: "New York", lat: 40.7128, lon: -74.006, country: "USA" },
      { region: "Boston", lat: 42.3601, lon: -71.0589, country: "USA" },
      { region: "Washington D.C.", lat: 38.9072, lon: -77.0369, country: "USA" },
      { region: "Miami (Hurricane zone)", lat: 25.7617, lon: -80.1918, country: "USA" },
      { region: "Orlando – NASA Kennedy Space Center", lat: 28.5721, lon: -80.648, country: "USA" },
      { region: "Atlanta", lat: 33.749, lon: -84.388, country: "USA" },
      { region: "Charlotte", lat: 35.2271, lon: -80.8431, country: "USA" },
      { region: "Philadelphia", lat: 39.9526, lon: -75.1652, country: "USA" },

      // --- MIDWEST ---
      { region: "Chicago – O’Hare Airport", lat: 41.9742, lon: -87.9073, country: "USA" },
      { region: "Detroit", lat: 42.3314, lon: -83.0458, country: "USA" },
      { region: "Minneapolis", lat: 44.9778, lon: -93.265, country: "USA" },
      { region: "St. Louis", lat: 38.627, lon: -90.1994, country: "USA" },
      { region: "Cleveland", lat: 41.4993, lon: -81.6944, country: "USA" },
      { region: "Kansas City", lat: 39.0997, lon: -94.5786, country: "USA" },

      // --- CÔTE OUEST ---
      { region: "Los Angeles – LAX", lat: 33.9416, lon: -118.4085, country: "USA" },
      { region: "San Francisco – Bay Area", lat: 37.7749, lon: -122.4194, country: "USA" },
      { region: "Seattle", lat: 47.6062, lon: -122.3321, country: "USA" },
      { region: "San Diego", lat: 32.7157, lon: -117.1611, country: "USA" },
      { region: "Portland", lat: 45.5051, lon: -122.675, country: "USA" },
      { region: "Las Vegas", lat: 36.1699, lon: -115.1398, country: "USA" },
      { region: "Phoenix", lat: 33.4484, lon: -112.074, country: "USA" },
      { region: "Denver", lat: 39.7392, lon: -104.9903, country: "USA" },

      // --- SUD ET CENTRE ---
      { region: "Houston – NASA Johnson Space Center", lat: 29.5502, lon: -95.097, country: "USA" },
      { region: "Dallas", lat: 32.7767, lon: -96.797, country: "USA" },
      { region: "Austin", lat: 30.2672, lon: -97.7431, country: "USA" },
      { region: "New Orleans (Hurricane zone)", lat: 29.9511, lon: -90.0715, country: "USA" },
      { region: "Oklahoma City", lat: 35.4676, lon: -97.5164, country: "USA" },

      // --- ROCHEUSES & DÉSERTS ---
      { region: "Salt Lake City", lat: 40.7608, lon: -111.891, country: "USA" },
      { region: "Boise", lat: 43.615, lon: -116.2023, country: "USA" },
      { region: "Albuquerque", lat: 35.0844, lon: -106.6504, country: "USA" },
      { region: "El Paso", lat: 31.7619, lon: -106.485, country: "USA" },
      { region: "Tucson", lat: 32.2226, lon: -110.9747, country: "USA" },

      // --- ALASKA & HAWAII ---
      { region: "Anchorage – Alaska", lat: 61.2181, lon: -149.9, country: "USA" },
      { region: "Fairbanks", lat: 64.8378, lon: -147.7164, country: "USA" },
      { region: "Honolulu – Hawaii", lat: 21.3069, lon: -157.8583, country: "USA" },

      // --- BASES NASA / SPACEX ---
      { region: "Cape Canaveral – SpaceX Launch Complex 39A", lat: 28.6084, lon: -80.6043, country: "USA" },
      { region: "Vandenberg Space Force Base", lat: 34.742, lon: -120.5724, country: "USA" },
      { region: "Edwards Air Force Base", lat: 34.9054, lon: -117.883, country: "USA" },
      { region: "White Sands Missile Range", lat: 32.4, lon: -106.5, country: "USA" },
      { region: "SpaceX Boca Chica", lat: 25.9971, lon: -97.155, country: "USA" },
    ];

    // ==========================================================
    // 🚀 Lancement extraction
    // ==========================================================
    const result = await superForecast({ zones, runType: "global-usa", withAI: false });

    // Sauvegarde locale
    const filePath = "./data/usa.json";
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

    // Sauvegarde Mongo Cloud
    await saveExtractionToMongo({
      id: `USA-${Date.now()}`,
      region: "USA",
      zones: zones.map((z) => z.region),
      data: result,
      timestamp: new Date().toISOString(),
    });

    await setLastExtraction("runGlobalUSA");
    await updateEngineState("ok", "runGlobalUSA");
    await addEngineLog(`✅ USA sauvegardé sur Mongo : ${zones.length} zones`, "success", "runGlobalUSA");
    return { success: true };
  } catch (err) {
    await addEngineLog(`❌ Erreur runGlobalUSA : ${err.message}`, "error", "runGlobalUSA");
    await updateEngineState("fail", "runGlobalUSA");
    return { success: false, error: err.message };
  }
}

export default { runGlobalUSA };
