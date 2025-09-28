// services/runGlobal.js
// ⚡ RUN GLOBAL — Zones couvertes, découpées finement (grilles + relief + côtes)

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { runSuperForecast } from "./superForecast.js";
import { processAlerts } from "./alertsService.js";

/**
 * Petite grille autour d’un centre : N / S / E / O / Centre
 * dx/dy en degrés (par défaut ~2° ≈ 200 km aux moyennes latitudes)
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
 * (coordonnées en degrés décimaux)
 */
const COUNTRY_CENTERS = {
  // UE 27
  Austria:            { lat: 48.2082, lon: 16.3738 }, // Vienna
  Belgium:            { lat: 50.8503, lon: 4.3517 },  // Brussels
  Bulgaria:           { lat: 42.6977, lon: 23.3219 }, // Sofia
  Croatia:            { lat: 45.8150, lon: 15.9819 }, // Zagreb
  Cyprus:             { lat: 35.1856, lon: 33.3823 }, // Nicosia
  "Czechia":          { lat: 50.0755, lon: 14.4378 }, // Prague
  Denmark:            { lat: 55.6761, lon: 12.5683 }, // Copenhagen
  Estonia:            { lat: 59.4370, lon: 24.7536 }, // Tallinn
  Finland:            { lat: 60.1699, lon: 24.9384 }, // Helsinki
  France:             { lat: 48.8566, lon: 2.3522 },  // Paris
  Germany:            { lat: 52.5200, lon: 13.4050 }, // Berlin
  Greece:             { lat: 37.9838, lon: 23.7275 }, // Athens
  Hungary:            { lat: 47.4979, lon: 19.0402 }, // Budapest
  Ireland:            { lat: 53.3498, lon: -6.2603 }, // Dublin
  Italy:              { lat: 41.9028, lon: 12.4964 }, // Rome
  Latvia:             { lat: 56.9496, lon: 24.1052 }, // Riga
  Lithuania:          { lat: 54.6872, lon: 25.2797 }, // Vilnius
  Luxembourg:         { lat: 49.6116, lon: 6.1319 },  // Luxembourg City
  Malta:              { lat: 35.8989, lon: 14.5146 }, // Valletta
  Netherlands:        { lat: 52.3676, lon: 4.9041 },  // Amsterdam
  Poland:             { lat: 52.2297, lon: 21.0122 }, // Warsaw
  Portugal:           { lat: 38.7223, lon: -9.1393 }, // Lisbon
  Romania:            { lat: 44.4268, lon: 26.1025 }, // Bucharest
  Slovakia:           { lat: 48.1486, lon: 17.1077 }, // Bratislava
  Slovenia:           { lat: 46.0569, lon: 14.5058 }, // Ljubljana
  Spain:              { lat: 40.4168, lon: -3.7038 }, // Madrid
  Sweden:             { lat: 59.3293, lon: 18.0686 }, // Stockholm (ajout)
  // Hors UE couverts
  Norway:             { lat: 59.9139, lon: 10.7522 }, // Oslo (ajout)
  "United Kingdom":   { lat: 51.5074, lon: -0.1278 }, // London
  Ukraine:            { lat: 50.4501, lon: 30.5234 }, // Kyiv
};

/**
 * Points “spéciaux” (relief, côtes, îles…) par pays
 * —> on cible les régimes météo contrastés
 */
