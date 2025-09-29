// services/engineState.js
import EngineState from "../models/EngineState.js";

export async function getEngineState() {
  try {
    let state = await EngineState.findOne();
    if (!state) {
      state = new EngineState({
        status: "idle",
        lastRun: null,
        checkup: {},
        errors: [],
      });
      await state.save();
    }
    return state;
  } catch (err) {
    console.error("Erreur getEngineState:", err);
    return null;
  }
}

export async function saveEngineState(update) {
  try {
    let state = await EngineState.findOne();
    if (!state) {
      state = new EngineState(update);
    } else {
      Object.assign(state, update, { lastRun: new Date() });
    }
    await state.save();
    return state;
  } catch (err) {
    console.error("Erreur saveEngineState:", err);
    return null;
  }
}

export async function addEngineError(message) {
  try {
    let state = await EngineState.findOne();
    if (!state) {
      state = new EngineState({
        status: "idle",
        lastRun: null,
        checkup: {},
        errors: [],
      });
    }
    state.errors.push({ message, timestamp: new Date() });
    await state.save();
  } catch (err) {
    console.error("Erreur addEngineError:", err);
  }
}
