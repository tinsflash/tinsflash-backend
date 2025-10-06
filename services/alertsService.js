// PATH: services/alertsService.js
// 🚨 Service central de gestion des alertes TINSFLASH (réel et connecté)

import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";
import { askOpenAI } from "./openaiService.js";
import { analyzeSnow } from "./snowService.js";
import { analyzeRain } from "./rainService.js";
import { analyzeWind } from "./windService.js";
import { fetchStationData } from "./stationsService.js";
import { detectAlerts } from "./alertDetector.js";
import { classifyAlerts } from "./alertsEngine.js";
import { applyGeoFactors } from "./geoFactors.js";
import adjustWithLocalFactors from "./localFactors.js";
import forecastVision from "./forecastVision.js";
import hrrr from "./hrrr.js";
import arome from "./arome.js";
import { checkExternalAlerts } from "./externalAlerts.js";
import Alert from "../models/Alert.js";

import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";
import { runContinental } from "./runContinental.js";

let activeAlerts = [];

/* ===========================================================
   🔎 GÉNÉRATION D’UNE ALERTE (POINT UNIQUE)
   =========================================================== */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = await getEngineState();
  try {
    await addEngineLog(`🚨 Analyse alertes pour ${country}${region ? " - " + region : ""}`);

    // 1️⃣ Détection brute multi-modèles
    const detectorResults = await detectAlerts({ lat, lon, country }, { scope: continent, country });

    // 2️⃣ Modules spécialisés
    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    // 3️⃣ Modèles haute résolution (HRRR / AROME)
    let hiRes = null;
    if (country === "USA") hiRes = await hrrr(lat, lon);
    else if (["France", "Belgium"].includes(country)) hiRes = await arome(lat, lon);

    // 4️⃣ Ajustements géo/climat/relief
    let base = {
      temperature: rain?.temperature ?? snow?.temperature ?? null,
      precipitation: rain?.precipitation ?? snow?.precipitation ?? null,
      wind: wind?.speed ?? null,
    };
    base = await applyGeoFactors(base, lat, lon, country);
    base = await adjustWithLocalFactors(base, country, lat, lon);
    const anomaly = forecastVision.detectSeasonalAnomaly(base);
    if (anomaly) base.anomaly = anomaly;

    // 5️⃣ IA d’analyse globale
    const prompt = `
Analyse des risques météo pour ${country}${region ? " - " + region : ""}, continent=${continent}.
Sources enrichies :
- Neige: ${JSON.stringify(snow)}
- Pluie: ${JSON.stringify(rain)}
- Vent: ${JSON.stringify(wind)}
- Détecteur brut: ${JSON.stringify(detectorResults)}
- Stations: ${JSON.stringify(stations?.summary || {})}
- Haute résolution: ${JSON.stringify(hiRes || {})}
- Anomalies: ${JSON.stringify(anomaly || {})}

Consignes :
Croise toutes les données. Ajuste selon relief, climat, saison et latitude.
Réponds STRICTEMENT en JSON avec :
{ type, zone, confidence(0–100), intensité, conséquences, recommandations, durée }.
`;
    const aiResult = await askOpenAI("Tu es un moteur d’alerte météo nucléaire", prompt);

    let parsed;
    try {
      parsed = JSON.parse(aiResult);
    } catch {
      parsed = { type: "unknown", confidence: 0, note: "JSON invalide", raw: aiResult };
    }

    // 6️⃣ Classification
    let classified = classifyAlerts(parsed);

    // 7️⃣ Vérification externe (MeteoAlarm, NWS, etc.)
    const externals = await checkExternalAlerts(lat, lon, country, region);
    const exclusivity = externals.length ? "confirmed-elsewhere" : "exclusive";
    classified = { ...classified, external: { exclusivity, providers: externals } };

    // 8️⃣ Assemblage alerte consolidée
    const keyType = classified.type || parsed.type || "unknown";
    const newAlert = {
      id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      type: keyType,
      country,
      region,
      continent,
      lat,
      lon,
      data: classified,
      timestamp: new Date().toISOString(),
      note:
        country === "USA"
          ? "⚡ HRRR intégré (USA)"
          : ["France", "Belgium"].includes(country)
          ? "⚡ AROME intégré (FR/BE)"
          : "Sources multi-modèles + stations",
    };

    // 9️⃣ Fusion / suivi
    const prev = activeAlerts.find(
      (a) =>
        a.country === country &&
        a.region === region &&
        a.type === keyType &&
        a.data?.status !== "archived"
    );

    if (prev) {
      prev.data = {
        ...newAlert.data,
        history: Array.isArray(prev.data.history)
          ? [...prev.data.history, ...newAlert.data.history]
          : newAlert.data.history,
        disappearedRunsCount: 0,
        firstExclusivity:
          prev.data.firstExclusivity ||
          (newAlert.data.external?.exclusivity === "exclusive" ? "exclusive" : "non-exclusive"),
        lastExclusivity: newAlert.data.external?.exclusivity,
      };
      prev.timestamp = newAlert.timestamp;
      prev.note = newAlert.note;
    } else {
      newAlert.data.firstExclusivity = exclusivity;
      newAlert.data.lastExclusivity = exclusivity;
      activeAlerts.push(newAlert);
      if (activeAlerts.length > 2000) activeAlerts.shift();
    }

    // 🔥 Sauvegarde état moteur
    state.alerts = activeAlerts;
    state.lastAlertsGenerated = new Date().toISOString();
    await saveEngineState(state);

    await addEngineLog(`✅ Alerte générée (${exclusivity}) pour ${country}${region ? " – " + region : ""}`);
    return prev || newAlert;
  } catch (err) {
    await addEngineError(`Erreur génération alertes: ${err.message}`);
    return { error: err.message };
  }
}

