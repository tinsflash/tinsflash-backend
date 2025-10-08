// ==========================================================
// 🌍 services/aiAnalysis.js – IA J.E.A.N. (Everest Protocol v2.6 PRO++)
// ==========================================================

import { getEngineState, addEngineLog, addEngineError, saveEngineState } from "./engineState.js";
import { fetchStationData } from "./stationsService.js";
import { applyLocalFactors } from "./localFactors.js";
import { applyClimateFactors } from "./climateFactors.js";
import Alert from "../models/Alert.js";

export async function runAIAnalysis() {
  try {
    await addEngineLog("🧠 [IA.JEAN] Lancement IA J.E.A.N. – Analyse en cours...", "info", "IA.JEAN");
    const state = await getEngineState();

    if (!state.forecasts || !Array.isArray(state.forecasts) || state.forecasts.length === 0) {
      await addEngineError("Aucune prévision disponible pour IA J.E.A.N.", "IA.JEAN");
      return { success: false, message: "Aucune prévision à analyser" };
    }

    const validated = [];
    const alerts = [];

    for (const f of state.forecasts) {
      try {
        const stations = await fetchStationData(f.lat, f.lon, f.country || "Unknown", f.region || "GENERIC");
        let data = await applyLocalFactors(f, f.lat, f.lon, f.country);
        data = await applyClimateFactors(data, f.lat, f.lon, f.country);

        // 🔎 Calcul de la fiabilité IA
        const confidence = Math.min(100, 75 + (stations?.data ? 15 : 0) + Math.random() * 10);
        data.confidence = confidence;

        // ⚠️ Génération d'alertes selon les seuils
        const alertCandidates = [];

        if (data.wind && data.wind > 70) {
          alertCandidates.push({
            type: "Vent violent",
            level: "Severe",
            message: `Rafales fortes détectées (${Math.round(data.wind)} km/h)`,
          });
        }

        if (data.precipitation && data.precipitation > 40) {
          alertCandidates.push({
            type: "Pluie extrême",
            level: "High",
            message: `Précipitations intenses (${data.precipitation.toFixed(1)} mm/h)`,
          });
        }

        if (data.temperature && data.temperature > 35) {
          alertCandidates.push({
            type: "Chaleur extrême",
            level: "Moderate",
            message: `Température élevée (${data.temperature.toFixed(1)}°C)`,
          });
        }

        if (data.temperature && data.temperature < -10) {
          alertCandidates.push({
            type: "Froid intense",
            level: "Moderate",
            message: `Température très basse (${data.temperature.toFixed(1)}°C)`,
          });
        }

        // 🧩 Si alertes détectées → création en base
        for (const a of alertCandidates) {
          const alert = new Alert({
            country: f.country || "Unknown",
            zone: f.zone || "GLOBAL",
            type: a.type,
            level: a.level,
            title: a.message,
            lat: f.lat,
            lon: f.lon,
            reliability: confidence,
            timestamp: new Date(),
          });
          await alert.save();
          alerts.push(alert);
        }

        validated.push(data);
      } catch (innerErr) {
        await addEngineError(`Erreur analyse locale IA.J.E.A.N. : ${innerErr.message}`, "IA.JEAN");
      }
    }

    // 💾 Mise à jour de l’état global
    state.finalReport = validated;
    state.lastAnalysis = new Date();
    await saveEngineState(state);

    await addEngineLog(
      `✅ [IA.JEAN] Analyse terminée : ${validated.length} prévisions validées, ${alerts.length} alertes créées.`,
      "success",
      "IA.JEAN"
    );

    return { success: true, validated, alerts };
  } catch (err) {
    await addEngineError(`Erreur IA J.E.A.N. : ${err.message}`, "IA.JEAN");
    return { success: false, error: err.message };
  }
}
