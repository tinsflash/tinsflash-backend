// services/engineState.js
// ⚙️ Gestion de l’état du moteur météo

let engineState = {
  runTime: null,
  status: "IDLE", // IDLE | RUNNING | OK | FAIL
  checkup: {
    models: "PENDING",
    europe: "PENDING",
    usa: "PENDING",
    globalAlerts: "PENDING",
    continentalAlerts: "PENDING",
    engineStatus: "PENDING",
  }
};

export async function getEngineState() {
  return engineState;
}

export async function saveEngineState(newState) {
  engineState = { ...engineState, ...newState };
}
