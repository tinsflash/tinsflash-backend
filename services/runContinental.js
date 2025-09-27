// services/runContinental.js
// 🌍 Détection continentale — Zones non couvertes
// ⚡ Détecte uniquement les anomalies majeures par continent

import openweather from "./openweather.js";
import { detectAlerts, classifyAlerts } from "./alertDetector.js";
import { addLog } from "./adminLogs.js";
import { getEngineState, saveEngineState, addEngineLog, addEngineError } from "./engineState.js";

// Regroupement continental (simplifié, évolutif)
const CONTINENTS = {
  Europe: ["Turkey", "Switzerland", "Serbia", "Albania"],
  Africa: ["Morocco", "Algeria", "Tunisia", "Egypt", "South Africa"],
  Asia: ["China", "India", "Japan", "Saudi Arabia"],
  America: ["Canada", "Mexico", "Brazil", "Argentina"],
  Oceania: ["Australia", "New Zealand"]
};

export default async function runContinental() {
  const startedAt = new Date().toISOString();
  addLog("RUN CONTINENTAL démarré");
  addEngineLog("RUN CONTINENTAL démarré");

  const zonesProcessed = {};
  const allAlerts = [];

  try {
    for (const [continent, sampleCountries] of Object.entries(CONTINENTS)) {
      try {
        // On prend quelques points de référence par continent
        let continentAlerts = [];

        for (const country of sampleCountries) {
          // Coordonnées approximatives (centres pays simplifiés)
          // ⚠️ Ces coordonnées devront être raffinées pour chaque pays
          const sampleLat = Math.random() * 60 - 30; // lat simulée
          const sampleLon = Math.random() * 120 - 60; // lon simulée

          const ow = await openweather(sampleLat, sampleLon);

          if (ow) {
            const numeric = {
              rain: ow?.precipitation ?? ow?.rain ?? null,
              wind: typeof ow?.wind === "number" ? Math.round(ow.wind * 3.6) : (ow?.wind?.speed_kmh ?? null),
              temp: ow?.temperature ?? ow?.temp ?? null
            };

            const raw = detectAlerts(numeric);
            const enriched = classifyAlerts(raw, { continent });
            continentAlerts.push(...enriched);
          }
        }

        allAlerts.push(...continentAlerts);
        zonesProcessed[continent] = true;
        addEngineLog(`✅ ${continent}: ${continentAlerts.length} alertes`);
      } catch (err) {
        addEngineError(`❌ ${continent}: ${err.message}`);
        zonesProcessed[continent] = false;
      }
    }
  } catch (err) {
    addEngineError(`❌ RUN CONTINENTAL global: ${err.message}`);
  }

  const prev = getEngineState();
  const newState = {
    runTime: startedAt,
    zonesContinental: zonesProcessed,
    alertsList: [...(prev.alertsList || []), ...allAlerts],
    errors: prev.errors || [],
    logs: prev.logs || []
  };

  saveEngineState(newState);
  addLog("RUN CONTINENTAL terminé");
  addEngineLog("RUN CONTINENTAL terminé");

  return {
    startedAt,
    continentsProcessed: Object.keys(zonesProcessed).length,
    alerts: allAlerts.length
  };
}
