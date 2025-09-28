// services/runGlobalUSA.js
// ⚡ RUN GLOBAL USA — Zones couvertes par État
// Division fine : grandes villes, reliefs, côtes, régions stratégiques (NASA, ouragans, etc.)

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { runSuperForecastGlobal } from "./superForecast.js"; // ✅ aligné avec export
import { processAlerts } from "./alertsService.js";

// ===========================
// Zones détaillées par État
// ===========================
const USA_ZONES = {
  California: [
    { lat: 34.05, lon: -118.24, region: "South - Los Angeles" },
    { lat: 37.77, lon: -122.42, region: "North - San Francisco" },
    { lat: 36.77, lon: -119.42, region: "Central - Fresno" },
    { lat: 32.83, lon: -117.13, region: "South Coast - San Diego" }
  ],
  Texas: [
    { lat: 29.76, lon: -95.37, region: "East - Houston" },
    { lat: 32.78, lon: -96.80, region: "North - Dallas" },
    { lat: 29.42, lon: -98.49, region: "Central - San Antonio" },
    { lat: 31.76, lon: -106.48, region: "West - El Paso" }
  ],
  Florida: [
    { lat: 25.76, lon: -80.19, region: "South - Miami" },
    { lat: 28.54, lon: -81.38, region: "Central - Orlando" },
    { lat: 30.33, lon: -81.65, region: "North - Jacksonville" },
    { lat: 28.39, lon: -80.60, region: "Cape Canaveral - NASA" }
  ],
  Alaska: [
    { lat: 61.22, lon: -149.90, region: "South - Anchorage" },
    { lat: 64.84, lon: -147.72, region: "Interior - Fairbanks" },
    { lat: 71.29, lon: -156.76, region: "North - Utqiagvik" },
    { lat: 58.30, lon: -134.42, region: "Southeast - Juneau" }
  ],
  NewYork: [
    { lat: 40.71, lon: -74.00, region: "South - NYC" },
    { lat: 42.65, lon: -73.75, region: "Capital - Albany" },
    { lat: 43.16, lon: -77.61, region: "West - Rochester" },
    { lat: 42.89, lon: -78.88, region: "Buffalo - Great Lakes" }
  ],
  Ohio: [{ lat: 39.96, lon: -82.99, region: "Columbus - Central" }],
  Illinois: [
    { lat: 41.88, lon: -87.62, region: "Chicago - North" },
    { lat: 39.78, lon: -89.65, region: "Springfield - Central" }
  ],
  Pennsylvania: [
    { lat: 39.95, lon: -75.16, region: "Philadelphia - East" },
    { lat: 40.27, lon: -76.88, region: "Harrisburg - Central" },
    { lat: 40.44, lon: -79.99, region: "Pittsburgh - West" }
  ],
  Washington: [
    { lat: 47.61, lon: -122.33, region: "Seattle - Coast" },
    { lat: 46.60, lon: -120.51, region: "Yakima - Inland" }
  ],
  Colorado: [
    { lat: 39.74, lon: -104.99, region: "Denver - Central" },
    { lat: 38.83, lon: -104.82, region: "Colorado Springs - South" }
  ],
  Arizona: [
    { lat: 33.45, lon: -112.07, region: "Phoenix - Central" },
    { lat: 35.20, lon: -111.65, region: "Flagstaff - Highlands" }
  ],
  Alabama: [{ lat: 32.36, lon: -86.30, region: "Montgomery" }],
  Arkansas: [{ lat: 34.75, lon: -92.29, region: "Little Rock" }],
  Connecticut: [{ lat: 41.77, lon: -72.67, region: "Hartford" }],
  Delaware: [{ lat: 39.16, lon: -75.52, region: "Dover" }],
  Georgia: [{ lat: 33.75, lon: -84.39, region: "Atlanta" }],
  Hawaii: [{ lat: 21.30, lon: -157.85, region: "Honolulu" }],
  Indiana: [{ lat: 39.77, lon: -86.16, region: "Indianapolis" }],
  Iowa: [{ lat: 41.59, lon: -93.62, region: "Des Moines" }],
  Kansas: [{ lat: 39.05, lon: -95.69, region: "Topeka" }],
  Kentucky: [{ lat: 38.20, lon: -84.87, region: "Frankfort" }],
  Louisiana: [{ lat: 30.45, lon: -91.19, region: "Baton Rouge" }],
  Maine: [{ lat: 44.31, lon: -69.78, region: "Augusta" }],
  Maryland: [{ lat: 38.98, lon: -76.49, region: "Annapolis" }],
  Massachusetts: [{ lat: 42.36, lon: -71.06, region: "Boston" }],
  Michigan: [
    { lat: 42.73, lon: -84.55, region: "Lansing - Central" },
    { lat: 42.33, lon: -83.05, region: "Detroit - South-East" }
  ],
  Minnesota: [{ lat: 44.95, lon: -93.09, region: "Saint Paul" }],
  Mississippi: [{ lat: 32.29, lon: -90.18, region: "Jackson" }],
  Missouri: [{ lat: 38.58, lon: -92.17, region: "Jefferson City" }],
  Montana: [{ lat: 46.59, lon: -112.02, region: "Helena" }],
  Nebraska: [{ lat: 40.81, lon: -96.70, region: "Lincoln" }],
  Nevada: [{ lat: 39.16, lon: -119.77, region: "Carson City" }],
  NewJersey: [{ lat: 40.22, lon: -74.74, region: "Trenton" }],
  NewMexico: [{ lat: 35.69, lon: -105.94, region: "Santa Fe" }],
  NorthCarolina: [{ lat: 35.77, lon: -78.64, region: "Raleigh" }],
  NorthDakota: [{ lat: 46.81, lon: -100.78, region: "Bismarck" }],
  Oklahoma: [{ lat: 35.47, lon: -97.52, region: "Oklahoma City" }],
  Oregon: [{ lat: 44.94, lon: -123.03, region: "Salem" }],
  RhodeIsland: [{ lat: 41.82, lon: -71.41, region: "Providence" }],
  SouthCarolina: [{ lat: 34.00, lon: -81.03, region: "Columbia" }],
  SouthDakota: [{ lat: 44.37, lon: -100.35, region: "Pierre" }],
  Tennessee: [{ lat: 36.16, lon: -86.78, region: "Nashville" }],
  Utah: [{ lat: 40.76, lon: -111.89, region: "Salt Lake City" }],
  Vermont: [{ lat: 44.26, lon: -72.58, region: "Montpelier" }],
  Virginia: [
    { lat: 37.54, lon: -77.44, region: "Richmond - Central" },
    { lat: 38.92, lon: -77.07, region: "Washington D.C. Metro" }
  ],
  WashingtonDC: [{ lat: 38.90, lon: -77.04, region: "Capital" }],
  WestVirginia: [{ lat: 38.35, lon: -81.63, region: "Charleston" }],
  Wisconsin: [{ lat: 43.07, lon: -89.40, region: "Madison" }],
  Wyoming: [{ lat: 41.14, lon: -104.82, region: "Cheyenne" }]
};

