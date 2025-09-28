// services/runGlobalEurope.js
// ⚡ RUN GLOBAL EUROPE — Zones couvertes (UE27 + UK + Norvège + Suisse + Ukraine)
// Découpage fin : reliefs, côtes, régions climatiques

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { runSuperForecastGlobal } from "./superForecast.js"; // ✅ aligné avec export
import { processAlerts } from "./alertsService.js";

// ===========================
// Zones détaillées par pays
// ===========================
const EUROPE_ZONES = {
  Belgium: [
    { lat: 50.85, lon: 4.35, region: "Brussels-Central" },
    { lat: 51.22, lon: 4.40, region: "North-Sea-Coast" },
    { lat: 50.47, lon: 4.87, region: "Condroz" },
    { lat: 50.25, lon: 5.57, region: "Ardennes" }
  ],
  France: [
    { lat: 48.85, lon: 2.35, region: "Île-de-France" },
    { lat: 43.6, lon: 1.44, region: "Southwest - Toulouse" },
    { lat: 45.76, lon: 4.84, region: "Central-East - Lyon" },
    { lat: 43.29, lon: 5.37, region: "Mediterranean - Provence" },
    { lat: 44.83, lon: -0.57, region: "West - Bordeaux/Atlantique" },
    { lat: 42.70, lon: 2.90, region: "Pyrénées" },
    { lat: 45.90, lon: 6.12, region: "Alpes" },
    { lat: 45.04, lon: 3.88, region: "Massif-Central" },
    { lat: 48.11, lon: -1.68, region: "Bretagne" }
  ],
  Germany: [
    { lat: 52.52, lon: 13.40, region: "Berlin - East" },
    { lat: 50.11, lon: 8.68, region: "Frankfurt - Central" },
    { lat: 48.13, lon: 11.58, region: "Munich - Bavaria" },
    { lat: 53.55, lon: 9.99, region: "Hamburg - North" },
    { lat: 51.45, lon: 7.01, region: "Ruhr - Industrial" },
    { lat: 47.57, lon: 10.70, region: "Alpes-Bavaroises" },
    { lat: 48.00, lon: 8.23, region: "Forêt-Noire" }
  ],
  Spain: [
    { lat: 40.41, lon: -3.70, region: "Madrid - Central Meseta" },
    { lat: 41.38, lon: 2.17, region: "Barcelona - Catalonia" },
    { lat: 36.72, lon: -4.42, region: "Andalusia - Malaga" },
    { lat: 43.26, lon: -2.93, region: "North - Basque Country" },
    { lat: 42.81, lon: -1.65, region: "Pyrenees" },
    { lat: 39.57, lon: 2.65, region: "Balearic Islands" },
    { lat: 28.12, lon: -15.43, region: "Canary Islands" }
  ],
  Italy: [
    { lat: 45.46, lon: 9.19, region: "North - Milan" },
    { lat: 41.90, lon: 12.50, region: "Central - Rome" },
    { lat: 40.85, lon: 14.27, region: "South - Naples" },
    { lat: 44.49, lon: 11.34, region: "North-East - Bologna" },
    { lat: 43.71, lon: 10.40, region: "Tuscany - Florence" },
    { lat: 46.50, lon: 11.35, region: "Dolomites" },
    { lat: 37.60, lon: 14.02, region: "Sicily - Etna" },
    { lat: 40.12, lon: 9.01, region: "Sardinia" }
  ],
  Switzerland: [
    { lat: 46.95, lon: 7.44, region: "Central - Bern" },
    { lat: 46.20, lon: 6.15, region: "West - Geneva" },
    { lat: 47.37, lon: 8.54, region: "North - Zurich" },
    { lat: 46.01, lon: 8.96, region: "South - Ticino" },
    { lat: 46.87, lon: 9.53, region: "Alpes-Grisons" }
  ],
  Austria: [
    { lat: 48.21, lon: 16.37, region: "Vienna - East" },
    { lat: 47.80, lon: 13.04, region: "Salzburg - Alps" },
    { lat: 47.07, lon: 15.44, region: "Graz - South" },
    { lat: 47.27, lon: 11.40, region: "Tyrol - Innsbruck" }
  ],
  Norway: [
    { lat: 59.91, lon: 10.75, region: "Oslo - South" },
    { lat: 63.43, lon: 10.39, region: "Trondheim - Central" },
    { lat: 69.65, lon: 18.95, region: "Tromsø - North" },
    { lat: 67.28, lon: 14.40, region: "Lofoten Islands" }
  ],
  Sweden: [
    { lat: 59.33, lon: 18.06, region: "Stockholm - South" },
    { lat: 57.71, lon: 11.97, region: "Gothenburg - West Coast" },
    { lat: 63.83, lon: 20.25, region: "Umeå - North" },
    { lat: 67.85, lon: 20.23, region: "Kiruna - Arctic" }
  ],
  Finland: [
    { lat: 60.17, lon: 24.94, region: "Helsinki - South" },
    { lat: 62.24, lon: 25.75, region: "Jyväskylä - Central" },
    { lat: 65.01, lon: 25.47, region: "Oulu - North" },
    { lat: 66.50, lon: 25.72, region: "Lapland - Rovaniemi" }
  ],
  Ukraine: [
    { lat: 50.45, lon: 30.52, region: "Kyiv - Central" },
    { lat: 48.62, lon: 22.30, region: "West - Uzhhorod" },
    { lat: 46.48, lon: 30.73, region: "South - Odessa" },
    { lat: 49.99, lon: 36.23, region: "East - Kharkiv" },
    { lat: 47.90, lon: 33.38, region: "Dnipropetrovsk" }
  ],
  UnitedKingdom: [
    { lat: 51.50, lon: -0.12, region: "South - London" },
    { lat: 55.95, lon: -3.18, region: "North - Edinburgh" },
    { lat: 53.48, lon: -2.24, region: "West - Manchester" },
    { lat: 51.48, lon: -3.18, region: "Wales - Cardiff" },
    { lat: 54.60, lon: -5.93, region: "Northern Ireland - Belfast" }
  ],
  Ireland: [
    { lat: 53.34, lon: -6.26, region: "East - Dublin" },
    { lat: 52.66, lon: -8.62, region: "West - Limerick" },
    { lat: 51.90, lon: -8.47, region: "South - Cork" }
  ],
  Portugal: [
    { lat: 38.72, lon: -9.13, region: "Lisbon - West" },
    { lat: 41.15, lon: -8.61, region: "North - Porto" },
    { lat: 37.01, lon: -7.93, region: "South - Algarve" },
    { lat: 32.65, lon: -16.91, region: "Madeira" },
    { lat: 37.74, lon: -25.67, region: "Azores" }
  ]
  // ⚡ TODO: ajouter Croatie, Slovénie, Roumanie, Pologne, Pays Baltes…
};

