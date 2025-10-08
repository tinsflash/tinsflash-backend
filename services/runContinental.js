// ==========================================================
// 🌍 TINSFLASH – Continental Engine (Everest Protocol v1.3 PRO++)
// Fusion multi-modèles continentale : Europe, USA, Monde
// ==========================================================

import superForecast from "./superForecast.js"; // ✅ correction : export par défaut
import { addEngineLog, addEngineError, getEngineState, saveEngineState } from "./engineState.js";
import { enumerateCoveredPoints } from "./zonesCovered.js";
import { applyGeoFactors } from "./geoFactors.js";
import adjustWithLocalFactors from "./localFactors.js";
import { detectAlerts } from "./alertDetector.js";
import { classifyAlerts } from "./alertsEngine.js";
import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { analyzeRain } from "./rainService.js";
import { analyzeWind } from "./windService.js";
import { analyzeSnow } from "./snowService.js";
import { checkExternalAlerts } from "./externalAlerts.js";
import Alert from "../models/Alert.js";

// ==========================================================
// 🧠 Exécution continentale
// ==========================================================
export async function runContinental() {
  try {
    await addEngineLog("🌎 Lancement du module Continental (fusion EU/USA/World)");

    const state = await getEngineState();
    const europe = await runGlobalEurope();
    const usa = await runGlobalUSA();
    const forecasts = await superForecast(); // ✅ correction ici
    const alerts = [];

    const allZones = [
      ...Object.entries(europe.forecasts || {}).map(([k, v]) => ({ ...v, zone: k, continent: "Europe" })),
      ...Object.entries(usa.forecasts || {}).map(([k, v]) => ({ ...v, zone: k, continent: "USA" })),
      ...Object.entries(forecasts || {}).map(([k, v]) => ({ ...v, zone: k, continent: "World" })),
    ];

    let processed = 0;

    for (const z of allZones) {
      try {
        const { lat, lon, zone, continent } = z;
        if (!lat || !lon) continue;

        // 🔹 Analyse physique
        const rain = await analyzeRain(lat, lon, zone, continent);
        const wind = await analyzeWind(lat, lon, zone, continent);
        const snow = await analyzeSnow(lat, lon, zone, continent);

        // 🔹 Ajustements géographiques & locaux
        let base = { temperature: rain.temperature ?? snow.temperature, precipitation: rain.precipitation ?? snow.precipitation, wind: wind.speed ?? 0 };
        base = await applyGeoFactors(base, lat, lon, zone);
        base = await adjustWithLocalFactors(base, zone, lat, lon);

        // 🔹 Détection d’anomalie et classification
        const detected = await detectAlerts({ lat, lon, country: zone }, { scope: continent });
        const classified = classifyAlerts({ ...detected, dataSources: { rain, wind, snow } });

        // 🔹 Vérification externe
        const externals = await checkExternalAlerts(lat, lon, zone);
        const exclusivity = externals.length ? "confirmed-elsewhere" : "exclusive";

        const alert = new Alert({
          title: classified.type || "Anomalie météo",
          zone,
          continent,
          certainty: classified.confidence ?? 80,
          status: classified.confidence >= 90 ? "auto_published" : classified.confidence >= 70 ? "validated" : "under_watch",
          validationState: classified.confidence >= 90 ? "confirmed" : classified.confidence >= 70 ? "review" : "pending",
          geo: { lat, lon },
          sources: ["TINSFLASH", ...externals.map(e => e.name || "unknown")],
          external: { exclusivity, providers: externals },
          firstDetection: new Date(),
          lastCheck: new Date(),
        });

        await alert.save();
        alerts.push(alert);
        processed++;

        if (processed % 25 === 0)
          await addEngineLog(`📡 ${processed}/${allZones.length} zones continentales traitées...`);
      } catch (err) {
        await addEngineError(`Erreur zone continentale: ${err.message}`);
      }
    }

    // 🔹 Sauvegarde moteur
    state.alertsContinental = alerts;
    state.lastRunContinental = new Date();
    await saveEngineState(state);

    await addEngineLog(`✅ Continental terminé (${alerts.length} alertes consolidées)`);
    return { success: true, forecasts, alerts };
  } catch (err) {
    await addEngineError(`Erreur runContinental: ${err.message}`);
    return { success: false, error: err.message };
  }
}
