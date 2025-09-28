// services/runGlobal.js
// ⚡ RUN GLOBAL — Zones couvertes, découpées finement (grilles + relief + côtes + USA par État)

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { runSuperForecast } from "./superForecast.js";
import { processAlerts } from "./alertsService.js";

/**
 * Génère une petite grille autour d’un centre (N/S/E/O + centre)
 */
function mkGrid(country, center, dx = 2.0, dy = 2.0) {
  const { lat, lon } = center;
  return [
    { country, region: "Center", lat, lon },
    { country, region: "North",  lat: lat + dy, lon },
    { country, region: "South",  lat: lat - dy, lon },
    { country, region: "East",   lat, lon: lon + dx },
    { country, region: "West",   lat, lon: lon - dx },
  ];
}

/**
 * Centres nationaux (capitale ≈ centre météo opérationnel)
 * UE27 + UK + Ukraine + Norvège + Suède
 */
const COUNTRY_CENTERS = {
  Austria: { lat: 48.2082, lon: 16.3738 },
  Belgium: { lat: 50.8503, lon: 4.3517 },
  Bulgaria: { lat: 42.6977, lon: 23.3219 },
  Croatia: { lat: 45.8150, lon: 15.9819 },
  Cyprus: { lat: 35.1856, lon: 33.3823 },
  "Czechia": { lat: 50.0755, lon: 14.4378 },
  Denmark: { lat: 55.6761, lon: 12.5683 },
  Estonia: { lat: 59.4370, lon: 24.7536 },
  Finland: { lat: 60.1699, lon: 24.9384 },
  France: { lat: 48.8566, lon: 2.3522 },
  Germany: { lat: 52.5200, lon: 13.4050 },
  Greece: { lat: 37.9838, lon: 23.7275 },
  Hungary: { lat: 47.4979, lon: 19.0402 },
  Ireland: { lat: 53.3498, lon: -6.2603 },
  Italy: { lat: 41.9028, lon: 12.4964 },
  Latvia: { lat: 56.9496, lon: 24.1052 },
  Lithuania: { lat: 54.6872, lon: 25.2797 },
  Luxembourg: { lat: 49.6116, lon: 6.1319 },
  Malta: { lat: 35.8989, lon: 14.5146 },
  Netherlands: { lat: 52.3676, lon: 4.9041 },
  Poland: { lat: 52.2297, lon: 21.0122 },
  Portugal: { lat: 38.7223, lon: -9.1393 },
  Romania: { lat: 44.4268, lon: 26.1025 },
  Slovakia: { lat: 48.1486, lon: 17.1077 },
  Slovenia: { lat: 46.0569, lon: 14.5058 },
  Spain: { lat: 40.4168, lon: -3.7038 },
  Sweden: { lat: 59.3293, lon: 18.0686 },
  Norway: { lat: 59.9139, lon: 10.7522 },
  "United Kingdom": { lat: 51.5074, lon: -0.1278 },
  Ukraine: { lat: 50.4501, lon: 30.5234 },
};

/**
 * USA — couverture par État (capitale administrative)
 */
