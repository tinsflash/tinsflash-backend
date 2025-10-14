// ==========================================================
// 🧩 TINSFLASH – dbUtils.js (module temporaire / compatible Mongo)
// ==========================================================

import mongoose from "mongoose";
import { addEngineLog } from "./engineState.js";

export async function connectMongo() {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI manquant");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, { dbName: "tinsflash" });
      await addEngineLog("✅ Connexion Mongo établie", "success", "dbUtils");
    }
    return mongoose.connection;
  } catch (err) {
    await addEngineLog("❌ Erreur Mongo: " + err.message, "error", "dbUtils");
    throw err;
  }
}

export async function disconnectMongo() {
  try {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  } catch (err) {
    await addEngineLog("⚠️ Erreur fermeture Mongo: " + err.message, "warn", "dbUtils");
  }
}

export default { connectMongo, disconnectMongo };
