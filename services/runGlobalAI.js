// PATH: services/runGlobalAI.js
// 🧠 TINSFLASH – RUN GLOBAL (ÉTAPE 2: ANALYSE IA J.E.A.N.)
// Phase d’analyse et d’interprétation IA sur les données réelles déjà extraites
// ➤ Aucune nouvelle requête réseau : lecture directe du moteur (engineState.partialReport)

import { getEngineState, saveEngineState } from "./engineState.js";
import * as adminLogs from "./adminLogs.js";
import { applyGeoFactors } from "./geoFactors.js";
import adjustWithLocalFactors from "./localFactors.js";
import { askOpenAI } from "./openaiService.js";
import forecastVision from "./forecastVision.js";
import { getActiveAlerts } from "./alertsService.js";
import climateBias from "./climateBias.js"; // Optionnel si disponible
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

/* -----------------------------------------------------
   🧩 1️⃣ Préparation des données
------------------------------------------------------*/
async function prepareData() {
  const state = await getEngineState();
  if (!state.partialReport) {
    throw new Error("Aucune extraction disponible (partialReport manquant). Lancer runGlobal() d’abord.");
  }

  const alertsLocal = state.alertsLocal || [];
  const continental = state.alertsContinental || [];
  const world = state.alertsWorld || [];
  const report = state.partialReport;

  return { alertsLocal, continental, world, report, state };
}

/* -----------------------------------------------------
   🧩 2️⃣ Analyse géographique (relief / altitude / climat)
------------------------------------------------------*/
async function enrichWithGeoFactors(alerts) {
  const enriched = [];
  for (const a of alerts) {
    try {
      const base = {
        temperature: a.data?.temperature || null,
        precipitation: a.data?.precipitation || null,
        wind: a.data?.wind || null,
      };
      let adjusted = await applyGeoFactors(base, a.lat, a.lon, a.country);
      adjusted = await adjustWithLocalFactors(adjusted, a.country, a.lat, a.lon);
      const anomaly = forecastVision.detectSeasonalAnomaly(adjusted);
      const climate = climateBias ? climateBias.getRegionalBias(a.country, a.region) : null;
      enriched.push({ ...a, adjusted, anomaly, climate });
    } catch (err) {
      await adminLogs.addError(`🌍 Facteurs géo échoués (${a.country} - ${a.region}): ${err.message}`);
    }
  }
  return enriched;
}

/* -----------------------------------------------------
   🧩 3️⃣ IA J.E.A.N. – Fusion multi-modèles et raisonnement
------------------------------------------------------*/
async function analyzeWithAI(allData) {
  const results = [];
  for (const zone of allData) {
    const prompt = `
Tu es J.E.A.N., le moteur d’analyse météorologique nucléaire de TINSFLASH.
Analyse la situation suivante avec une précision scientifique :

Pays: ${zone.country}
Région: ${zone.region}
Relief et altitude ajustés: ${JSON.stringify(zone.adjusted)}
Anomalies saisonnières: ${JSON.stringify(zone.anomaly)}
Biais climatiques régionaux: ${JSON.stringify(zone.climate)}
Latitude: ${zone.lat}, Longitude: ${zone.lon}

Consignes :
1. Évalue la situation météorologique complète (température, précipitations, vent, neige, humidité)
2. Déduis les risques (pluie extrême, vent violent, neige, verglas, sécheresse, orage, canicule)
3. Pondère la confiance (0–100) selon cohérence multi-modèles et stabilité du relief
4. Fournis les conséquences et recommandations pratiques
5. Réponds STRICTEMENT en JSON :
{
  "type": "string",
  "zone": "string",
  "confidence": 0–100,
  "intensity": "string",
  "duration": "string",
  "consequences": "string",
  "recommendations": "string"
}`;

    try {
      const ai = await askOpenAI("Analyse IA J.E.A.N. – moteur TINSFLASH", prompt);
      const parsed = JSON.parse(ai);
      results.push({ ...zone, ai: parsed });
      await adminLogs.addLog(`🧠 IA J.E.A.N analysé : ${zone.country} – ${zone.region}`);
    } catch (err) {
      await adminLogs.addError(`❌ IA J.E.A.N échec sur ${zone.country} – ${zone.region}: ${err.message}`);
    }
  }
  return results;
}

/* -----------------------------------------------------
   🧩 4️⃣ Synthèse & rapport final
------------------------------------------------------*/
async function buildFinalReport(enrichedAI) {
  const summary = {
    generatedAt: new Date().toISOString(),
    analyzedZones: enrichedAI.length,
    avgConfidence:
      enrichedAI.reduce((a, z) => a + (z.ai?.confidence || 0), 0) /
      Math.max(1, enrichedAI.length),
    highConfidence: enrichedAI.filter((z) => z.ai?.confidence >= 80).length,
    lowConfidence: enrichedAI.filter((z) => z.ai?.confidence < 50).length,
  };

  const details = enrichedAI.map((z) => ({
    country: z.country,
    region: z.region,
    type: z.ai?.type,
    confidence: z.ai?.confidence,
    intensity: z.ai?.intensity,
    duration: z.ai?.duration,
    consequences: z.ai?.consequences,
    recommendations: z.ai?.recommendations,
  }));

  return { summary, details };
}

/* -----------------------------------------------------
   🚀 5️⃣ RUN GLOBAL – PHASE 2 (IA J.E.A.N.)
------------------------------------------------------*/
export async function runGlobalAI() {
  await adminLogs.startNewCycle("IA");
  await adminLogs.addLog("🧠 Lancement RUN GLOBAL IA J.E.A.N...");

  try {
    const { alertsLocal, continental, world, report, state } = await prepareData();
    const allAlerts = [...alertsLocal, ...continental, ...world];
    await adminLogs.addLog(`📊 ${allAlerts.length} zones à traiter par J.E.A.N.`);

    const geoEnriched = await enrichWithGeoFactors(allAlerts);
    await adminLogs.addLog("🌍 Facteurs géographiques appliqués.");

    const aiResults = await analyzeWithAI(geoEnriched);
    await adminLogs.addLog("🤖 IA J.E.A.N a terminé son analyse.");

    const finalReport = await buildFinalReport(aiResults);

    state.status = "analyzed";
    state.lastRunAI = new Date();
    state.checkup = state.checkup || {};
    state.checkup.engineStatus = "OK-AI";
    state.finalReport = finalReport;
    state.aiAnalysis = aiResults;

    await saveEngineState(state);
    await adminLogs.addLog("✅ Étape 2 terminée – Rapport final IA généré avec succès.");
    return { success: true, finalReport };
  } catch (err) {
    await adminLogs.addError("❌ RUN GLOBAL IA J.E.A.N échec: " + err.message);
    const s = await getEngineState();
    s.status = "fail";
    s.checkup = s.checkup || {};
    s.checkup.engineStatus = "FAIL-AI";
    await saveEngineState(s);
    return { success: false, error: err.message };
  }
}