const SPECIALS = {
  France: [
    { region: "Alpes / Chamonix", lat: 45.9237, lon: 6.8694 },
    { region: "Pyrénées / Tarbes", lat: 43.2325, lon: 0.0781 },
    { region: "Atlantique / Bordeaux", lat: 44.8378, lon: -0.5792 },
    { region: "Méditerranée / Nice", lat: 43.7102, lon: 7.2620 },
    { region: "Corse / Ajaccio", lat: 41.9192, lon: 8.7386 },
    { region: "Massif Central / Clermont-Ferrand", lat: 45.7772, lon: 3.0870 },
  ],
  Spain: [
    { region: "Catalogne / Barcelone", lat: 41.3851, lon: 2.1734 },
    { region: "Andalousie / Séville", lat: 37.3891, lon: -5.9845 },
    { region: "Atlantique Nord / A Coruña", lat: 43.3623, lon: -8.4115 },
    { region: "Baléares / Palma", lat: 39.5696, lon: 2.6502 },
    { region: "Canaries / Tenerife", lat: 28.4682, lon: -16.2546 },
    { region: "Pyrénées / Jaca", lat: 42.5680, lon: -0.5496 },
  ],
  Italy: [
    { region: "Plaine du Pô / Milan", lat: 45.4642, lon: 9.1900 },
    { region: "Alpes / Bolzano", lat: 46.4983, lon: 11.3548 },
    { region: "Apennins / L'Aquila", lat: 42.3546, lon: 13.3903 },
    { region: "Tyrrhénienne / Naples", lat: 40.8518, lon: 14.2681 },
    { region: "Sicile / Palerme", lat: 38.1157, lon: 13.3615 },
    { region: "Sardaigne / Cagliari", lat: 39.2238, lon: 9.1217 },
    { region: "Adriatique / Rimini", lat: 44.0678, lon: 12.5695 },
  ],
  Germany: [
    { region: "Bavière / Munich", lat: 48.1351, lon: 11.5820 },
    { region: "Côtes Baltique / Kiel", lat: 54.3233, lon: 10.1228 },
    { region: "Ruhr / Cologne", lat: 50.9375, lon: 6.9603 },
    { region: "Saxe / Dresde", lat: 51.0504, lon: 13.7373 },
    { region: "Forêt Noire / Freiburg", lat: 47.9990, lon: 7.8421 },
  ],
  Portugal: [
    { region: "Nord / Porto", lat: 41.1579, lon: -8.6291 },
    { region: "Algarve / Faro", lat: 37.0194, lon: -7.9304 },
    { region: "Madère / Funchal", lat: 32.6669, lon: -16.9241 },
    { region: "Açores / Ponta Delgada", lat: 37.7412, lon: -25.6756 },
    { region: "Intérieur / Évora", lat: 38.5714, lon: -7.9135 },
  ],
  Greece: [
    { region: "Thessalonique", lat: 40.6401, lon: 22.9444 },
    { region: "Crète / Héraklion", lat: 35.3387, lon: 25.1442 },
    { region: "Dodécanèse / Rhodes", lat: 36.1620, lon: 28.0110 },
    { region: "Épire / Ioannina", lat: 39.6650, lon: 20.8537 },
    { region: "Péloponnèse / Kalamata", lat: 37.0380, lon: 22.1142 },
  ],
  Norway: [
    { region: "Côte Ouest / Bergen", lat: 60.3913, lon: 5.3221 },
    { region: "Arctique / Tromsø", lat: 69.6492, lon: 18.9553 },
    { region: "Trøndelag / Trondheim", lat: 63.4305, lon: 10.3951 },
    { region: "Rogaland / Stavanger", lat: 58.9690, lon: 5.7331 },
    { region: "Montagnes / Geilo", lat: 60.5333, lon: 8.2064 },
  ],
  Sweden: [
    { region: "Göteborg", lat: 57.7089, lon: 11.9746 },
    { region: "Malmö", lat: 55.6049, lon: 13.0038 },
    { region: "Laponie / Kiruna", lat: 67.8558, lon: 20.2253 },
    { region: "Nord Baltique / Umeå", lat: 63.8258, lon: 20.2630 },
    { region: "Montagnes / Östersund", lat: 63.1792, lon: 14.6357 },
  ],
  Finland: [
    { region: "Turku", lat: 60.4518, lon: 22.2666 },
    { region: "Tampere", lat: 61.4978, lon: 23.7610 },
    { region: "Oulu", lat: 65.0121, lon: 25.4651 },
    { region: "Rovaniemi", lat: 66.5039, lon: 25.7294 },
    { region: "Kuopio", lat: 62.8924, lon: 27.6770 },
  ],
  "United Kingdom": [
    { region: "Écosse / Inverness", lat: 57.4778, lon: -4.2247 },
    { region: "Glasgow", lat: 55.8642, lon: -4.2518 },
    { region: "Pays de Galles / Cardiff", lat: 51.4816, lon: -3.1791 },
    { region: "Irlande du Nord / Belfast", lat: 54.5973, lon: -5.9301 },
    { region: "Sud-Est / Brighton", lat: 50.8225, lon: -0.1372 },
    { region: "East Anglia / Norwich", lat: 52.6309, lon: 1.2974 },
    { region: "Nord-Est / Newcastle", lat: 54.9783, lon: -1.6178 },
    { region: "Sud-Ouest / Plymouth", lat: 50.3755, lon: -4.1427 },
  ],
  Ireland: [
    { region: "Cork", lat: 51.8985, lon: -8.4756 },
    { region: "Galway", lat: 53.2707, lon: -9.0568 },
    { region: "Limerick", lat: 52.6638, lon: -8.6267 },
    { region: "Donegal", lat: 54.6538, lon: -8.1096 },
  ],
  Poland: [
    { region: "Côte Baltique / Gdańsk", lat: 54.3520, lon: 18.6466 },
    { region: "Sud / Cracovie", lat: 50.0647, lon: 19.9450 },
    { region: "Ouest / Wrocław", lat: 51.1079, lon: 17.0385 },
    { region: "Est / Białystok", lat: 53.1325, lon: 23.1688 },
    { region: "Centre-Ouest / Poznań", lat: 52.4064, lon: 16.9252 },
  ],
  Romania: [
    { region: "Transylvanie / Cluj", lat: 46.7712, lon: 23.6236 },
    { region: "Moldavie / Iași", lat: 47.1585, lon: 27.6014 },
    { region: "Banat / Timișoara", lat: 45.7489, lon: 21.2087 },
    { region: "Mer Noire / Constanța", lat: 44.1598, lon: 28.6348 },
    { region: "Carpates / Brașov", lat: 45.6579, lon: 25.6012 },
  ],
  Ukraine: [
    { region: "Lviv (Ouest)", lat: 49.8397, lon: 24.0297 },
    { region: "Odesa (Mer Noire)", lat: 46.4825, lon: 30.7233 },
    { region: "Kharkiv (Est)", lat: 49.9935, lon: 36.2304 },
    { region: "Dnipro (Centre)", lat: 48.4647, lon: 35.0462 },
    { region: "Zaporizhzhia (SE)", lat: 47.8388, lon: 35.1396 },
  ],
  Denmark: [
    { region: "Aarhus", lat: 56.1629, lon: 10.2039 },
    { region: "Aalborg", lat: 57.0488, lon: 9.9217 },
    { region: "Odense", lat: 55.4038, lon: 10.4024 },
    { region: "Bornholm / Rønne", lat: 55.1000, lon: 14.7060 },
  ],
  Netherlands: [
    { region: "Rotterdam", lat: 51.9244, lon: 4.4777 },
    { region: "Groningen", lat: 53.2194, lon: 6.5665 },
    { region: "Maastricht", lat: 50.8514, lon: 5.6910 },
    { region: "Îles Wadden / Texel", lat: 53.0620, lon: 4.7488 },
  ],
  Belgium: [
    { region: "Anvers", lat: 51.2194, lon: 4.4025 },
    { region: "Liège", lat: 50.6326, lon: 5.5797 },
    { region: "Ardennes / Spa", lat: 50.4921, lon: 5.8645 },
    { region: "Bruges", lat: 51.2093, lon: 3.2247 },
  ],
  Austria: [
    { region: "Alpes / Innsbruck", lat: 47.2692, lon: 11.4041 },
    { region: "Salzbourg", lat: 47.8095, lon: 13.0550 },
    { region: "Graz", lat: 47.0707, lon: 15.4395 },
    { region: "Linz", lat: 48.3069, lon: 14.2858 },
    { region: "Villach", lat: 46.6103, lon: 13.8558 },
  ],
  Hungary: [
    { region: "Debrecen", lat: 47.5316, lon: 21.6273 },
    { region: "Szeged", lat: 46.2530, lon: 20.1414 },
    { region: "Pécs", lat: 46.0727, lon: 18.2323 },
    { region: "Lac Balaton / Siófok", lat: 46.9081, lon: 18.0581 },
  ],
  Czechia: [
    { region: "Brno", lat: 49.1951, lon: 16.6068 },
    { region: "Ostrava", lat: 49.8209, lon: 18.2625 },
    { region: "Plzeň", lat: 49.7384, lon: 13.3736 },
  ],
  Slovakia: [
    { region: "Košice", lat: 48.7164, lon: 21.2611 },
    { region: "Hautes Tatras / Poprad", lat: 49.0590, lon: 20.2970 },
  ],
  Slovenia: [
    { region: "Maribor", lat: 46.5547, lon: 15.6459 },
    { region: "Côte / Koper", lat: 45.5481, lon: 13.7302 },
    { region: "Juliennes / Bovec", lat: 46.3386, lon: 13.5520 },
  ],
  Croatia: [
    { region: "Split (Adriatique)", lat: 43.5081, lon: 16.4402 },
    { region: "Dubrovnik", lat: 42.6507, lon: 18.0944 },
    { region: "Rijeka", lat: 45.3271, lon: 14.4422 },
    { region: "Osijek", lat: 45.5511, lon: 18.6939 },
  ],
  Romania_Add: [], Bulgaria: [
    { region: "Plovdiv", lat: 42.1354, lon: 24.7453 },
    { region: "Varna (Mer Noire)", lat: 43.2141, lon: 27.9147 },
    { region: "Burgas", lat: 42.5048, lon: 27.4626 },
    { region: "Rila / Montagnes", lat: 42.1389, lon: 23.3420 },
  ],
  Greece_Add: [], Portugal_Add: [], Spain_Add: [], Italy_Add: [],
  Latvia: [
    { region: "Liepāja (Baltique)", lat: 56.5047, lon: 21.0108 },
    { region: "Daugavpils", lat: 55.8740, lon: 26.5362 },
  ],
  Lithuania: [
    { region: "Kaunas", lat: 54.8985, lon: 23.9036 },
    { region: "Klaipėda (Baltique)", lat: 55.7033, lon: 21.1443 },
  ],
  Estonia: [
    { region: "Tartu", lat: 58.3776, lon: 26.7290 },
    { region: "Pärnu (Baltique)", lat: 58.3859, lon: 24.4971 },
  ],
  Malta: [
    { region: "Gozo / Victoria", lat: 36.0443, lon: 14.2390 },
  ],
  Cyprus: [
    { region: "Limassol", lat: 34.7071, lon: 33.0226 },
    { region: "Larnaca", lat: 34.9003, lon: 33.6232 },
    { region: "Paphos", lat: 34.7720, lon: 32.4297 },
    { region: "Troodos", lat: 34.9180, lon: 32.8830 },
  ],
  Luxembourg: [],
};

