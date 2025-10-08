// ==========================================================
// 🚨 TINSFLASH – Service d'alertes globales
// Everest Protocol v1 – 100 % réel, IA-ready
// ==========================================================

import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";
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
   🔎 Génération d’une alerte (extraction réelle, sans IA)
   =========================================================== */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = await getEngineState();
  try {
    await addEngineLog(`🚨 Extraction brute pour ${country}${region ? " - " + region : ""}`);

    // 1️⃣ Détection multi-modèles
    const detectorResults = await detectAlerts({ lat, lon, country }, { scope: continent, country });

    // 2️⃣ Modules spécialisés
    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    // 3️⃣ Modèles HRRR / AROME selon la zone
    let hiRes = null;
    if (country === "USA") hiRes = await hrrr(lat, lon);
    else if (["France", "Belgium"].includes(country)) hiRes = await arome(lat, lon);

    // 4️⃣ Ajustements relief / climat local
    let base = {
      temperature: rain?.temperature ?? snow?.temperature ?? null,
      precipitation: rain?.precipitation ?? snow?.precipitation ?? null,
      wind: wind?.speed ?? null,
    };
    base = await applyGeoFactors(base, lat, lon, country);
    base = await adjustWithLocalFactors(base, country, lat, lon);
    const anomaly = forecastVision.detectSeasonalAnomaly(base);
    if (anomaly) base.anomaly = anomaly;

    // 5️⃣ Données consolidées
    const parsed = {
      type: "pending-analysis",
      confidence: 0,
      status: "to-analyze",
      note: "Analyse IA non encore effectuée (Phase 2 requise)",
      dataSources: { snow, rain, wind, stations, hiRes, detectorResults, anomaly },
    };

    // 6️⃣ Classification simple
    let classified = classifyAlerts(parsed);

    // 7️⃣ Vérification externe
    const externals = await checkExternalAlerts(lat, lon, country, region);
    const exclusivity = externals.length ? "confirmed-elsewhere" : "exclusive";
    classified = { ...classified, external: { exclusivity, providers: externals } };

    // 8️⃣ Taux de certitude
    const reliabilityScore =
      Math.min(
        100,
        Math.round(
          ([
            snow?.reliability ?? 0,
            rain?.reliability ?? 0,
            wind?.reliability ?? 0,
            stations?.reliability ?? 0,
          ].reduce((a, b) => a + b, 0) / 4) * 100
        )
      ) || 40;

    // 9️⃣ Création / mise à jour Mongo
    const keyType = classified.type || parsed.type || "unknown";
    const alertData = {
      title: `${keyType} (${country})`,
      description: `${region || "Zone locale"} – phénomène ${keyType} (${reliabilityScore}%)`,
      zone: `${country} - ${region || "global"}`,
      certainty: reliabilityScore,
      modelsUsed: ["Snow", "Rain", "Wind", "Stations", "HRRR/AROME"],
      firstDetection: new Date(),
      lastCheck: new Date(),
      status:
        reliabilityScore >= 90
          ? "auto_published"
          : reliabilityScore >= 70
          ? "validated"
          : "under_watch",
      validationState:
        reliabilityScore >= 90 ? "confirmed" : reliabilityScore >= 70 ? "review" : "pending",
      geo: { lat, lon },
      sources: ["TINSFLASH", ...externals.map((e) => e.name || "unknown")],
      history: [{ ts: new Date(), note: `Détection ${keyType} (${reliabilityScore}%)` }],
    };

    let existing = await Alert.findOne({ "geo.lat": lat, "geo.lon": lon, title: alertData.title });
    if (existing) {
      existing.lastCheck = new Date();
      existing.certainty = reliabilityScore;
      existing.status = alertData.status;
      existing.validationState = alertData.validationState;
      existing.history.push({ ts: new Date(), note: `Mise à jour ${reliabilityScore}%` });
      await existing.save();
    } else {
      existing = new Alert(alertData);
      await existing.save();
    }

    // 10️⃣ Sauvegarde mémoire moteur
    const prev = activeAlerts.find((a) => a.id === existing._id.toString());
    if (prev) Object.assign(prev, existing.toObject());
    else {
      activeAlerts.push({ id: existing._id.toString(), ...alertData });
      if (activeAlerts.length > 2000) activeAlerts.shift();
    }

    state.alerts = activeAlerts;
    state.lastAlertsGenerated = new Date().toISOString();
    await saveEngineState(state);
    await addEngineLog(`✅ Alerte ${keyType} enregistrée (${reliabilityScore}%)`);
    return existing;
  } catch (err) {
    await addEngineError(`Erreur extraction alertes: ${err.message}`);
    return { error: err.message };
  }
}

/* ===========================================================
   🌍 RUN GLOBAL ALERTS
   =========================================================== */
export async function runGlobalAlerts() {
  await addEngineLog("🚨 Extraction globale (Everest v1)...");
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
    if (processed % 25 === 0)
      await addEngineLog(`📡 ${processed}/${allZones.length} zones traitées...`);
  }

  // Continental fallback
  const cont = await runContinental();
  if (cont?.forecasts) {
    for (const [region, info] of Object.entries(cont.forecasts)) {
      if (info?.lat && info?.lon)
        results.push(await generateAlerts(info.lat, info.lon, region, region, "World"));
    }
  }

  await addEngineLog(`✅ Extraction mondiale terminée (${results.length} zones)`);
  state.alerts = await getActiveAlerts();
  await saveEngineState(state);
  return results;
}

/* ===========================================================
   📦 GETTERS / UPDATERS
   =========================================================== */
export async function getActiveAlerts() {
  return [...activeAlerts];
}

export async function updateAlertStatus(id, action) {
  const alert = await Alert.findById(id);
  if (!alert) return { error: "Alerte introuvable" };
  alert.status = action;
  alert.history.push({ ts: new Date(), note: `Mise à jour → ${action}` });
  await alert.save();
  await addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}
