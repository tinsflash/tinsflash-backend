// services/engineState.js
import EngineState from "./EngineState.js"; // ✅ on reste dans /services/

// Récupérer l'état du moteur
export async function getEngineState() {
  let state = await EngineState.findOne();
  if (!state) {
    state = new EngineState({ status: "idle", checkup: {}, errors: [], logs: [] });
    await state.save();
  }
  return state;
}

// Sauvegarder l'état du moteur
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

// Ajouter une erreur
export async function addEngineError(message) {
  const state = await getEngineState();
  state.errors.push({ message, timestamp: new Date() });
  state.status = "fail";
  await state.save();
}

// Ajouter un log standard
export async function addEngineLog(message) {
  const state = await getEngineState();
  state.logs.push({ message, timestamp: new Date() });
  await state.save();
}
