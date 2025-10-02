// services/runContinental.js
// ⚡ Centrale nucléaire météo – RUN Continental (zones non couvertes)
// ⚠️ IMPORTANT : Ces prévisions ne sont PAS issues de notre moteur TINSFLASH
// mais d'un fallback open-data (ex: OpenWeather). Elles servent uniquement d'aperçu.
// Les alertes générées sont continentales, de niveau simplifié.

import { runSuperForecast } from "./superForecast.js";
import { generateAlerts } from "./alertsService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// === Zones continentales simplifiées ===
// (à enrichir progressivement)
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

// ===========================
// 1️⃣ Prévisions continentales (fallback)
// ===========================
export async function runContinentalForecasts() {
  const state = getEngineState();
  state.checkup = state.checkup || {};
  addEngineLog("🌐 Démarrage Prévisions Continentales (fallback open-data)…");

  const byContinent = {};
  let successCount = 0, totalPoints = 0;

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

        byContinent[continent].regions.push({ 
          ...z, 
          forecast: res?.forecast || {}, 
          source: "fallback"  // 🔥 important : pas notre machine !
        });

        successCount++; totalPoints++;
        addEngineLog(`⚠️ [Fallback] Prévisions ${continent} — ${z.region}`);
      } catch (e) {
        addEngineError(`❌ Prévisions ${continent} — ${z.region}: ${e.message}`);
        totalPoints++;
      }
    }
  }

  state.zonesCoveredContinental = byContinent;
  state.zonesCoveredSummaryContinental = {
    continents: Object.keys(byContinent).length,
    points: totalPoints,
    success: successCount,
    note: "⚠️ Données fallback hors zones couvertes TINSFLASH"
  };
  state.checkup.forecastsContinental = successCount > 0 ? "OK" : "FAIL";
  saveEngineState(state);

  addEngineLog("✅ Prévisions Continentales (fallback) terminées.");
  return { summary: state.zonesCoveredSummaryContinental };
}

// ===========================
// 2️⃣ Alertes continentales (simplifiées)
// ===========================
export async function runContinentalAlerts() {
  const state = getEngineState();
  state.checkup = state.checkup || {};
  addEngineLog("🚨 Démarrage Alertes Continentales (simplifiées)…");

  if (!state.zonesCoveredContinental) {
    addEngineError("❌ Impossible de générer les alertes : pas de prévisions continentales disponibles.");
    return;
  }

  const alertsByContinent = {};
  for (const [continent, data] of Object.entries(state.zonesCoveredContinental)) {
    alertsByContinent[continent] = [];
    for (const regionData of data.regions) {
      try {
        const alert = await generateAlerts(
          regionData.lat,
          regionData.lon,
          continent,
          regionData.region,
          "Continental"
        );

        alertsByContinent[continent].push({ 
          region: regionData.region, 
          alert, 
          source: "fallback"  // 🔥 bien marqué
        });

        addEngineLog(`🚨 [Fallback] Alerte ${continent} — ${regionData.region}`);
      } catch (e) {
        addEngineError(`❌ Alerte ${continent} — ${regionData.region}: ${e.message}`);
      }
    }
  }

  state.alertsContinental = alertsByContinent;
  state.checkup.alertsContinental = "OK";
  saveEngineState(state);

  addEngineLog("✅ Alertes Continentales terminées.");
  return alertsByContinent;
}

// ===========================
// 3️⃣ Run complet Continental
// ===========================
export async function runContinental() {
  const state = getEngineState();
  try {
    addEngineLog("🌐 Démarrage RUN Continental (prévisions + alertes, fallback)…");
    state.checkup.engineStatusContinental = "PENDING";
    saveEngineState(state);

    // 1. Prévisions fallback
    await runContinentalForecasts();

    // 2. Alertes fallback
    await runContinentalAlerts();

    state.checkup.engineStatusContinental = "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN Continental complet terminé avec succès (fallback).");
    return {
      forecasts: state.zonesCoveredSummaryContinental,
      alerts: state.alertsContinental ? "OK" : "FAIL",
      source: "fallback"
    };
  } catch (err) {
    addEngineError("❌ Erreur RUN Continental: " + err.message);
    state.checkup.engineStatusContinental = "FAIL";
    saveEngineState(state);
    throw err;
  }
}
