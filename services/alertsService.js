// services/alertsService.js
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

/** 🔎 Génération des alertes */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = await getEngineState();
  try {
    addEngineLog(`🚨 Analyse alertes pour ${country}${region ? " - " + region : ""}`);

    const detectorResults = await detectAlerts(lat, lon, country);

    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    let hiRes = null;
    if (country === "USA") {
      hiRes = await hrrr(lat, lon);
    } else if (["FR", "BE"].includes(country)) {
      hiRes = await arome(lat, lon);
    }

    let enriched = { snow, rain, wind, stations, detectorResults, hiRes };
    enriched = await applyGeoFactors(enriched, lat, lon, country);
    enriched = await adjustWithLocalFactors(enriched, country, lat, lon);

    const anomaly = forecastVision.detectSeasonalAnomaly(
      enriched?.rain || enriched?.snow || null
    );
    if (anomaly) enriched.anomaly = anomaly;

    const prompt = `
Analyse des risques météo pour ${country}${region ? " - " + region : ""}, continent=${continent}.
Sources enrichies :
${JSON.stringify(enriched, null, 2)}
Consignes :
- Croiser toutes les données (neige, pluie, vent, stations, détecteur multi-modèles).
- Si USA → intégrer HRRR.
- Si France/Belgique → intégrer AROME.
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

    const classified = classifyAlerts(parsed);

    const alert = {
      id: Date.now().toString(),
      country,
      region,
      continent,
      data: classified,
      timestamp: new Date().toISOString(),
      note: country === "USA"
        ? "⚡ HRRR intégré (alertes haute résolution USA)"
        : ["FR", "BE"].includes(country)
        ? "⚡ AROME intégré (alertes haute résolution FR/BE)"
        : "Sources standard (multi-modèles + stations)",
    };

    activeAlerts.push(alert);
    if (activeAlerts.length > 500) activeAlerts.shift();

    // 🔥 Ajout engine-state avec timestamp alerte
    state.alerts = activeAlerts;
    state.lastAlertsGenerated = new Date().toISOString();
    await saveEngineState(state);

    addEngineLog(`✅ Alerte générée et classée pour ${country}${region ? " - " + region : ""}`);
    return alert;
  } catch (err) {
    await addEngineError(`Erreur génération alertes: ${err.message}`);
    return { error: err.message };
  }
}

export async function getActiveAlerts() {
  return activeAlerts;
}

export async function updateAlertStatus(id, action) {
  const alert = activeAlerts.find((a) => a.id === id);
  if (!alert) return { error: "Alerte introuvable" };

  alert.status = action;
  addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}
