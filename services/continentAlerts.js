// services/continentAlerts.js
// Gestion des alertes continentales pour les zones non couvertes
import { detectAlerts } from "./alertDetector.js";
import { processAlerts } from "./alertsEngine.js";
import { addLog } from "./adminLogs.js";
import { addEngineError, addEngineLog } from "./engineState.js";
import openweather from "./openweather.js";

// Continents non couverts (exclut Europe et USA déjà traités)
const CONTINENTS = {
  Africa: { lat: 1.6508, lon: 17.6874 },
  Asia: { lat: 34.0479, lon: 100.6197 },
  "South America": { lat: -8.7832, lon: -55.4915 },
  Oceania: { lat: -22.7359, lon: 140.0188 }
};

/**
 * Lance la détection d’alertes continentales
 * @returns {Array} alertes par continent
 */
export async function runContinentAlerts() {
  const allContinentAlerts = [];

  addLog("🌍 Détection alertes continentales démarrée");
  addEngineLog("🌍 Détection alertes continentales démarrée");

  for (const [continent, coords] of Object.entries(CONTINENTS)) {
    try {
      // 1) Récupération météo brute (openweather car global)
      const ow = await openweather(coords.lat, coords.lon);

      const numeric = {
        rain: ow?.precipitation ?? ow?.rain ?? null,
        wind: typeof ow?.wind === "number" ? Math.round(ow.wind * 3.6) : (ow?.wind?.speed_kmh ?? null),
        temp: ow?.temperature ?? ow?.temp ?? null
      };

      // 2) Détection alertes
      const rawAlerts = detectAlerts(numeric);

      // 3) Enrichissement avec moteur IA
      const enriched = await processAlerts(rawAlerts, { continent, coords, scope: "global" });
      allContinentAlerts.push(...enriched);

      addEngineLog(`✅ ${continent}: ${enriched.length} alerte(s) détectée(s)`);

    } catch (err) {
      addEngineError(`❌ ${continent}: ${err.message}`);
    }
  }

  addLog("🌍 Détection alertes continentales terminée");
  addEngineLog("🌍 Détection alertes continentales terminée");

  return allContinentAlerts;
}
