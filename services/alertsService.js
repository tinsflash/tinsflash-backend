// services/alertsService.js
// 🚨 Orchestration nucléaire des alertes météo
// Pipeline : Detector → Facteurs → IA → Classement

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { askOpenAI } from "./openaiService.js";

// Modules spécialisés
import { analyzeSnow } from "./snowService.js";
import { analyzeRain } from "./rainService.js";
import { analyzeWind } from "./windService.js";
import { fetchStationData } from "./stationsService.js";
import { detectAlerts } from "./alertDetector.js";      // Pré-détection brute
import { classifyAlerts } from "./alertsEngine.js";     // Classement final
import { applyGeoFactors } from "./geoFactors.js";      // ✅ export nommé
import adjustWithLocalFactors from "./localFactors.js"; // saison/spatial
import forecastVision from "./forecastVision.js";       // anomalies saisonnières

let activeAlerts = [];

/** 🔎 Génération des alertes (zones couvertes + continentales) */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = await getEngineState();
  try {
    addEngineLog(`🚨 Analyse alertes pour ${country}${region ? " - " + region : ""}`);

    // 1️⃣ Pré-détection brute
    const detectorResults = await detectAlerts(lat, lon, country);

    // 2️⃣ Collecte brute spécialisée
    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    // 3️⃣ Enrichissements relief/saison/anomalies
    let enriched = { snow, rain, wind, stations, detectorResults };
    enriched = await applyGeoFactors(enriched, lat, lon, country);
    enriched = await adjustWithLocalFactors(enriched, country, lat, lon);

    const anomaly = forecastVision.detectSeasonalAnomaly(
      enriched?.rain || enriched?.snow || null
    );
    if (anomaly) enriched.anomaly = anomaly;

    // 4️⃣ IA nucléaire → synthèse
    const prompt = `
Analyse des risques météo pour ${country}${region ? " - " + region : ""}, continent=${continent}.
Sources enrichies :
${JSON.stringify(enriched, null, 2)}

Consignes :
- Croiser toutes les données (neige, pluie, vent, stations, détecteur multi-modèles).
- Ajuster selon relief, climat, altitude et saison.
- Tenir compte des anomalies saisonnières détectées (${JSON.stringify(anomaly)}).
- Déterminer si une alerte doit être générée.
- Classer: type, zone, fiabilité (0–100), intensité, conséquences, recommandations, durée.
- Répondre format JSON strict.
    `;

    const aiResult = await askOpenAI("Tu es un moteur d’alerte météo nucléaire", prompt);

    let parsed;
    try {
      parsed = JSON.parse(aiResult);
    } catch {
      parsed = { raw: aiResult };
    }

    // 5️⃣ Classement final auto
    const classified = classifyAlerts(parsed);

    // 6️⃣ Stockage
    const alert = {
      id: Date.now().toString(),
      country,
      region,
      continent,
      data: classified,
      timestamp: new Date().toISOString(),
    };

    activeAlerts.push(alert);
    if (activeAlerts.length > 500) activeAlerts.shift();

    state.alerts = activeAlerts;
    await saveEngineState(state);

    addEngineLog(`✅ Alerte générée et classée pour ${country}${region ? " - " + region : ""}`);
    return alert;
  } catch (err) {
    await addEngineError(`Erreur génération alertes: ${err.message}`);
    return { error: err.message };
  }
}

/** 🔎 Liste active */
export async function getActiveAlerts() {
  return activeAlerts;
}

/** 🔧 Mise à jour statut (admin) */
export async function updateAlertStatus(id, action) {
  const alert = activeAlerts.find((a) => a.id === id);
  if (!alert) return { error: "Alerte introuvable" };

  alert.status = action;
  addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}
