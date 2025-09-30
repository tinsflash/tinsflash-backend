// services/alertsService.js
// 🚨 Génération et orchestration des alertes météo
// Sources : snowService + rainService + windService + stationsService
// Analyse IA : ChatGPT-5 → détection anomalies, adaptation relief/altitude

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { analyzeSnow } from "./snowService.js";
import { analyzeRain } from "./rainService.js";
import { analyzeWind } from "./windService.js";
import { fetchStationData } from "./stationsService.js";
import { askOpenAI } from "./openaiService.js";

// ⚡ Mémoire des alertes actives
let activeAlerts = [];

/** 🔎 Génération d’une alerte brute pour une zone */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = getEngineState();
  try {
    addEngineLog(`🚨 Analyse alertes pour ${country}${region ? " - " + region : ""}`);

    // Collecte brute (multi-sources)
    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    // Prompt IA
    const prompt = `
Analyse des risques météo pour ${country}${region ? " - " + region : ""}, continent=${continent}.
Sources:
- Neige: ${JSON.stringify(snow)}
- Pluie: ${JSON.stringify(rain)}
- Vent: ${JSON.stringify(wind)}
- Stations locales: ${JSON.stringify(stations)}

Consignes:
- Croiser toutes les données (modèles, stations).
- Ajuster selon relief, climat, altitude (avalanche si montagne, crues si vallée, etc.).
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

    const alert = {
      id: Date.now().toString(),
      country,
      region,
      continent,
      data: parsed,
      timestamp: new Date().toISOString(),
      status: "active",
    };

    // 🔹 Push + limitation mémoire (10 000 max, FIFO)
    activeAlerts.push(alert);
    if (activeAlerts.length > 10000) activeAlerts.shift();

    // 🔹 Nettoyage des alertes expirées (si champ fin dispo)
    const now = Date.now();
    activeAlerts = activeAlerts.filter((a) => {
      const fin = a?.data?.fin ? new Date(a.data.fin).getTime() : null;
      return !fin || fin > now;
    });

    state.alerts = activeAlerts;
    saveEngineState(state);

    addEngineLog(`✅ Alerte générée pour ${country}${region ? " - " + region : ""}`);
    return alert;
  } catch (err) {
    addEngineError(`Erreur génération alertes: ${err.message}`);
    return { error: err.message };
  }
}

/** 🔎 Liste active */
export async function getActiveAlerts() {
  return activeAlerts;
}

/** 🔧 Mise à jour statut (admin console) */
export async function updateAlertStatus(id, action) {
  const alert = activeAlerts.find((a) => a.id === id);
  if (!alert) return { error: "Alerte introuvable" };

  alert.status = action;
  addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}
