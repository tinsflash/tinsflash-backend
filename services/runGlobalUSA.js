// services/runGlobalUSA.js
// ⚡ RUN GLOBAL USA — Zones couvertes par État
// Découpage fin : capitales, métropoles, reliefs, déserts, côtes, zones stratégiques (NASA, tornades, ouragans)

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { runSuperForecast } from "./superForecast.js"; // ✅ conforme export
import { processAlerts } from "./alertsService.js";

// ===========================
// Zones détaillées par État
// ===========================
const USA_ZONES = {
  // --- Côte Ouest ---
  California: [
    { lat: 34.05, lon: -118.24, region: "Los Angeles - South Coast" },
    { lat: 37.77, lon: -122.42, region: "San Francisco - Bay Area" },
    { lat: 32.72, lon: -117.16, region: "San Diego - Pacific South" },
    { lat: 36.77, lon: -119.42, region: "Fresno - Central Valley" },
    { lat: 36.57, lon: -118.29, region: "Sierra Nevada" },
    { lat: 36.25, lon: -116.82, region: "Death Valley - Desert" }
  ],
  Oregon: [
    { lat: 45.52, lon: -122.68, region: "Portland - North" },
    { lat: 44.94, lon: -123.03, region: "Salem - Capital" },
    { lat: 43.80, lon: -123.04, region: "Eugene - South Willamette" },
    { lat: 43.41, lon: -124.23, region: "Coos Bay - Pacific Coast" }
  ],
  Washington: [
    { lat: 47.61, lon: -122.33, region: "Seattle - Coast" },
    { lat: 46.60, lon: -120.51, region: "Yakima - Inland" },
    { lat: 47.66, lon: -117.42, region: "Spokane - East" },
    { lat: 48.75, lon: -122.47, region: "Bellingham - North Coast" }
  ],
  Nevada: [
    { lat: 36.17, lon: -115.14, region: "Las Vegas - Mojave Desert" },
    { lat: 39.16, lon: -119.77, region: "Carson City - Capital" },
    { lat: 39.53, lon: -119.81, region: "Reno - Sierra Edge" }
  ],
  Alaska: [
    { lat: 61.22, lon: -149.90, region: "Anchorage - South" },
    { lat: 64.84, lon: -147.72, region: "Fairbanks - Interior" },
    { lat: 71.29, lon: -156.76, region: "Utqiagvik - Arctic North" },
    { lat: 58.30, lon: -134.42, region: "Juneau - Southeast" }
  ],
  Hawaii: [
    { lat: 21.30, lon: -157.85, region: "Honolulu - Oahu" },
    { lat: 19.70, lon: -155.08, region: "Big Island - Mauna Loa" },
    { lat: 20.80, lon: -156.33, region: "Maui - Central" }
  ],

  // --- Sud-Ouest ---
  Arizona: [
    { lat: 33.45, lon: -112.07, region: "Phoenix - Desert Central" },
    { lat: 35.20, lon: -111.65, region: "Flagstaff - Highlands" },
    { lat: 36.91, lon: -111.45, region: "Grand Canyon" },
    { lat: 32.22, lon: -110.97, region: "Tucson - South" }
  ],
  NewMexico: [
    { lat: 35.69, lon: -105.94, region: "Santa Fe - Capital" },
    { lat: 35.11, lon: -106.61, region: "Albuquerque - Central" },
    { lat: 32.90, lon: -105.96, region: "White Sands Desert" }
  ],
  Utah: [
    { lat: 40.76, lon: -111.89, region: "Salt Lake City - Capital" },
    { lat: 37.10, lon: -113.58, region: "St George - South" },
    { lat: 38.57, lon: -109.55, region: "Moab - Arches" }
  ],
  Colorado: [
    { lat: 39.74, lon: -104.99, region: "Denver - Capital" },
    { lat: 38.83, lon: -104.82, region: "Colorado Springs - South" },
    { lat: 40.58, lon: -105.08, region: "Fort Collins - North" },
    { lat: 39.55, lon: -106.09, region: "Rocky Mountains - Vail" }
  ],
  Texas: [
    { lat: 29.76, lon: -95.37, region: "Houston - Gulf East" },
    { lat: 32.78, lon: -96.80, region: "Dallas - North" },
    { lat: 29.42, lon: -98.49, region: "San Antonio - Central" },
    { lat: 31.76, lon: -106.48, region: "El Paso - West Border" },
    { lat: 27.80, lon: -97.40, region: "Corpus Christi - Gulf South" },
    { lat: 31.46, lon: -100.44, region: "San Angelo - West Plains" }
  ],
  Oklahoma: [
    { lat: 35.47, lon: -97.52, region: "Oklahoma City - Central" },
    { lat: 36.15, lon: -95.99, region: "Tulsa - Northeast" },
    { lat: 34.61, lon: -98.39, region: "Lawton - South" }
  ],

  // --- Sud-Est (Ouragans) ---
  Florida: [
    { lat: 25.76, lon: -80.19, region: "Miami - South" },
    { lat: 28.54, lon: -81.38, region: "Orlando - Central" },
    { lat: 30.33, lon: -81.65, region: "Jacksonville - North" },
    { lat: 28.39, lon: -80.60, region: "Cape Canaveral - NASA" },
    { lat: 27.95, lon: -82.46, region: "Tampa Bay - Gulf" }
  ],
  Louisiana: [
    { lat: 30.45, lon: -91.19, region: "Baton Rouge - Capital" },
    { lat: 29.95, lon: -90.07, region: "New Orleans - Delta" },
    { lat: 30.23, lon: -92.01, region: "Lafayette - West Gulf" }
  ],
  Georgia: [
    { lat: 33.75, lon: -84.39, region: "Atlanta - Capital" },
    { lat: 32.08, lon: -81.09, region: "Savannah - Coast" }
  ],
  Alabama: [
    { lat: 32.36, lon: -86.30, region: "Montgomery - Capital" },
    { lat: 33.52, lon: -86.81, region: "Birmingham - Central" },
    { lat: 30.69, lon: -88.04, region: "Mobile - Gulf Coast" }
  ],
  Mississippi: [
    { lat: 32.29, lon: -90.18, region: "Jackson - Capital" },
    { lat: 30.40, lon: -89.07, region: "Gulfport - Coast" }
  ],
  SouthCarolina: [
    { lat: 34.00, lon: -81.03, region: "Columbia - Capital" },
    { lat: 32.78, lon: -79.93, region: "Charleston - Coast" }
  ],
  NorthCarolina: [
    { lat: 35.77, lon: -78.64, region: "Raleigh - Capital" },
    { lat: 35.23, lon: -80.84, region: "Charlotte - Central" },
    { lat: 35.91, lon: -75.68, region: "Outer Banks - Coast" }
  ],

  // --- Nord-Est ---
  NewYork: [
    { lat: 40.71, lon: -74.00, region: "New York City - Metro" },
    { lat: 42.65, lon: -73.75, region: "Albany - Capital" },
    { lat: 43.16, lon: -77.61, region: "Rochester - West" },
    { lat: 42.89, lon: -78.88, region: "Buffalo - Great Lakes" }
  ],
  Pennsylvania: [
    { lat: 39.95, lon: -75.16, region: "Philadelphia - East" },
    { lat: 40.27, lon: -76.88, region: "Harrisburg - Capital" },
    { lat: 40.44, lon: -79.99, region: "Pittsburgh - West" }
  ],
  NewJersey: [
    { lat: 40.22, lon: -74.74, region: "Trenton - Capital" },
    { lat: 39.95, lon: -74.18, region: "Atlantic City - Coast" }
  ],
  Massachusetts: [
    { lat: 42.36, lon: -71.06, region: "Boston - Capital" },
    { lat: 42.10, lon: -72.59, region: "Springfield - West" }
  ],
  Connecticut: [
    { lat: 41.77, lon: -72.67, region: "Hartford - Capital" },
    { lat: 41.31, lon: -72.92, region: "New Haven - South" }
  ],
  RhodeIsland: [
    { lat: 41.82, lon: -71.41, region: "Providence - Capital" }
  ],
  Delaware: [
    { lat: 39.16, lon: -75.52, region: "Dover - Capital" },
    { lat: 39.74, lon: -75.55, region: "Wilmington - North" }
  ],
  Maryland: [
    { lat: 38.98, lon: -76.49, region: "Annapolis - Capital" },
    { lat: 39.29, lon: -76.61, region: "Baltimore - Bay" }
  ],
  WashingtonDC: [
    { lat: 38.90, lon: -77.04, region: "Capital - Federal" }
  ],

  // --- Midwest & Grandes Plaines ---
  Illinois: [
    { lat: 41.88, lon: -87.62, region: "Chicago - Lake Michigan" },
    { lat: 39.78, lon: -89.65, region: "Springfield - Capital" }
  ],
  Ohio: [
    { lat: 39.96, lon: -82.99, region: "Columbus - Capital" },
    { lat: 41.50, lon: -81.70, region: "Cleveland - North" }
  ],
  Indiana: [
    { lat: 39.77, lon: -86.16, region: "Indianapolis - Capital" }
  ],
  Michigan: [
    { lat: 42.33, lon: -83.05, region: "Detroit - South-East" },
    { lat: 42.73, lon: -84.55, region: "Lansing - Capital" },
    { lat: 44.31, lon: -85.58, region: "Traverse City - North" }
  ],
  Wisconsin: [
    { lat: 43.07, lon: -89.40, region: "Madison - Capital" },
    { lat: 43.04, lon: -87.91, region: "Milwaukee - Lake Michigan" }
  ],
  Minnesota: [
    { lat: 44.95, lon: -93.09, region: "Saint Paul - Capital" },
    { lat: 46.73, lon: -92.10, region: "Duluth - Lake Superior" }
  ],
  Iowa: [
    { lat: 41.59, lon: -93.62, region: "Des Moines - Capital" },
    { lat: 42.50, lon: -96.40, region: "Sioux City - West" }
  ],
  Missouri: [
    { lat: 38.58, lon: -92.17, region: "Jefferson City - Capital" },
    { lat: 38.63, lon: -90.20, region: "St Louis - East" },
    { lat: 39.10, lon: -94.58, region: "Kansas City - West" }
  ],
  Kansas: [
    { lat: 39.05, lon: -95.69, region: "Topeka - Capital" },
    { lat: 37.69, lon: -97.34, region: "Wichita - South" }
  ],
  Nebraska: [
    { lat: 40.81, lon: -96.70, region: "Lincoln - Capital" },
    { lat: 41.26, lon: -95.94, region: "Omaha - East" }
  ],
  NorthDakota: [
    { lat: 46.81, lon: -100.78, region: "Bismarck - Capital" },
    { lat: 46.89, lon: -96.79, region: "Fargo - East" }
  ],
  SouthDakota: [
    { lat: 44.37, lon: -100.35, region: "Pierre - Capital" },
    { lat: 44.08, lon: -103.23, region: "Rapid City - Black Hills" }
  ],
  Wyoming: [
    { lat: 41.14, lon: -104.82, region: "Cheyenne - Capital" },
    { lat: 44.27, lon: -105.50, region: "Gillette - Powder River" },
    { lat: 44.42, lon: -110.58, region: "Yellowstone - National Park" }
  ],
  Montana: [
    { lat: 46.59, lon: -112.02, region: "Helena - Capital" },
    { lat: 47.50, lon: -111.30, region: "Great Falls - Central" },
    { lat: 45.68, lon: -111.04, region: "Bozeman - Rockies" }
  ]
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
          const res = await runSuperForecast({
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
