// services/runContinental.js
// ⚡ Centrale nucléaire météo – RUN Continental (zones non couvertes)
// Génère uniquement des prévisions brutes par continent
// Les alertes sont gérées ensuite par runGlobal.js

import { runSuperForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// === Exemple de zones continentales (fallback open-data ou simplifiées) ===
// ⚠️ À enrichir progressivement (Afrique, Asie, Amérique du Sud, Océanie, etc.)
export const CONTINENTAL_ZONES = {
  Africa: [
    { region: "North", lat: 30.0444, lon: 31.2357 },   // Le Caire
    { region: "South", lat: -26.2041, lon: 28.0473 }, // Johannesburg
  ],
  Asia: [
    { region: "East", lat: 35.6895, lon: 139.6917 },  // Tokyo
    { region: "South", lat: 28.6139, lon: 77.209 },   // New Delhi
  ],
  SouthAmerica: [
    { region: "East", lat: -23.5505, lon: -46.6333 }, // São Paulo
    { region: "South", lat: -34.6037, lon: -58.3816 },// Buenos Aires
  ],
  Oceania: [
    { region: "East", lat: -33.8688, lon: 151.2093 }, // Sydney
    { region: "South", lat: -41.2865, lon: 174.7762 },// Wellington
  ]
};

export async function runContinental() {
  const state = getEngineState();
  try {
    state.checkup = state.checkup || {};   // 🔒 Sécurité
    addEngineLog("🌐 Démarrage du RUN Continental (zones non couvertes)...");
    state.runTime = new Date().toISOString();

    const byContinent = {};
    let successCount = 0;
    let totalPoints = 0;

    for (const [continent, zones] of Object.entries(CONTINENTAL_ZONES)) {
      byContinent[continent] = { regions: [] };
      for (const z of zones) {
        try {
          const res = await runSuperForecast({
            lat: z.lat,
            lon: z.lon,
            country: continent,
            region: z.region
          });
          byContinent[continent].regions.push({ ...z, forecast: res?.forecast });
          successCount++; totalPoints++;
          addEngineLog(`✅ ${continent} — ${z.region}`);
        } catch (e) {
          addEngineError(`❌ ${continent} — ${z.region}: ${e.message}`);
          totalPoints++;
        }
      }
    }

    state.zonesCoveredContinental = byContinent;
    state.zonesCoveredSummaryContinental = {
      continents: Object.keys(byContinent).length,
      points: totalPoints,
      success: successCount
    };
    state.checkup.engineStatus = "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN Continental terminé avec succès.");
    return { summary: state.zonesCoveredSummaryContinental };
  } catch (err) {
    state.checkup = state.checkup || {};   // 🔒 Sécurité
    addEngineError("❌ Erreur RUN Continental: " + err.message);
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    throw err;
  }
}
