// PATH: services/alertsService.js
// 🚨 Service central de gestion des alertes TINSFLASH – version extraction sans IA (100 % réel)

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
   🔎 GÉNÉRATION D’UNE ALERTE (PHASE 1 – Extraction sans IA)
   =========================================================== */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = await getEngineState();
  try {
    await addEngineLog(`🚨 Extraction brute pour ${country}${region ? " - " + region : ""}`);

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

    // ⚠️ 5️⃣ Pas d’IA ici — données prêtes pour analyse IA ultérieure
    const parsed = {
      type: "pending-analysis",
      confidence: 0,
      status: "to-analyze",
      note: "Analyse IA non encore effectuée (Phase 2 requise)",
      dataSources: {
        snow, rain, wind, stations, hiRes, detectorResults, anomaly,
      },
    };

    // 6️⃣ Classification simple
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

    await addEngineLog(`✅ Extraction terminée pour ${country}${region ? " – " + region : ""}`);
    return prev || newAlert;
  } catch (err) {
    await addEngineError(`Erreur extraction alertes: ${err.message}`);
    return { error: err.message };
  }
}

/* ===========================================================
   🌍 RUN GLOBAL ALERTS (Extraction mondiale sans IA)
   =========================================================== */
export async function runGlobalAlerts() {
  await addEngineLog("🚨 Extraction globale des alertes sans IA...");
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

  await addEngineLog(`✅ Extraction globale terminée (${results.length} zones)`);
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
  const alert = activeAlerts.find((a) => a.id === id);
  if (!alert) return { error: "Alerte introuvable" };
  alert.data = { ...alert.data, status: action };
  await addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}