// ==================================
// RUN GLOBAL EUROPE
// ==================================
export async function runGlobalEurope() {
  const state = getEngineState();
  try {
    addEngineLog("🌍 Démarrage du RUN GLOBAL EUROPE (zones couvertes complètes)…");
    state.runTime = new Date().toISOString();
    state.checkup = { models: "PENDING", localForecasts: "PENDING", nationalForecasts: "PENDING", aiAlerts: "PENDING" };
    saveEngineState(state);

    const byCountry = {};
    let successCount = 0;
    let totalPoints = 0;

    for (const [country, zones] of Object.entries(EUROPE_ZONES)) {
      byCountry[country] = { regions: [] };
      for (const z of zones) {
        try {
          const res = await runSuperForecastGlobal({ lat: z.lat, lon: z.lon, country, region: z.region });
          byCountry[country].regions.push({ ...z, forecast: res?.forecast });
          successCount++;
          totalPoints++;
          addEngineLog(`✅ ${country} — ${z.region}`);
        } catch (e) {
          addEngineError(`❌ ${country} — ${z.region}: ${e.message}`);
          totalPoints++;
        }
      }
    }

    state.zonesCoveredEurope = byCountry;
    state.zonesCoveredSummaryEurope = { countries: Object.keys(byCountry).length, points: totalPoints, success: successCount };
    state.checkup.models = "OK";
    state.checkup.localForecasts = successCount > 0 ? "OK" : "FAIL";
    state.checkup.nationalForecasts = Object.keys(byCountry).length > 0 ? "OK" : "FAIL";
    saveEngineState(state);

    const alertsResult = await processAlerts();
    state.checkup.aiAlerts = alertsResult?.error ? "FAIL" : "OK";
    state.checkup.engineStatus = "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN GLOBAL EUROPE terminé");
    return { summary: state.zonesCoveredSummaryEurope, alerts: alertsResult || {} };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL EUROPE");
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineLog("❌ RUN GLOBAL EUROPE en échec");
    return { error: err.message };
  }
}