/* ===========================================================
   📦 GETTERS / UPDATERS
   =========================================================== */
export async function getActiveAlerts() {
  return [...activeAlerts];
}

export async function updateAlertStatus(id, action) {
  const alert = activeAlerts.find((a) => a.id === id);
  if (!alert) return { error: "Alerte introuvable" };
  alert.data = { ...alert.data, status: action };
  await addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}

/* ===========================================================
   🧮 SYNTHÈSE SURVEILLANCE
   =========================================================== */
export async function getSurveillanceSummary() {
  const summary = {
    total: activeAlerts.length,
    byStatus: {
      published: 0,
      toValidate: 0,
      "under-surveillance": 0,
      "low-confidence": 0,
      archived: 0,
    },
    byConfidence: { "0-49": 0, "50-69": 0, "70-89": 0, "90-100": 0 },
    exclusives: 0,
    confirmedElsewhere: 0,
  };

  for (const a of activeAlerts) {
    const s = a.data?.status || "under-surveillance";
    if (summary.byStatus[s] != null) summary.byStatus[s]++;
    const c = a.data?.confidence ?? 0;
    if (c < 50) summary.byConfidence["0-49"]++;
    else if (c < 70) summary.byConfidence["50-69"]++;
    else if (c < 90) summary.byConfidence["70-89"]++;
    else summary.byConfidence["90-100"]++;
    const ex = a.data?.external?.exclusivity;
    if (ex === "exclusive") summary.exclusives++;
    if (ex === "confirmed-elsewhere") summary.confirmedElsewhere++;
  }

  return summary;
}

/* ===========================================================
   💤 MARQUAGE DES ALERTES DISPARUES
   =========================================================== */
export async function markDisappearedSince(lastRunSeenIds = []) {
  const seen = new Set(lastRunSeenIds);
  let changed = false;
  for (const a of activeAlerts) {
    if (a.data?.status === "archived") continue;
    if (!seen.has(a.id)) {
      const d = (a.data?.disappearedRunsCount ?? 0) + 1;
      a.data.disappearedRunsCount = d;
      if (d >= 6) a.data.status = "archived";
      changed = true;
    } else {
      if (a.data?.disappearedRunsCount) a.data.disappearedRunsCount = 0;
    }
  }
  if (changed) {
    const state = await getEngineState();
    state.alerts = activeAlerts;
    await saveEngineState(state);
  }
  return { changed };
}

/* ===========================================================
   🌍 AUTO-RUN ALERTES GLOBALES
   =========================================================== */
export async function runGlobalAlerts() {
  await addEngineLog("🚨 Lancement global des alertes sur toutes les zones couvertes...");
  const state = await getEngineState();

  const allZones = [
    ...Object.entries(EUROPE_ZONES).flatMap(([country, zones]) =>
      zones.map((z) => ({ ...z, country, continent: "Europe" }))
    ),
    ...Object.entries(USA_ZONES).flatMap(([country, zones]) =>
      zones.map((z) => ({ ...z, country, continent: "USA" }))
    ),
  ];

  const results = [];
  let processed = 0;

  for (const z of allZones) {
    const lat = z.lat ?? z.latitude;
    const lon = z.lon ?? z.longitude;
    if (!lat || !lon) continue;
    const r = await generateAlerts(lat, lon, z.country, z.region || z.name, z.continent);
    results.push(r);
    processed++;
    if (processed % 20 === 0)
      await addEngineLog(`📡 ${processed}/${allZones.length} zones traitées...`);
  }

  // === Continental fallback ===
  const cont = await runContinental();
  if (cont?.forecasts) {
    for (const [region, info] of Object.entries(cont.forecasts)) {
      if (info?.lat && info?.lon) {
        const r = await generateAlerts(info.lat, info.lon, region, region, "World");
        results.push(r);
      }
    }
  }

  await addEngineLog(`✅ Génération globale terminée (${results.length} alertes actives)`);
  state.alerts = await getActiveAlerts();
  await saveEngineState(state);
  return results;
}
