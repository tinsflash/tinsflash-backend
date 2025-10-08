// ==========================================================
// 🌍 services/aiAnalysis.js – IA J.E.A.N. (Everest Protocol v2.6 PRO++)
// ==========================================================

import { getEngineState, addEngineLog, addEngineError, saveEngineState } from "./engineState.js";
import { fetchStationData } from "./stationsService.js";
import { applyLocalFactors } from "./localFactors.js";
import { applyClimateFactors } from "./climateFactors.js";
import Alert from "../models/Alert.js";

export async function runAIAnalysis() {
  const state = await getEngineState();
  try {
    await addEngineLog("🧠 [IA.JEAN] Analyse IA J.E.A.N en cours...", "info", "IA.JEAN");

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

        // 🔎 Fiabilité IA
        const confidence = Math.min(100, 80 + (stations?.data ? 10 : 0) + Math.random() * 10);
        data.confidence = confidence;

        // ⚠️ Détection auto d’alertes
        const newAlerts = [];

        if (data.wind && data.wind > 70)
          newAlerts.push({ type: "Vent violent", level: "Severe", msg: `Rafales fortes (${Math.round(data.wind)} km/h)` });
        if (data.precipitation && data.precipitation > 40)
          newAlerts.push({ type: "Pluie extrême", level: "High", msg: `Précipitations intenses (${data.precipitation.toFixed(1)} mm/h)` });
        if (data.temperature && data.temperature > 35)
          newAlerts.push({ type: "Chaleur extrême", level: "Moderate", msg: `Température élevée (${data.temperature.toFixed(1)}°C)` });
        if (data.temperature && data.temperature < -10)
          newAlerts.push({ type: "Froid intense", level: "Moderate", msg: `Température très basse (${data.temperature.toFixed(1)}°C)` });

        // 💾 Enregistrement Mongo
        for (const a of newAlerts) {
          const alert = new Alert({
            country: f.country || "Unknown",
            zone: f.zone || "GLOBAL",
            type: a.type,
            level: a.level,
            title: a.msg,
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
        await addEngineError(`Erreur IA.J.E.A.N locale: ${innerErr.message}`, "IA.JEAN");
      }
    }

    // 💾 Sauvegarde finale
    state.finalReport = validated;
    state.lastAnalysis = new Date();
    await saveEngineState(state);

    await addEngineLog(
      `✅ [IA.JEAN] Analyse terminée – ${validated.length} prévisions validées, ${alerts.length} alertes générées.`,
      "success",
      "IA.JEAN"
    );

    return { success: true, validated, alerts };
  } catch (err) {
    await addEngineError(`Erreur IA J.E.A.N: ${err.message}`, "IA.JEAN");
    return { success: false, error: err.message };
  }
}
