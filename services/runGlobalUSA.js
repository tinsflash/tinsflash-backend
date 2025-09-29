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
    { lat: 34.05, lon: -118.24, region: "Los Angeles - South Coast" },
    { lat: 37.77, lon: -122.42, region: "San Francisco - Bay Area" },
    { lat: 36.77, lon: -119.42, region: "Central Valley - Fresno" },
    { lat: 32.72, lon: -117.16, region: "San Diego - South Coast" },
    { lat: 39.54, lon: -119.81, region: "Lake Tahoe - Sierra Nevada" },
    { lat: 40.80, lon: -124.16, region: "North Coast - Eureka" }
  ],
  Oregon: [
    { lat: 45.52, lon: -122.68, region: "Portland - North-West" },
    { lat: 44.05, lon: -123.09, region: "Eugene - Willamette Valley" },
    { lat: 43.80, lon: -120.55, region: "Central Oregon - Bend" },
    { lat: 42.37, lon: -122.86, region: "Medford - South" },
    { lat: 46.19, lon: -123.83, region: "Astoria - Pacific Coast" }
  ],
  Washington: [
    { lat: 47.61, lon: -122.33, region: "Seattle - Puget Sound" },
    { lat: 47.25, lon: -122.44, region: "Tacoma - South Puget" },
    { lat: 46.60, lon: -120.51, region: "Yakima - Inland Basin" },
    { lat: 47.66, lon: -117.43, region: "Spokane - East" },
    { lat: 48.75, lon: -122.48, region: "Bellingham - North Coast" }
  ],
  Nevada: [
    { lat: 36.17, lon: -115.14, region: "Las Vegas - South Desert" },
    { lat: 39.16, lon: -119.77, region: "Carson City - West" },
    { lat: 40.83, lon: -115.76, region: "Elko - Great Basin" },
    { lat: 38.97, lon: -119.94, region: "Lake Tahoe - Nevada Side" }
  ],
  Texas: [
    { lat: 29.76, lon: -95.37, region: "Houston - Gulf Coast" },
    { lat: 32.78, lon: -96.80, region: "Dallas - North" },
    { lat: 29.42, lon: -98.49, region: "San Antonio - Central South" },
    { lat: 31.76, lon: -106.48, region: "El Paso - West Desert" },
    { lat: 27.80, lon: -97.39, region: "Corpus Christi - Gulf" }
  ],
  Florida: [
    { lat: 25.76, lon: -80.19, region: "Miami - South" },
    { lat: 28.54, lon: -81.38, region: "Orlando - Central" },
    { lat: 30.33, lon: -81.65, region: "Jacksonville - North Coast" },
    { lat: 27.95, lon: -82.46, region: "Tampa Bay - Gulf Coast" },
    { lat: 28.39, lon: -80.60, region: "Cape Canaveral - NASA" },
    { lat: 24.55, lon: -81.78, region: "Key West - Islands" }
  ],
  Arizona: [
    { lat: 33.45, lon: -112.07, region: "Phoenix - Desert Basin" },
    { lat: 35.20, lon: -111.65, region: "Flagstaff - Highlands" },
    { lat: 36.91, lon: -111.45, region: "Page - Lake Powell" },
    { lat: 31.33, lon: -110.93, region: "Nogales - Mexico Border" },
    { lat: 36.10, lon: -112.09, region: "Grand Canyon - National Park" }
  ],
  NewMexico: [
    { lat: 35.69, lon: -105.94, region: "Santa Fe - Central" },
    { lat: 35.08, lon: -106.65, region: "Albuquerque - Rio Grande" },
    { lat: 32.32, lon: -106.76, region: "Las Cruces - South" },
    { lat: 36.73, lon: -108.21, region: "Farmington - Four Corners" }
  ],
  Louisiana: [
    { lat: 29.95, lon: -90.07, region: "New Orleans - Gulf Coast" },
    { lat: 30.45, lon: -91.19, region: "Baton Rouge - Central" },
    { lat: 32.51, lon: -92.12, region: "Monroe - North" },
    { lat: 30.22, lon: -93.21, region: "Lake Charles - West Gulf" }
  ],
  Alabama: [
    { lat: 33.52, lon: -86.80, region: "Birmingham - Central" },
    { lat: 32.36, lon: -86.30, region: "Montgomery - Capital" },
    { lat: 30.69, lon: -88.04, region: "Mobile - Gulf Coast" }
  ],
  Mississippi: [
    { lat: 32.29, lon: -90.18, region: "Jackson - Central" },
    { lat: 34.36, lon: -89.52, region: "Oxford - North" },
    { lat: 30.39, lon: -89.09, region: "Gulfport - Gulf Coast" }
  ],
  Georgia: [
    { lat: 33.75, lon: -84.39, region: "Atlanta - Central North" },
    { lat: 32.08, lon: -81.09, region: "Savannah - Coast" },
    { lat: 31.22, lon: -81.49, region: "Brunswick - Coast South" },
    { lat: 34.03, lon: -84.62, region: "Marietta - North Atlanta Suburbs" }
  ],
  SouthCarolina: [
    { lat: 34.00, lon: -81.03, region: "Columbia - Central" },
    { lat: 32.78, lon: -79.93, region: "Charleston - Coast" },
    { lat: 34.85, lon: -82.40, region: "Greenville - Upstate" }
  ],
  NorthCarolina: [
    { lat: 35.77, lon: -78.64, region: "Raleigh - Capital" },
    { lat: 35.23, lon: -80.84, region: "Charlotte - South" },
    { lat: 36.07, lon: -79.79, region: "Greensboro - Central" },
    { lat: 35.91, lon: -75.71, region: "Outer Banks - Coast" }
  ],
  Illinois: [
    { lat: 41.88, lon: -87.62, region: "Chicago - North-East" },
    { lat: 39.78, lon: -89.65, region: "Springfield - Capital" },
    { lat: 40.11, lon: -88.23, region: "Champaign - Central" }
  ],
  Ohio: [
    { lat: 39.96, lon: -82.99, region: "Columbus - Central" },
    { lat: 41.50, lon: -81.69, region: "Cleveland - North Coast" },
    { lat: 39.10, lon: -84.51, region: "Cincinnati - South" },
    { lat: 41.66, lon: -83.55, region: "Toledo - North-West" }
  ],
  Michigan: [
    { lat: 42.73, lon: -84.55, region: "Lansing - Central" },
    { lat: 42.33, lon: -83.05, region: "Detroit - South-East" },
    { lat: 43.02, lon: -85.63, region: "Grand Rapids - West" },
    { lat: 47.47, lon: -87.64, region: "Marquette - Upper Peninsula" }
  ],
  Wisconsin: [
    { lat: 43.07, lon: -89.40, region: "Madison - Capital" },
    { lat: 43.04, lon: -87.91, region: "Milwaukee - East" },
    { lat: 44.52, lon: -88.02, region: "Green Bay - North-East" }
  ],
  Minnesota: [
    { lat: 44.95, lon: -93.09, region: "Saint Paul - Capital" },
    { lat: 44.97, lon: -93.26, region: "Minneapolis - Twin Cities" },
    { lat: 46.78, lon: -92.10, region: "Duluth - Lake Superior" },
    { lat: 48.61, lon: -93.40, region: "International Falls - North Border" }
  ],
  Iowa: [
    { lat: 41.59, lon: -93.62, region: "Des Moines - Central" },
    { lat: 42.50, lon: -90.67, region: "Dubuque - Mississippi River" },
    { lat: 43.16, lon: -93.20, region: "Mason City - North" }
  ],
  Missouri: [
    { lat: 38.58, lon: -92.17, region: "Jefferson City - Capital" },
    { lat: 38.63, lon: -90.20, region: "St. Louis - East" },
    { lat: 39.10, lon: -94.58, region: "Kansas City - West" },
    { lat: 37.21, lon: -93.29, region: "Springfield - South" }
  ],
  Kansas: [
    { lat: 39.05, lon: -95.69, region: "Topeka - Capital" },
    { lat: 39.11, lon: -94.63, region: "Kansas City KS - East" },
    { lat: 37.69, lon: -97.34, region: "Wichita - South Central" }
  ],
  Nebraska: [
    { lat: 41.25, lon: -95.93, region: "Omaha - East" },
    { lat: 40.81, lon: -96.70, region: "Lincoln - Capital" },
    { lat: 42.82, lon: -102.98, region: "Scottsbluff - West" }
  ],
  Indiana: [
    { lat: 39.77, lon: -86.16, region: "Indianapolis - Central" },
    { lat: 41.68, lon: -86.25, region: "South Bend - North" },
    { lat: 40.42, lon: -86.90, region: "Lafayette - West" }
  ],
  Kentucky: [
    { lat: 38.20, lon: -84.87, region: "Frankfort - Capital" },
    { lat: 38.25, lon: -85.76, region: "Louisville - North" },
    { lat: 36.97, lon: -86.48, region: "Bowling Green - South" },
    { lat: 37.08, lon: -84.61, region: "Somerset - Appalachians" }
  ],
  Tennessee: [
    { lat: 36.16, lon: -86.78, region: "Nashville - Central" },
    { lat: 35.15, lon: -90.05, region: "Memphis - West" },
    { lat: 35.04, lon: -85.31, region: "Chattanooga - South-East" },
    { lat: 36.00, lon: -83.92, region: "Knoxville - Appalachians" }
  ],
  NewYork: [
    { lat: 40.71, lon: -74.00, region: "New York City - South-East" },
    { lat: 42.65, lon: -73.75, region: "Albany - Capital" },
    { lat: 43.16, lon: -77.61, region: "Rochester - West" },
    { lat: 42.89, lon: -78.88, region: "Buffalo - Great Lakes" },
    { lat: 44.70, lon: -73.45, region: "Plattsburgh - Adirondacks" }
  ],
  Pennsylvania: [
    { lat: 39.95, lon: -75.16, region: "Philadelphia - East" },
    { lat: 40.27, lon: -76.88, region: "Harrisburg - Capital" },
    { lat: 40.44, lon: -79.99, region: "Pittsburgh - West" },
    { lat: 41.25, lon: -77.00, region: "Williamsport - Appalachians" }
  ],
  NewJersey: [
    { lat: 40.22, lon: -74.74, region: "Trenton - Capital" },
    { lat: 40.74, lon: -74.17, region: "Newark - North" },
    { lat: 39.94, lon: -75.12, region: "Camden - South" },
    { lat: 39.36, lon: -74.42, region: "Atlantic City - Coast" }
  ],
  Massachusetts: [
    { lat: 42.36, lon: -71.06, region: "Boston - East" },
    { lat: 42.32, lon: -72.64, region: "Springfield - West" },
    { lat: 41.64, lon: -70.93, region: "New Bedford - South Coast" },
    { lat: 41.28, lon: -70.10, region: "Martha's Vineyard - Islands" }
  ],
  Connecticut: [
    { lat: 41.77, lon: -72.67, region: "Hartford - Capital" },
    { lat: 41.31, lon: -72.92, region: "New Haven - South" },
    { lat: 41.22, lon: -73.05, region: "Bridgeport - Coast" }
  ],
  RhodeIsland: [
    { lat: 41.82, lon: -71.41, region: "Providence - Capital" },
    { lat: 41.49, lon: -71.31, region: "Newport - South Coast" }
  ],
  Delaware: [
    { lat: 39.16, lon: -75.52, region: "Dover - Capital" },
    { lat: 39.74, lon: -75.55, region: "Wilmington - North" },
    { lat: 38.69, lon: -75.07, region: "Rehoboth Beach - Coast" }
  ],
  Maryland: [
    { lat: 38.98, lon: -76.49, region: "Annapolis - Capital" },
    { lat: 39.29, lon: -76.61, region: "Baltimore - Central" },
    { lat: 39.57, lon: -76.99, region: "Westminster - North" },
    { lat: 39.40, lon: -76.60, region: "Towson - Suburbs" },
    { lat: 38.31, lon: -75.12, region: "Ocean City - Coast" }
  ],
  WashingtonDC: [
    { lat: 38.90, lon: -77.04, region: "Capital - Federal District" }
  ],
  Virginia: [
    { lat: 37.54, lon: -77.44, region: "Richmond - Central" },
    { lat: 38.92, lon: -77.07, region: "Washington DC Metro - North Virginia" },
    { lat: 36.85, lon: -76.29, region: "Norfolk - Tidewater" },
    { lat: 38.03, lon: -78.48, region: "Charlottesville - Appalachians" }
  ],
  WestVirginia: [
    { lat: 38.35, lon: -81.63, region: "Charleston - Capital" },
    { lat: 39.63, lon: -79.95, region: "Morgantown - North" },
    { lat: 37.78, lon: -81.18, region: "Beckley - South" }
  ],
  Colorado: [
    { lat: 39.74, lon: -104.99, region: "Denver - Central" },
    { lat: 38.83, lon: -104.82, region: "Colorado Springs - South" },
    { lat: 40.58, lon: -105.08, region: "Fort Collins - North" },
    { lat: 39.19, lon: -106.82, region: "Aspen - Rockies" },
    { lat: 37.27, lon: -107.88, region: "Durango - South Rockies" }
  ],
  Utah: [
    { lat: 40.76, lon: -111.89, region: "Salt Lake City - Capital" },
    { lat: 37.77, lon: -113.60, region: "Cedar City - South" },
    { lat: 37.30, lon: -113.03, region: "St. George - Desert South" },
    { lat: 38.57, lon: -109.55, region: "Moab - Arches Canyonlands" }
  ],
  Montana: [
    { lat: 46.59, lon: -112.02, region: "Helena - Capital" },
    { lat: 45.67, lon: -111.04, region: "Bozeman - Rockies" },
    { lat: 47.50, lon: -111.30, region: "Great Falls - Central" },
    { lat: 48.55, lon: -109.67, region: "Havre - North" },
    { lat: 48.76, lon: -114.00, region: "Kalispell - Glacier Park" }
  ],
  Wyoming: [
    { lat: 41.14, lon: -104.82, region: "Cheyenne - Capital" },
    { lat: 43.07, lon: -108.28, region: "Riverton - Central" },
    { lat: 44.49, lon: -108.05, region: "Cody - Yellowstone East" },
    { lat: 44.43, lon: -110.59, region: "Yellowstone - National Park" }
  ],
  NorthDakota: [
    { lat: 46.81, lon: -100.78, region: "Bismarck - Capital" },
    { lat: 48.23, lon: -101.30, region: "Minot - North" },
    { lat: 46.90, lon: -96.80, region: "Fargo - East" },
    { lat: 47.92, lon: -97.03, region: "Grand Forks - Red River" }
  ],
  SouthDakota: [
    { lat: 44.37, lon: -100.35, region: "Pierre - Capital" },
    { lat: 44.08, lon: -103.23, region: "Rapid City - Black Hills" },
    { lat: 43.54, lon: -96.73, region: "Sioux Falls - East" }
  ],
  Nevada: [
    { lat: 36.17, lon: -115.14, region: "Las Vegas - South" },
    { lat: 39.16, lon: -119.77, region: "Carson City - Capital" },
    { lat: 39.53, lon: -119.81, region: "Reno - North-West" },
    { lat: 38.80, lon: -116.41, region: "Tonopah - Central Desert" }
  ],
  Idaho: [
    { lat: 43.61, lon: -116.20, region: "Boise - Capital" },
    { lat: 47.67, lon: -117.00, region: "Coeur d'Alene - North" },
    { lat: 46.73, lon: -117.00, region: "Moscow - Palouse" },
    { lat: 45.42, lon: -116.01, region: "McCall - Mountains" },
    { lat: 44.07, lon: -114.74, region: "Stanley - Sawtooths" }
  ],
  California: [
    { lat: 34.05, lon: -118.24, region: "Los Angeles - South Coast" },
    { lat: 37.77, lon: -122.42, region: "San Francisco - Bay Area" },
    { lat: 36.77, lon: -119.42, region: "Fresno - Central Valley" },
    { lat: 32.83, lon: -117.13, region: "San Diego - South Border" },
    { lat: 39.55, lon: -121.59, region: "Chico - North Valley" },
    { lat: 38.58, lon: -121.49, region: "Sacramento - Capital" },
    { lat: 36.60, lon: -121.89, region: "Monterey - Coast" },
    { lat: 40.80, lon: -124.16, region: "Eureka - North Coast" },
    { lat: 37.34, lon: -121.89, region: "San Jose - Silicon Valley" }
  ],
  Oregon: [
    { lat: 45.52, lon: -122.68, region: "Portland - North" },
    { lat: 44.94, lon: -123.03, region: "Salem - Capital" },
    { lat: 44.05, lon: -123.09, region: "Eugene - South Valley" },
    { lat: 42.33, lon: -122.87, region: "Medford - South" },
    { lat: 43.80, lon: -121.53, region: "Bend - High Desert" },
    { lat: 46.19, lon: -123.83, region: "Astoria - Coast" }
  ],
  Washington: [
    { lat: 47.61, lon: -122.33, region: "Seattle - Puget Sound" },
    { lat: 47.25, lon: -122.44, region: "Tacoma - South Puget" },
    { lat: 47.66, lon: -117.43, region: "Spokane - Inland" },
    { lat: 46.60, lon: -120.51, region: "Yakima - Central" },
    { lat: 48.75, lon: -122.48, region: "Bellingham - North" }
  ],
  Alaska: [
    { lat: 61.22, lon: -149.90, region: "Anchorage - South Central" },
    { lat: 64.84, lon: -147.72, region: "Fairbanks - Interior" },
    { lat: 71.29, lon: -156.76, region: "Utqiagvik - North Arctic" },
    { lat: 58.30, lon: -134.42, region: "Juneau - Southeast" },
    { lat: 60.55, lon: -145.75, region: "Cordova - Prince William Sound" },
    { lat: 55.34, lon: -131.65, region: "Ketchikan - Southeast Islands" }
  ],
  Hawaii: [
    { lat: 21.30, lon: -157.85, region: "Honolulu - Oahu" },
    { lat: 19.71, lon: -155.08, region: "Hilo - Big Island" },
    { lat: 20.89, lon: -156.47, region: "Kahului - Maui" },
    { lat: 21.97, lon: -159.36, region: "Lihue - Kauai" }
  ],
  
 Texas: [
    { lat: 29.76, lon: -95.37, region: "Houston - East" },
    { lat: 32.78, lon: -96.80, region: "Dallas - North" },
    { lat: 29.42, lon: -98.49, region: "San Antonio - Central" },
    { lat: 31.76, lon: -106.48, region: "El Paso - West" },
    { lat: 32.35, lon: -95.30, region: "Tyler - East Forests" },
    { lat: 27.80, lon: -97.40, region: "Corpus Christi - Gulf Coast" },
    { lat: 31.09, lon: -97.73, region: "Killeen - Central Base" }
  ],
  Florida: [
    { lat: 25.76, lon: -80.19, region: "Miami - South" },
    { lat: 28.54, lon: -81.38, region: "Orlando - Central" },
    { lat: 30.33, lon: -81.65, region: "Jacksonville - North" },
    { lat: 28.39, lon: -80.60, region: "Cape Canaveral - NASA" },
    { lat: 27.95, lon: -82.46, region: "Tampa - Gulf Coast" },
    { lat: 26.64, lon: -81.87, region: "Fort Myers - South Gulf" },
    { lat: 24.55, lon: -81.78, region: "Key West - Islands" }
  ],
  Louisiana: [
    { lat: 30.45, lon: -91.19, region: "Baton Rouge - Capital" },
    { lat: 29.95, lon: -90.07, region: "New Orleans - Gulf" },
    { lat: 32.51, lon: -92.04, region: "Monroe - North" },
    { lat: 31.31, lon: -92.44, region: "Alexandria - Central" }
  ],
  Alabama: [
    { lat: 32.36, lon: -86.30, region: "Montgomery - Capital" },
    { lat: 33.52, lon: -86.81, region: "Birmingham - Central" },
    { lat: 34.73, lon: -86.58, region: "Huntsville - North" },
    { lat: 30.69, lon: -88.04, region: "Mobile - Gulf Coast" }
  ],
  Mississippi: [
    { lat: 32.29, lon: -90.18, region: "Jackson - Capital" },
    { lat: 31.56, lon: -91.40, region: "Natchez - West River" },
    { lat: 34.36, lon: -89.52, region: "Oxford - North" },
    { lat: 30.39, lon: -88.89, region: "Biloxi - Gulf Coast" }
  ],
  Georgia: [
    { lat: 33.75, lon: -84.39, region: "Atlanta - Capital" },
    { lat: 32.08, lon: -81.09, region: "Savannah - Coast" },
    { lat: 34.04, lon: -84.34, region: "Roswell - North Suburbs" },
    { lat: 31.21, lon: -81.50, region: "Brunswick - Coast" }
  ],
  SouthCarolina: [
    { lat: 34.00, lon: -81.03, region: "Columbia - Capital" },
    { lat: 32.78, lon: -79.93, region: "Charleston - Coast" },
    { lat: 34.85, lon: -82.40, region: "Greenville - Upstate" },
    { lat: 33.69, lon: -78.89, region: "Myrtle Beach - Atlantic" }
  ],
  NorthCarolina: [
    { lat: 35.77, lon: -78.64, region: "Raleigh - Capital" },
    { lat: 35.23, lon: -80.84, region: "Charlotte - Central" },
    { lat: 36.07, lon: -79.79, region: "Greensboro - Piedmont" },
    { lat: 35.60, lon: -82.55, region: "Asheville - Appalachians" },
    { lat: 34.23, lon: -77.95, region: "Wilmington - Coast" }
  ],
  Tennessee: [
    { lat: 36.16, lon: -86.78, region: "Nashville - Capital" },
    { lat: 35.05, lon: -85.31, region: "Chattanooga - South" },
    { lat: 35.15, lon: -90.05, region: "Memphis - West" },
    { lat: 36.16, lon: -83.92, region: "Knoxville - Appalachians" }
  ],
  Kentucky: [
    { lat: 38.20, lon: -84.87, region: "Frankfort - Capital" },
    { lat: 38.25, lon: -85.76, region: "Louisville - North" },
    { lat: 37.08, lon: -84.61, region: "Somerset - South" },
    { lat: 38.20, lon: -83.43, region: "Morehead - Appalachians" }
  ],
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
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    throw err;
  }
}
