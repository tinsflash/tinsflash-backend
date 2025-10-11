// ==========================================================
// 🧠 IA HEALTH CHECK – TINSFLASH PRO+++ (Everest Protocol v3.17)
// Vérifie la stabilité IA J.E.A.N., Mongo et latence Render
// ==========================================================

import mongoose from "mongoose";
import axios from "axios";
import { performance } from "perf_hooks";
import { getEngineState } from "./engineState.js";

export async function checkAIHealth() {
  const start = performance.now();
  let latencyMs = 0;
  let db = "disconnected";
  let status = "error";
  let message = "";

  try {
    // Vérif Mongo
    db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Ping Render / local
    await axios.get("https://api.open-meteo.com/v1/gfs?latitude=0&longitude=0&current=temperature_2m", { timeout: 3000 });
    latencyMs = Math.round(performance.now() - start);

    // Lecture état moteur
    const s = await getEngineState();
    const lastRun = s?.lastRun || null;
    const engineStatus = s?.status || "idle";

    if (db === "connected" && latencyMs < 800 && engineStatus !== "error") {
      status = "ok";
      message = "IA J.E.A.N. opérationnelle et synchronisée";
    } else if (db === "connected" && latencyMs < 2000) {
      status = "warning";
      message = "IA J.E.A.N. en attente de stabilisation réseau";
    } else {
      status = "error";
      message = "Instabilité réseau ou moteur inactif";
    }

    return { status, message, lastRun, latencyMs, db };
  } catch (err) {
    return { status: "error", message: err.message || "Erreur checkAIHealth", latencyMs, db };
  }
}