/**
 * USA — par État (capitale administrative)
 * 50 entrées — couverture nationale par État
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

/** Génère la liste finale des points à prévoir (UE élargie + USA par État) */
function buildCoveredPoints() {
  const points = [];

  // Europe élargie
  for (const [country, center] of Object.entries(COUNTRY_CENTERS)) {
    // Grille de base
    points.push(...mkGrid(country, center, 2.0, 2.0));
    // Spéciaux
    const extras = SPECIALS[country] || [];
    for (const ex of extras) {
      points.push({ country, region: ex.region, lat: ex.lat, lon: ex.lon });
    }
  }

  // USA par État
  for (const s of USA_STATES) {
    points.push({ country: "USA", region: s.state, lat: s.lat, lon: s.lon });
  }

  return points;
}

export async function runGlobal() {
  const state = getEngineState();
  try {
    addEngineLog("🌍 Démarrage du RUN GLOBAL (grilles + relief + côtes + USA par État) …");
    state.runTime = new Date().toISOString();
    state.checkup = state.checkup || {};
    state.checkup.models = "PENDING";
    state.checkup.localForecasts = "PENDING";
    state.checkup.nationalForecasts = "PENDING";
    state.checkup.aiAlerts = "PENDING";
    saveEngineState(state);

    const points = buildCoveredPoints();
    addEngineLog(`🗺️ Points couverts: ${points.length}`);

    const byCountry = {};
    let successCount = 0;

    for (const p of points) {
      try {
        const res = await runSuperForecast({ lat: p.lat, lon: p.lon, country: p.country, region: p.region });
        if (!byCountry[p.country]) byCountry[p.country] = { regions: [] };
        byCountry[p.country].regions.push({
          region: p.region,
          lat: p.lat,
          lon: p.lon,
          forecast: res?.forecast,
          sources: res?.sources
        });
        successCount++;
        addEngineLog(`✅ ${p.country} — ${p.region}`);
      } catch (e) {
        addEngineError(`❌ ${p.country} — ${p.region}: ${e.message}`);
      }
    }

    state.zonesCovered = byCountry;
    state.checkup.models = "OK";
    state.checkup.localForecasts = successCount > 0 ? "OK" : "FAIL";
    state.checkup.nationalForecasts = Object.keys(byCountry).length > 0 ? "OK" : "FAIL";
    saveEngineState(state);

    // Pipeline Alertes (classement >90 / 70–90 / <70)
    const alertsResult = await processAlerts();
    state.checkup.aiAlerts = alertsResult?.error ? "FAIL" : "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN GLOBAL terminé");
    return {
      countries: Object.keys(byCountry).length,
      points: points.length,
      success: successCount,
      alerts: alertsResult || {}
    };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL");
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineLog("❌ RUN GLOBAL en échec");
    return { error: err.message };
  }
}