// ==================================
// RUN GLOBAL USA
// ==================================
export async function runGlobalUSA() {
  const state = getEngineState();
  try {
    addEngineLog("🇺🇸 Démarrage du RUN GLOBAL USA (zones par État)…");
    state.runTime = new Date().toISOString();
    state.checkup = {
      models: "PENDING",
      localForecasts: "PENDING",
      nationalForecasts: "PENDING",
      aiAlerts: "PENDING"
    };
    saveEngineState(state);

    const byState = {};
    let successCount = 0;
    let totalPoints = 0;

    for (const [stateName, zones] of Object.entries(USA_ZONES)) {
      byState[stateName] = { regions: [] };
      for (const z of zones) {
        try {
          const res = await runSuperForecastGlobal({
            lat: z.lat,
            lon: z.lon,
            country: "USA",
            region: `${stateName} - ${z.region}`
          });
          byState[stateName].regions.push({ ...z, forecast: res?.forecast });
          successCount++;
          totalPoints++;
          addEngineLog(`✅ ${stateName} — ${z.region}`);
        } catch (e) {
          addEngineError(`❌ ${stateName} — ${z.region}: ${e.message}`);
          totalPoints++;
        }
      }
    }

    state.zonesCoveredUSA = byState;
    state.zonesCoveredSummaryUSA = {
      states: Object.keys(byState).length,
      points: totalPoints,
      success: successCount
    };
    state.checkup.models = "OK";
    state.checkup.localForecasts = successCount > 0 ? "OK" : "FAIL";
    state.checkup.nationalForecasts =
      Object.keys(byState).length > 0 ? "OK" : "FAIL";
    saveEngineState(state);

    const alertsResult = await processAlerts();
    state.checkup.aiAlerts = alertsResult?.status || "OK";

    saveEngineState(state);
    addEngineLog("✅ RUN GLOBAL USA terminé avec succès.");
    return { summary: state.zonesCoveredSummaryUSA, alerts: alertsResult };
  } catch (err) {
    addEngineError("❌ Erreur RUN GLOBAL USA: " + err.message);
    saveEngineState(state);
    throw err;
  }
}
