// services/alertsService.js
// 🚨 Orchestration nucléaire des alertes météo

import Alert from "../models/Alerts.js"; // ✅ ton modèle Mongo
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
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

let activeAlerts = [];

/** 🔎 Génération et stockage DB */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = await getEngineState();
  try {
    addEngineLog(`🚨 Analyse alertes pour ${country}${region ? " - " + region : ""}`);

    // 1. Détection brute
    const detectorResults = await detectAlerts(lat, lon, country);

    // 2. Collecte
    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    let hiRes = null;
    if (country === "USA") hiRes = await hrrr(lat, lon);
    else if (["FR", "BE"].includes(country)) hiRes = await arome(lat, lon);

    // 3. Facteurs enrichis
    let enriched = { snow, rain, wind, stations, detectorResults, hiRes };
    enriched = await applyGeoFactors(enriched, lat, lon, country);
    enriched = await adjustWithLocalFactors(enriched, country, lat, lon);

    const anomaly = forecastVision.detectSeasonalAnomaly(
      enriched?.rain || enriched?.snow || null
    );
    if (anomaly) enriched.anomaly = anomaly;

    // 4. IA
    const prompt = `
Analyse des risques météo pour ${country}${region ? " - " + region : ""}, continent=${continent}.
Sources enrichies :
${JSON.stringify(enriched, null, 2)}

Consignes :
- Croiser toutes les données.
- Intégrer HRRR si USA, AROME si FR/BE.
- Ajuster relief/climat/saison.
- Détecter anomalies saisonnières (${JSON.stringify(anomaly)}).
- Classer: type, zone, fiabilité, intensité, conséquences, recommandations, durée.
- Format JSON strict.
    `;

    const aiResult = await askOpenAI("Tu es un moteur nucléaire d’alerte météo", prompt);
    let parsed;
    try { parsed = JSON.parse(aiResult); } catch { parsed = { raw: aiResult }; }

    // 5. Classement
    const classified = classifyAlerts(parsed);

    // 6. Stockage mémoire + DB
    const alert = {
      id: Date.now().toString(),
      country,
      region,
      continent,
      data: classified,
      timestamp: new Date().toISOString(),
      note: country === "USA"
        ? "⚡ HRRR intégré (USA haute résolution)"
        : ["FR", "BE"].includes(country)
        ? "⚡ AROME intégré (FR/BE haute résolution)"
        : "Sources multi-modèles standard",
      status: "pending"
    };

    activeAlerts.push(alert);
    if (activeAlerts.length > 500) activeAlerts.shift();

    state.alerts = activeAlerts;
    await saveEngineState(state);

    // ✅ En DB
    await Alert.create(alert);

    addEngineLog(`✅ Alerte générée et classée pour ${country}${region ? " - " + region : ""}`);
    return alert;
  } catch (err) {
    await addEngineError(`Erreur génération alertes: ${err.message}`);
    return { error: err.message };
  }
}

/** 🔎 Liste active depuis DB */
export async function getActiveAlerts() {
  const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
  activeAlerts = alerts;
  return alerts;
}

/** 🔧 Mise à jour statut (admin) */
export async function updateAlertStatus(id, action) {
  const alert = await Alert.findOneAndUpdate(
    { id },
    { $set: { status: action } },
    { new: true }
  );
  if (!alert) return { error: "Alerte introuvable" };

  addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}
