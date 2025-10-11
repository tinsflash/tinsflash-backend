// ==========================================================
// 🧠 IA HEALTH CHECK – Extension mémoire (Everest Protocol v3.19)
// Vérifie IA, Mongo, latence et cohérence de la mémoire J.E.A.N.
// ==========================================================

import mongoose from "mongoose";
import axios from "axios";
import { performance } from "perf_hooks";
import { getEngineState } from "./engineState.js";
import fs from "fs";

const MEMORY_FILE = "./engine_memory_fingerprint.txt";

export async function checkAIHealth() {
  const start = performance.now();
  let latencyMs = 0;
  let db = "disconnected";
  let status = "error";
  let message = "";
  let memoryOk = false;

  try {
    // === Vérif Mongo ===
    db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // === Vérif réseau (ping Open-Meteo) ===
    await axios.get("https://api.open-meteo.com/v1/gfs?latitude=0&longitude=0&current=temperature_2m", { timeout: 3000 });
    latencyMs = Math.round(performance.now() - start);

    // === Vérif moteur ===
    const s = await getEngineState();
    const lastRun = s?.lastRun || null;
    const engineStatus = s?.status || "idle";

    // === Vérif cohérence mémoire IA ===
    try {
      const currentFingerprint = "JEAN_CORE_V519";
      const saved = fs.existsSync(MEMORY_FILE) ? fs.readFileSync(MEMORY_FILE, "utf8") : "";
      if (saved === currentFingerprint) memoryOk = true;
      else {
        fs.writeFileSync(MEMORY_FILE, currentFingerprint);
        memoryOk = false; // nouvel enregistrement = perte de continuité
      }
    } catch (err) {
      memoryOk = false;
    }

    // === Analyse ===
    if (db === "connected" && latencyMs < 800 && engineStatus !== "error" && memoryOk) {
      status = "ok";
      message = "IA J.E.A.N. opérationnelle et mémoire stable";
    } else if (!memoryOk) {
      status = "warning";
      message = "IA J.E.A.N. a subi une coupure mémoire (redémarrage récent)";
    } else if (db === "connected" && latencyMs < 2000) {
      status = "warning";
      message = "IA J.E.A.N. en attente de stabilisation réseau";
    } else {
      status = "error";
      message = "Instabilité IA ou moteur inactif";
    }

    return { status, message, latencyMs, db, memoryOk, lastRun };
  } catch (err) {
    return { status: "error", message: err.message || "Erreur interne IA Health Check", latencyMs, db, memoryOk: false };
  }
}
