// PATH: services/runGlobal.js
// Run Global – Zones couvertes (Europe 27 + UK + Ukraine + USA + Norvège)
// ⚡ Centrale nucléaire météo – prévisions locales & nationales + alertes

import runSuperForecast from "./superForecast.js";
import { askOpenAI } from "./openaiService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { processAlerts } from "./alertsService.js";

// Liste des zones couvertes (exemple simplifié)
const coveredZones = [
  { country: "Belgium", lat: 50.85, lon: 4.35 },
  { country: "France", lat: 48.85, lon: 2.35 },
  { country: "United Kingdom", lat: 51.50, lon: -0.12 },
  { country: "Germany", lat: 52.52, lon: 13.40 },
  { country: "USA", lat: 38.90, lon: -77.03 },
  { country: "Norway", lat: 59.91, lon: 10.75 },
  { country: "Ukraine", lat: 50.45, lon: 30.52 }
  // 👉 On pourra enrichir cette liste dynamiquement via DB
];

export async function runGlobal() {
  const state = getEngineState();
  try {
    addEngineLog("🌍 Lancement du RUN GLOBAL…");

    const forecasts = [];
    const alerts = [];

    // Boucler sur les zones couvertes
    for (const zone of coveredZones) {
      try {
        const forecast = await runSuperForecast(zone);
        forecasts.push(forecast);

        // IA = analyse prévisions & détection alertes locales/nationales
        const aiPrompt = `
Analyse météo RUN GLOBAL – Zone couverte
Pays: ${zone.country}, Coord: ${zone.lat},${zone.lon}

Prévisions détaillées générées: ${JSON.stringify(forecast.forecast)}

Consignes:
1. Détecter anomalies ou risques météo (vents violents, tempêtes, inondations, chaleur extrême…).
2. Classer en alerte locale et/ou nationale.
3. Attribuer un indice de fiabilité (0–100).
4. Mentionner si nous sommes les premiers à la détecter.
Réponds en JSON: { type, zone, reliability, firstDetector }
`;

        const aiAnalysis = await askOpenAI(aiPrompt);
        let parsedAlerts = [];

        try {
          parsedAlerts = JSON.parse(aiAnalysis);
          if (!Array.isArray(parsedAlerts)) parsedAlerts = [parsedAlerts];
        } catch {
          addEngineError("⚠️ Impossible de parser les alertes IA pour " + zone.country);
        }

        alerts.push(...parsedAlerts);
      } catch (err) {
        addEngineError(`Erreur sur zone ${zone.country}: ${err.message}`);
      }
    }

    // Stocker dans state
    state.forecasts = forecasts;
    state.alertsList = alerts;
    saveEngineState(state);

    // Tri via alertsService
    const alertStats = await processAlerts();

    addEngineLog("✅ RUN GLOBAL terminé");
    return { forecasts, alerts, alertStats };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL");
    return { error: err.message };
  }
}
