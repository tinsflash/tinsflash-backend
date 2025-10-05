// PATH: services/alertEvolutionService.js
// ⚛️ Gestion dynamique de l’évolution des alertes météo
// Relié à models/Alert.js + alertDetector.js + alertsEngine.js

import Alert from "../models/Alert.js";
import { detectAlerts } from "./alertDetector.js";
import { classifyAlerts } from "./alertsEngine.js";
import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * Met à jour les alertes existantes ou en crée de nouvelles selon les runs
 * @param {Array<Object>} forecastPoints - Points de prévisions agrégés (sources multiples)
 * @param {String} runId - ID du cycle en cours
 * @param {String} scope - "Europe" | "USA" | "Global"...
 */
export async function evolveAlerts(forecastPoints = [], runId = "unknown", scope = "Global") {
  const results = [];
  try {
    await addEngineLog(`🧩 Évolution des alertes — ${forecastPoints.length} points analysés (${scope})`);

    for (const p of forecastPoints) {
      const newDetections = detectAlerts(p, { scope, country: p.country });
      for (const det of newDetections) {
        const classified = classifyAlerts(det);
        const key = `${det.type}_${det.country}_${Math.round(p.lat*100)}_${Math.round(p.lon*100)}`;

        // Recherche d'une alerte existante proche
        const existing = await Alert.findOne({
          title: new RegExp(det.type, "i"),
          country: det.country,
          lat: { $gte: p.lat - 1, $lte: p.lat + 1 },
          lon: { $gte: p.lon - 1, $lte: p.lon + 1 },
        });

        if (existing) {
          // === Mise à jour ===
          const trend =
            classified.confidence > existing.certainty
              ? "rising"
              : classified.confidence < existing.certainty
              ? "falling"
              : "stable";

          existing.certainty = classified.confidence;
          existing.description = det.message;
          existing.workflow = classified.status;
          existing.trend = trend;
          existing.runCount += 1;
          existing.lastRunId = runId;
          existing.lastUpdate = new Date();
          if (classified.confidence >= 90 && existing.workflow !== "published") {
            existing.workflow = "published";
            existing.validatedBy = "auto";
            existing.validatedAt = new Date();
          }
          await existing.save();
          results.push(existing);
        } else {
          // === Création nouvelle alerte ===
          const newAlert = new Alert({
            title: det.type,
            description: det.message,
            country: det.country,
            lat: p.lat,
            lon: p.lon,
            altitude: p.altitude ?? 0,
            severity:
              det.type === "heat" ? "high" :
              det.type === "cold" ? "medium" :
              det.type === "rain" ? "medium" :
              det.type === "wind" ? "high" :
              det.type === "snow" ? "medium" : "low",
            certainty: classified.confidence,
            workflow: classified.status,
            trend: "rising",
            lastRunId: runId,
            runCount: 1,
            status: "✅ Premier détecteur",
            source: "TINSFLASH Nuclear Core",
          });
          await newAlert.save();
          results.push(newAlert);
        }
      }
    }

    // 🔄 Suppression après 3 runs consécutifs de disparition
    const allExisting = await Alert.find({});
    for (const a of allExisting) {
      if (a.lastRunId !== runId) {
        a.runCount = (a.runCount || 1) - 1;
        if (a.runCount <= -3) {
          await addEngineLog(`🗑️ Suppression de ${a.title} (${a.country}) – disparu 3 runs`);
          await Alert.deleteOne({ _id: a._id });
        } else {
          a.workflow = "under-surveillance";
          await a.save();
        }
      }
    }

    await addEngineLog(`✅ Évolution des alertes terminée (${results.length} alertes actives)`);
    return results;
  } catch (err) {
    await addEngineError(`❌ evolveAlerts error: ${err.message}`);
    console.error(err);
    return [];
  }
}

/**
 * Retourne un résumé global des alertes (pour admin-alerts.html)
 */
export async function getAlertsSummary() {
  const alerts = await Alert.find({});
  const summary = {
    total: alerts.length,
    byStatus: {
      published: alerts.filter(a => a.workflow === "published").length,
      toValidate: alerts.filter(a => a.workflow === "toValidate").length,
      "under-surveillance": alerts.filter(a => a.workflow === "under-surveillance").length,
      archived: alerts.filter(a => a.workflow === "archived").length,
    },
    exclusives: alerts.filter(a => a.status === "✅ Premier détecteur").length,
    confirmedElsewhere: alerts.filter(a => a.status === "⚠️ Déjà signalé").length,
  };
  return summary;
}
