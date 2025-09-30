// services/alertsService.js
// 🚨 Génération et orchestration des alertes météo
// Sources : snowService + rainService + windService + stationsService
// Analyse IA : ChatGPT-5 → détection anomalies, adaptation relief/altitude
// ✅ Intègre des seuils abaissés pour déclencher avant les organismes officiels

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { analyzeSnow } from "./snowService.js";
import { analyzeRain } from "./rainService.js";
import { analyzeWind } from "./windService.js";
import { fetchStationData } from "./stationsService.js";
import { askOpenAI } from "./openaiService.js";

let activeAlerts = [];

// ===============================
// ✅ Fonction de préfiltrage par seuils abaissés
// ===============================
function checkThresholds({ snow, rain, wind, stations }) {
  const alerts = [];

  // 🌧️ Pluie
  if (rain?.amount1h && rain.amount1h >= 20) {
    alerts.push({ type: "Pluie forte", valeur: rain.amount1h, seuil: ">=20mm/1h" });
  }
  if (rain?.amount6h && rain.amount6h >= 40) {
    alerts.push({ type: "Pluie intense", valeur: rain.amount6h, seuil: ">=40mm/6h" });
  }
  if (rain?.amount24h && rain.amount24h >= 60) {
    alerts.push({ type: "Pluie extrême", valeur: rain.amount24h, seuil: ">=60mm/24h" });
  }

  // ❄️ Neige
  if (snow?.depth6h && snow.depth6h >= 3) {
    alerts.push({ type: "Neige forte (plaine)", valeur: snow.depth6h, seuil: ">=3cm/6h" });
  }
  if (snow?.depth24h && snow.depth24h >= 7) {
    alerts.push({ type: "Neige importante (plaine)", valeur: snow.depth24h, seuil: ">=7cm/24h" });
  }
  if (snow?.depth24h && snow.depth24h >= 15) {
    alerts.push({ type: "Neige forte (montagne)", valeur: snow.depth24h, seuil: ">=15cm/24h" });
  }

  // 🌬️ Vent
  if (wind?.max && wind.max >= 60) {
    alerts.push({ type: "Vent fort", valeur: wind.max, seuil: ">=60km/h" });
  }
  if (wind?.max && wind.max >= 80) {
    alerts.push({ type: "Tempête", valeur: wind.max, seuil: ">=80km/h" });
  }
  if (wind?.max && wind.max >= 100) {
    alerts.push({ type: "Tempête violente", valeur: wind.max, seuil: ">=100km/h" });
  }

  // 🌡️ Températures
  if (stations?.temperature <= -7) {
    alerts.push({ type: "Froid intense", valeur: stations.temperature, seuil: "<=-7°C" });
  }
  if (stations?.temperature >= 32) {
    alerts.push({ type: "Chaleur extrême", valeur: stations.temperature, seuil: ">=32°C" });
  }

  return alerts;
}

// ===============================
// 🔎 Génération des alertes
// ===============================
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = getEngineState();
  try {
    addEngineLog(`🚨 Analyse alertes pour ${country}${region ? " - " + region : ""}`);

    // Collecte brute
    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    // ✅ Vérification des seuils minimaux
    const thresholdHits = checkThresholds({ snow, rain, wind, stations });

    // Prompt IA
    const prompt = `
Analyse des risques météo pour ${country}${region ? " - " + region : ""}, continent=${continent}.
Seuils atteints : ${JSON.stringify(thresholdHits)}

Sources brutes :
- Neige: ${JSON.stringify(snow)}
- Pluie: ${JSON.stringify(rain)}
- Vent: ${JSON.stringify(wind)}
- Stations locales: ${JSON.stringify(stations)}

Consignes IA :
1. Si des seuils sont atteints, confirmer obligatoirement l’alerte.
2. Ajuster fiabilité et intensité selon relief, climat, altitude (avalanche si montagne, crue si vallée…).
3. Ajouter d’autres alertes si anomalies détectées (ex : avalanche, grêle, vagues).
4. Répondre en format JSON strict :
   {
     "type": "...",
     "zone": "...",
     "fiabilite": "...%",
     "intensite": "...",
     "consequences": "...",
     "recommandations": "...",
     "debut": "...",
     "fin": "..."
   }
`;

    const aiResult = await askOpenAI("Tu es un moteur d’alerte météo nucléaire", prompt);

    let parsed = null;
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
      thresholds: thresholdHits, // ✅ on conserve les seuils déclenchés
      timestamp: new Date().toISOString(),
    };

    activeAlerts.push(alert);
    if (activeAlerts.length > 200) activeAlerts.shift();

    state.alerts = activeAlerts;
    saveEngineState(state);

    addEngineLog(`✅ Alerte générée pour ${country}${region ? " - " + region : ""}`);
    return alert;
  } catch (err) {
    addEngineError(`Erreur génération alertes: ${err.message}`);
    return { error: err.message };
  }
}

// ===============================
// 🔎 Liste active
// ===============================
export async function getActiveAlerts() {
  return activeAlerts;
}

// ===============================
// 🔧 Mise à jour statut (admin)
// ===============================
export async function updateAlertStatus(id, action) {
  const alert = activeAlerts.find((a) => a.id === id);
  if (!alert) return { error: "Alerte introuvable" };

  alert.status = action;
  addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}
