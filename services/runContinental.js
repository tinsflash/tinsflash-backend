// services/runContinental.js
// ⚡ Centrale nucléaire météo – RUN Continental (zones non couvertes)
// ⚠️ Ces prévisions ne proviennent PAS du moteur TINSFLASH
// mais d’un fallback open-data (ex: OpenWeather). Usage informatif uniquement.

import { runSuperForecast } from "./superForecast.js";
import { generateAlerts } from "./alertsService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// ===========================
// 🔹 Mini-limiteur interne (aucune dépendance externe)
// ===========================
async function limitConcurrency(tasks, limit = 2) {
  const results = [];
  const queue = [...tasks];
  const workers = new Array(Math.min(limit, tasks.length)).fill(null).map(async () => {
    while (queue.length) {
      const t = queue.shift();
      try {
        results.push(await t());
      } catch (e) {
        results.push({ error: e });
      }
    }
  });
  await Promise.all(workers);
  return results;
}

// ===========================
// 🌍 Zones continentales simplifiées
// ===========================
export const CONTINENTAL_ZONES = {
  Africa: [
    { region: "North", lat: 30.0444, lon: 31.2357 },   // Le Caire
    { region: "South", lat: -26.2041, lon: 28.0473 },  // Johannesburg
  ],
  Asia: [
    { region: "East", lat: 35.6895, lon: 139.6917 },   // Tokyo
    { region: "South", lat: 28.6139, lon: 77.2090 },   // New Delhi
  ],
  SouthAmerica: [
    { region: "East", lat: -23.5505, lon: -46.6333 },  // São Paulo
    { region: "South", lat: -34.6037, lon: -58.3816 }, // Buenos Aires
  ],
  Oceania: [
    { region: "East", lat: -33.8688, lon: 151.2093 },  // Sydney
    { region: "South", lat: -41.2865, lon: 174.7762 }, // Wellington
  ],
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

    const tasks = zones.map(z => async () => {
      try {
        const res = await runSuperForecast({
          lat: z.lat,
          lon: z.lon,
          country: continent,
          region: z.region,
        });
        byContinent[continent].regions.push({
          ...z,
          forecast: res?.forecast || {},
          source: "fallback",
        });
        successCount++;
        addEngineLog(`⚠️ [Fallback] Prévision ${continent} — ${z.region}`);
      } catch (e) {
        addEngineError(`❌ Prévision ${continent} — ${z.region}: ${e.message}`);
      } finally {
        totalPoints++;
      }
    });

    await limitConcurrency(tasks, 3);
  }

  state.zonesCoveredContinental = byContinent;
  state.zonesCoveredSummaryContinental = {
    continents: Object.keys(byContinent).length,
    points: totalPoints,
    success: successCount,
    note: "⚠️ Données fallback hors zones couvertes TINSFLASH",
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
    addEngineError("❌ Impossible de générer les alertes : aucune prévision continentale disponible.");
    return;
  }

  const alertsByContinent = {};

  for (const [continent, data] of Object.entries(state.zonesCoveredContinental)) {
    alertsByContinent[continent] = [];

    const tasks = data.regions.map(regionData => async () => {
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
          source: "fallback",
        });
        addEngineLog(`🚨 [Fallback] Alerte ${continent} — ${regionData.region}`);
      } catch (e) {
        addEngineError(`❌ Alerte ${continent} — ${regionData.region}: ${e.message}`);
      }
    });

    await limitConcurrency(tasks, 3);
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
    addEngineLog("🌐 Lancement RUN Continental (prévisions + alertes, fallback)...");
    state.checkup.engineStatusContinental = "PENDING";
    saveEngineState(state);

    await runContinentalForecasts();
    await runContinentalAlerts();

    state.checkup.engineStatusContinental = "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN Continental terminé avec succès (fallback).");
    return {
      forecasts: state.zonesCoveredSummaryContinental,
      alerts: state.alertsContinental ? "OK" : "FAIL",
      source: "fallback",
    };
  } catch (err) {
    addEngineError("❌ Erreur RUN Continental: " + err.message);
    state.checkup.engineStatusContinental = "FAIL";
    saveEngineState(state);
    throw err;
  }
}
