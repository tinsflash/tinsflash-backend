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

// 💾 Sauvegarder l'état du moteur (fusion sécurisée)
export async function saveEngineState(newState) {
  return await EngineState.findOneAndUpdate(
    {},
    { $set: newState },
    { new: true, upsert: true }
  );
}

// ❌ Ajouter une erreur (sécurisé)
export async function addEngineError(message) {
  const log = { message, timestamp: new Date(), level: "ERROR" };

  await EngineState.findOneAndUpdate(
    {},
    {
      $push: { errors: log, logs: log },
      $set: { status: "fail", "checkup.engineStatus": "FAIL" }
    },
    { new: true, upsert: true }
  );

  return log;
}

// ✅ Ajouter un log standard (sécurisé)
export async function addEngineLog(message) {
  const log = { message, timestamp: new Date(), level: "INFO" };

  await EngineState.findOneAndUpdate(
    {},
    {
      $push: { logs: log },
      $set: { status: "running", "checkup.engineStatus": "RUNNING" }
    },
    { new: true, upsert: true }
  );

  return log;
}