const USA_STATES = [
  { state: "Alabama", lat: 32.3668, lon: -86.3000 },
  { state: "Alaska", lat: 58.3019, lon: -134.4197 },
  { state: "Arizona", lat: 33.4484, lon: -112.0740 },
  { state: "Arkansas", lat: 34.7465, lon: -92.2896 },
  { state: "California", lat: 38.5816, lon: -121.4944 },
  { state: "Colorado", lat: 39.7392, lon: -104.9903 },
  { state: "Connecticut", lat: 41.7658, lon: -72.6734 },
  { state: "Delaware", lat: 39.1582, lon: -75.5244 },
  { state: "Florida", lat: 30.4383, lon: -84.2807 },
  { state: "Georgia", lat: 33.7490, lon: -84.3880 },
  { state: "Hawaii", lat: 21.3069, lon: -157.8583 },
  { state: "Idaho", lat: 43.6150, lon: -116.2023 },
  { state: "Illinois", lat: 39.7817, lon: -89.6501 },
  { state: "Indiana", lat: 39.7684, lon: -86.1581 },
  { state: "Iowa", lat: 41.5868, lon: -93.6250 },
  { state: "Kansas", lat: 39.0558, lon: -95.6890 },
  { state: "Kentucky", lat: 38.2009, lon: -84.8733 },
  { state: "Louisiana", lat: 30.4515, lon: -91.1871 },
  { state: "Maine", lat: 44.3106, lon: -69.7795 },
  { state: "Maryland", lat: 38.9784, lon: -76.4922 },
  { state: "Massachusetts", lat: 42.3601, lon: -71.0589 },
  { state: "Michigan", lat: 42.7325, lon: -84.5555 },
  { state: "Minnesota", lat: 44.9537, lon: -93.0900 },
  { state: "Mississippi", lat: 32.2988, lon: -90.1848 },
  { state: "Missouri", lat: 38.5767, lon: -92.1735 },
  { state: "Montana", lat: 46.5884, lon: -112.0245 },
  { state: "Nebraska", lat: 40.8136, lon: -96.7026 },
  { state: "Nevada", lat: 39.1638, lon: -119.7674 },
  { state: "New Hampshire", lat: 43.2081, lon: -71.5376 },
  { state: "New Jersey", lat: 40.2171, lon: -74.7429 },
  { state: "New Mexico", lat: 35.6870, lon: -105.9378 },
  { state: "New York", lat: 42.6526, lon: -73.7562 },
  { state: "North Carolina", lat: 35.7796, lon: -78.6382 },
  { state: "North Dakota", lat: 46.8083, lon: -100.7837 },
  { state: "Ohio", lat: 39.9612, lon: -82.9988 },
  { state: "Oklahoma", lat: 35.4676, lon: -97.5164 },
  { state: "Oregon", lat: 44.9429, lon: -123.0351 },
  { state: "Pennsylvania", lat: 40.2732, lon: -76.8867 },
  { state: "Rhode Island", lat: 41.8240, lon: -71.4128 },
  { state: "South Carolina", lat: 34.0007, lon: -81.0348 },
  { state: "South Dakota", lat: 44.3683, lon: -100.3510 },
  { state: "Tennessee", lat: 36.1627, lon: -86.7816 },
  { state: "Texas", lat: 30.2672, lon: -97.7431 },
  { state: "Utah", lat: 40.7608, lon: -111.8910 },
  { state: "Vermont", lat: 44.2601, lon: -72.5754 },
  { state: "Virginia", lat: 37.5407, lon: -77.4360 },
  { state: "Washington", lat: 47.0379, lon: -122.9007 },
  { state: "West Virginia", lat: 38.3498, lon: -81.6326 },
  { state: "Wisconsin", lat: 43.0731, lon: -89.4012 },
  { state: "Wyoming", lat: 41.1400, lon: -104.8202 },
];

function buildCoveredPoints() {
  const points = [];

  for (const [country, center] of Object.entries(COUNTRY_CENTERS)) {
    points.push(...mkGrid(country, center, 2.0, 2.0));
  }

  for (const s of USA_STATES) {
    points.push({ country: "USA", region: s.state, lat: s.lat, lon: s.lon });
  }

  return points;
}

export async function runGlobal() {
  const state = getEngineState();
  try {
    addEngineLog("🌍 Démarrage du RUN GLOBAL (zones couvertes complètes) …");
    state.runTime = new Date().toISOString();
    state.checkup = { models: "PENDING", localForecasts: "PENDING", nationalForecasts: "PENDING", aiAlerts: "PENDING" };
    saveEngineState(state);

    const points = buildCoveredPoints();
    addEngineLog(`🗺️ Points couverts: ${points.length}`);

    const byCountry = {};
    let successCount = 0;

    for (const p of points) {
      try {
        const res = await runSuperForecast({ lat: p.lat, lon: p.lon, country: p.country, region: p.region });
        if (!byCountry[p.country]) byCountry[p.country] = { regions: [] };
        byCountry[p.country].regions.push({ region: p.region, lat: p.lat, lon: p.lon, forecast: res?.forecast });
        successCount++;
        addEngineLog(`✅ ${p.country} — ${p.region}`);
      } catch (e) {
        addEngineError(`❌ ${p.country} — ${p.region}: ${e.message}`);
      }
    }

    state.zonesCovered = byCountry;
    state.zonesCoveredSummary = { countries: Object.keys(byCountry).length, points: points.length, success: successCount };
    state.checkup.models = "OK";
    state.checkup.localForecasts = successCount > 0 ? "OK" : "FAIL";
    state.checkup.nationalForecasts = Object.keys(byCountry).length > 0 ? "OK" : "FAIL";
    saveEngineState(state);

    const alertsResult = await processAlerts();
    state.checkup.aiAlerts = alertsResult?.error ? "FAIL" : "OK";
    state.checkup.engineStatus = "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN GLOBAL terminé");
    return { summary: state.zonesCoveredSummary, alerts: alertsResult || {} };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL");
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineLog("❌ RUN GLOBAL en échec");
    return { error: err.message };
  }
}
