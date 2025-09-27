// services/runContinental.js
// 🌍 RUN CONTINENTAL — Zones non couvertes
import { resetEngineState, saveEngineState, addLog, getEngineState } from "./engineState.js";
import { classifyAlert, resetAlerts } from "./alertsService.js";

// Continents surveillés
const CONTINENTS = ["Africa", "Asia", "South America", "Oceania"];

export default async function runContinental() {
  resetEngineState();
  resetAlerts();
  addLog("🔵 RUN CONTINENTAL démarré", "system");

  const startedAt = new Date().toISOString();
  const modelsOk = ["GFS", "ECMWF", "ICON"]; // modèles globaux utilisés
  const modelsKo = []; // à remplir si échec
  const sourcesOk = ["NASA", "Copernicus"];
  const sourcesKo = [];

  const alertsGenerated = [];

  for (const continent of CONTINENTS) {
    try {
      addLog(`⏳ Analyse continentale ${continent}…`, "info");

      // 🔎 Ici, dans le vrai moteur → on scanne les anomalies sur GFS/ECMWF/ICON
      // Exemple simplifié : simulation d’une anomalie détectée
      const anomalyRisk = Math.random(); // ⚠️ remplacer par vraie analyse IA
      if (anomalyRisk > 0.65) {
        const alert = {
          id: `${continent}-${Date.now()}`,
          zone: continent,
          fiability: Math.round(anomalyRisk * 100),
          details: { anomaly: true, risk: anomalyRisk },
        };
        classifyAlert(alert);
        alertsGenerated.push(alert);
      }

      addLog(`✅ ${continent} analysé`, "success");
    } catch (err) {
      addLog(`❌ Erreur ${continent}: ${err.message}`, "error");
      modelsKo.push(continent);
    }
  }

  // 🔄 Finalisation moteur
  saveEngineState({
    runTime: startedAt,
    models: { ok: modelsOk, ko: modelsKo },
    sources: { ok: sourcesOk, ko: sourcesKo },
    alerts: {
      local: false,
      national: false,
      continental: alertsGenerated.length > 0,
      world: alertsGenerated.length > 0,
    },
    ia: { forecasts: false, alerts: true }, // pas de prévisions, mais alertes IA faites
  });

  addLog("🟢 RUN CONTINENTAL terminé", "system");

  return {
    startedAt,
    modelsOk,
    modelsKo,
    sourcesOk,
    sourcesKo,
    continentsProcessed: CONTINENTS,
    alertsGenerated: alertsGenerated.length,
  };
}
