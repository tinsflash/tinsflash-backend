// ==========================================================
// 🌍 IA J.E.A.N. – Phase 2 : Analyse des extractions réelles
// Everest Protocol v5.13 PRO+++ REAL GLOBAL CONNECT
// ==========================================================
// Objectif : lire les extractions < 2 h, analyser par zone,
// écrire les prévisions analysées dans MongoDB (Forecast)
// ==========================================================

import { addEngineLog, addEngineError, getEngineState, saveEngineState } from "./engineState.js";
import { ExtractionModel } from "../models/ExtractionModel.js";
import Forecast from "../models/Forecast.js";

// ==========================================================
// 🔧 Paramètres
// ==========================================================
const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 h
const AI_VERSION = "v5.13 REAL GLOBAL CONNECT";

// ==========================================================
// 🧠 Fonction principale
// ==========================================================
export async function runAIAnalysis() {
  const state = await getEngineState();
  const now = Date.now();

  try {
    await addEngineLog("🧠 Phase 2 – IA J.E.A.N. analyse MongoDB (2 h max)", "info", "IA");

    // Recherche des extractions récentes
    const recentExtractions = await ExtractionModel.find({
      insertedAt: { $gte: new Date(now - TWO_HOURS_MS) },
    }).lean();

    if (!recentExtractions.length) {
      await addEngineLog("⚠️ Aucune extraction récente (< 2 h) trouvée – arrêt", "warn", "IA");
      return { success: false, analysedZones: [] };
    }

    // Liste des zones uniques à analyser
    const zones = [...new Set(recentExtractions.map((e) => e.zone || e.runType))];

    await addEngineLog(`📡 Zones détectées : ${zones.join(", ")}`, "info", "IA");

    const results = [];

    for (const zone of zones) {
      const zoneExtractions = recentExtractions.filter(
        (e) => (e.zone || e.runType) === zone
      );

      if (!zoneExtractions.length) continue;

      // Calculs moyens simples (à enrichir par pondération IA)
      const avg = (key) => {
        const vals = zoneExtractions.map((e) => e[key]).filter((v) => typeof v === "number");
        if (!vals.length) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      };

      const forecastData = {
        zone,
        temperature: avg("temperature"),
        humidity: avg("humidity"),
        wind: avg("wind"),
        rain: avg("rain"),
        analysedAt: new Date(),
        sourceExtractionAt: new Date(Math.max(...zoneExtractions.map(e => new Date(e.insertedAt).getTime()))),
        validDurationHrs: 2,
        aiVersion: AI_VERSION,
        points: zoneExtractions.length,
      };

      // Écrase les anciennes prévisions de la zone
      await Forecast.deleteMany({ zone });
      await Forecast.create(forecastData);

      await addEngineLog(
        `✅ IA J.E.A.N. a analysé ${zone} (${forecastData.points} points)`,
        "success",
        "IA"
      );

      results.push(forecastData);
    }

    state.lastAIAnalysis = new Date();
    state.checkup.aiAnalysis = "OK";
    state.aiVersion = AI_VERSION;
    await saveEngineState(state);

    await addEngineLog("🧠 Phase 2 terminée – prévisions enregistrées Mongo", "success", "IA");

    return { success: true, analysedZones: results.map(r => r.zone), results };
  } catch (err) {
    await addEngineError("❌ Erreur IA J.E.A.N. : " + err.message, "IA");
    state.checkup.aiAnalysis = "FAIL";
    await saveEngineState(state);
    throw err;
  }
}

export default { runAIAnalysis };
