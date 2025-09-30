// services/engineState.js
import EngineState from "./EngineState.js"; // ✅ modèle Mongo

// 🔎 Récupérer l'état du moteur
export async function getEngineState() {
  let state = await EngineState.findOne();
  if (!state) {
    state = new EngineState({
      status: "idle",
      checkup: { engineStatus: "IDLE" },
      errors: [],
      logs: []
    });
    await state.save();
  }
  return state;
}

// 💾 Sauvegarder l'état du moteur
export async function saveEngineState(newState) {
  let state = await EngineState.findOne();
  if (!state) {
    state = new EngineState(newState);
  } else {
    state.set(newState);
  }
  await state.save();
  return state;
}

// ❌ Ajouter une erreur
export async function addEngineError(message) {
  const state = await getEngineState();
  const log = { message, timestamp: new Date(), level: "ERROR" };
  state.errors.push(log);
  state.logs.push(log);
  state.status = "fail";
  state.checkup.engineStatus = "FAIL";
  await state.save();
  return log;
}

// ✅ Ajouter un log standard
export async function addEngineLog(message) {
  const state = await getEngineState();
  const log = { message, timestamp: new Date(), level: "INFO" };
  state.logs.push(log);
  state.checkup.engineStatus = "RUNNING";
  await state.save();
  return log;
}
