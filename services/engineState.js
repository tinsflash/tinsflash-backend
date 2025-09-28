// services/engineState.js

let engineState = {
  runTime: null,
  zonesCovered: {},   // prévisions/alertes par zone
  sources: [],        // statuts des modèles & données
  alertsList: [],     // alertes brutes
  errors: [],
  logs: [],
  checkup: {          // ✅ Nouveau bloc
    modelsOk: false,
    modelsNok: [],
    sourcesOk: false,
    sourcesNok: [],
    aiForecastOk: false,
    aiAlertsOk: false,
    forecastsLocalOk: false,
    forecastsNationalOk: false,
    alertsLocalOk: false,
    alertsNationalOk: false,
    alertsContinentalOk: false,
    alertsGlobalOk: false,
    openDataOk: false,
    engineOperational: false,
    usersByZone: {}
  }
};

// === Fonctions principales ===
export function getEngineState() {
  return engineState;
}

export function saveEngineState(newState) {
  engineState = newState;
}

export function addEngineLog(msg) {
  engineState.logs.push({ ts: new Date().toISOString(), msg });
}

// === ✅ Gestion des erreurs ===
export function addEngineError(err) {
  engineState.errors.push({ ts: new Date().toISOString(), error: err });
}

// === ✅ Fonctions check-up ===
export function updateCheckup(key, ok, details = null) {
  if (!engineState.checkup) engineState.checkup = {};
  if (key in engineState.checkup) {
    engineState.checkup[key] = ok;
    if (details) {
      addEngineLog(`Checkup ${key}: ${ok ? "OK" : "NOK"} (${details})`);
    } else {
      addEngineLog(`Checkup ${key}: ${ok ? "OK" : "NOK"}`);
    }
  } else {
    addEngineLog(`⚠️ Clé inconnue dans checkup: ${key}`);
  }
}

export function resetCheckup() {
  engineState.checkup = {
    modelsOk: false,
    modelsNok: [],
    sourcesOk: false,
    sourcesNok: [],
    aiForecastOk: false,
    aiAlertsOk: false,
    forecastsLocalOk: false,
    forecastsNationalOk: false,
    alertsLocalOk: false,
    alertsNationalOk: false,
    alertsContinentalOk: false,
    alertsGlobalOk: false,
    openDataOk: false,
    engineOperational: false,
    usersByZone: {}
  };
  addEngineLog("♻️ Checkup reset");
}
