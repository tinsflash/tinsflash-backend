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
import { checkExternalAlerts } from "./externalAlerts.js";

let activeAlerts = [];

/** 🔎 Génération d’une alerte (point) + exclusivité + suivi */
export async function generateAlerts(lat, lon, country, region, continent = "Europe") {
  const state = await getEngineState();
  try {
    await addEngineLog(`🚨 Analyse alertes pour ${country}${region ? " - " + region : ""}`);

    // 1️⃣ Détection brute (multi-modèles simplifiée)
    const detectorResults = await detectAlerts({ lat, lon, country }, { scope: continent, country });

    // 2️⃣ Modules spécialisés
    const [snow, rain, wind, stations] = await Promise.all([
      analyzeSnow(lat, lon, country, region),
      analyzeRain(lat, lon, country, region),
      analyzeWind(lat, lon, country, region),
      fetchStationData(lat, lon, country, region),
    ]);

    // 2️⃣ bis HRRR / AROME (haute résolution)
    let hiRes = null;
    if (country === "USA") {
      hiRes = await hrrr(lat, lon);
    } else {
      // 🇪🇺 haute résolution FR/BE si dispo ; sinon base multi-modèles
      if (country === "France" || country === "Belgium") {
        hiRes = await arome(lat, lon);
      }
    }

    // 3️⃣ Pré-ajustements relief/climat
    let base = {
      temperature: rain?.temperature ?? snow?.temperature ?? null,
      precipitation: rain?.precipitation ?? snow?.precipitation ?? null,
      wind: wind?.speed ?? null,
    };
    base = await applyGeoFactors(base, lat, lon, country);
    base = await adjustWithLocalFactors(base, country, lat, lon);

    const anomaly = forecastVision.detectSeasonalAnomaly(base);
    if (anomaly) base.anomaly = anomaly;

    // 4️⃣ IA moteur d’alerte (JSON strict)
    const prompt = `
Analyse des risques météo pour ${country}${region ? " - " + region : ""}, continent=${continent}.
Sources enrichies (résumées):
- Neige: ${JSON.stringify(snow)}
- Pluie: ${JSON.stringify(rain)}
- Vent: ${JSON.stringify(wind)}
- Détecteur brut: ${JSON.stringify(detectorResults)}
- Stations (résumé): ${JSON.stringify(stations?.summary || {})}
- Haute résolution: ${JSON.stringify(hiRes || {})}
- Anomalies: ${JSON.stringify(anomaly)}

Consignes :
- Croiser toutes les données (neige, pluie, vent, stations, détecteur multi-modèles).
- Si USA → intégrer HRRR. Si FR/BE → intégrer AROME.
- Ajuster selon relief, climat, altitude et saison.
- Déterminer si une alerte doit être générée.
- classer: { type, zone, fiabilite(0–100), intensité, conséquences, recommandations, durée }
- Répondre en JSON strict UNIQUEMENT.
`;
    const aiResult = await askOpenAI("Tu es un moteur d’alerte météo nucléaire", prompt);

    let parsed;
    try {
      parsed = JSON.parse(aiResult);
    } catch {
      parsed = { type: "unknown", fiabilite: 0, note: "JSON invalide", raw: aiResult };
    }

    // 5️⃣ Classification (statut + historique)
    let classified = classifyAlerts(parsed);

    // 6️⃣ Vérification externes (exclusivité vs confirmé ailleurs)
    const externals = await checkExternalAlerts(lat, lon, country, region);
    const exclusivity = externals.length ? "confirmed-elsewhere" : "exclusive";
    classified = {
      ...classified,
      external: { exclusivity, providers: externals },
    };

    // 7️⃣ Construction alerte consolidée
    const keyType = classified.type || parsed.type || 'unknown';
    const newAlert = {
      id: Date.now().toString() + Math.floor(Math.random()*1000).toString(),
      type: keyType,
      country,
      region,
      continent,
      lat, lon,
      data: classified,
      timestamp: new Date().toISOString(),
      note: country === "USA"
        ? "⚡ HRRR intégré (alertes haute résolution USA)"
        : (country === "France" || country === "Belgium")
        ? "⚡ AROME intégré (alertes haute résolution FR/BE)"
        : "Sources standard (multi-modèles + stations)",
    };

    // 8️⃣ Fusion / Suivi avec anciennes alertes (même pays+region+type)
    const prev = activeAlerts.find(a =>
      a.country === country && a.region === region && a.type === keyType && a.data?.status !== 'archived'
    );

    if (prev) {
      // mise à jour continue
      prev.data = {
        ...newAlert.data,
        history: Array.isArray(prev.data.history)
          ? [...prev.data.history, ...newAlert.data.history]
          : newAlert.data.history,
        disappearedRunsCount: 0,
        // si première fois “exclusive” puis “confirmed-elsewhere”, on garde trace
        firstExclusivity: prev.data.firstExclusivity || (newAlert.data.external?.exclusivity === 'exclusive' ? 'exclusive' : 'non-exclusive'),
        lastExclusivity: newAlert.data.external?.exclusivity,
      };
      prev.timestamp = newAlert.timestamp;
      prev.note = newAlert.note;
    } else {
      newAlert.data.firstExclusivity = exclusivity;
      newAlert.data.lastExclusivity = exclusivity;
      activeAlerts.push(newAlert);
      // cap mémoire raisonnable
      if (activeAlerts.length > 2000) activeAlerts.shift();
    }

    // 9️⃣ Marquer les anciennes alertes *non régénérées* à ce run (disparues)
    //    → on le fait PAISIBLEMENT dans l’API batch (ex: runGlobal)… ici on sécurise à minima
    //    (Rien à faire ici : generateAlerts traite un point ; le batch gèrera la disparition)

    // 🔥 Mise à jour engine-state
    state.alerts = activeAlerts;
    state.lastAlertsGenerated = new Date().toISOString();
    await saveEngineState(state);

    await addEngineLog(`✅ Alerte générée (${exclusivity}) pour ${country}${region ? " — " + region : ""}`);
    return prev || newAlert;
  } catch (err) {
    await addEngineError(`Erreur génération alertes: ${err.message}`);
    return { error: err.message };
  }
}

/** 📦 Retourne une copie immuable des alertes actives */
export async function getActiveAlerts() {
  return [...activeAlerts];
}

/** ✏️ Mettre à jour le statut d’une alerte (admin) */
export async function updateAlertStatus(id, action) {
  const alert = activeAlerts.find((a) => a.id === id);
  if (!alert) return { error: "Alerte introuvable" };

  alert.data = { ...alert.data, status: action };
  await addEngineLog(`⚡ Alerte ${id} → ${action}`);
  return alert;
}

/** 🧮 Résumé “surveillance” pour la console (sous observ, tranches de fiabilité, exclusivités) */
export async function getSurveillanceSummary() {
  const summary = {
    total: activeAlerts.length,
    byStatus: { published:0, toValidate:0, 'under-surveillance':0, archived:0 },
    byConfidence: { '0-49':0, '50-69':0, '70-89':0, '90-100':0 },
    exclusives: 0,
    confirmedElsewhere: 0
  };

  for (const a of activeAlerts) {
    const s = a.data?.status || 'under-surveillance';
    if (summary.byStatus[s] != null) summary.byStatus[s]++;

    const c = a.data?.confidence ?? 0;
    if (c < 50) summary.byConfidence['0-49']++;
    else if (c < 70) summary.byConfidence['50-69']++;
    else if (c < 90) summary.byConfidence['70-89']++;
    else summary.byConfidence['90-100']++;

    const ex = a.data?.external?.exclusivity;
    if (ex === 'exclusive') summary.exclusives++;
    if (ex === 'confirmed-elsewhere') summary.confirmedElsewhere++;
  }

  return summary;
}

/**
 * 🔁 À appeler côté batch (ex: à la fin d'un run de zone) :
 * marque comme “disparues” les alertes non vues pendant ce run.
 * Si une alerte atteint 6 runs consécutifs disparue → archived.
 */
export async function markDisappearedSince(lastRunSeenIds = []) {
  const seen = new Set(lastRunSeenIds);
  let changed = false;

  for (const a of activeAlerts) {
    if (a.data?.status === 'archived') continue;
    if (!seen.has(a.id)) {
      const d = (a.data?.disappearedRunsCount ?? 0) + 1;
      a.data.disappearedRunsCount = d;
      if (d >= 6) {
        a.data.status = 'archived';
      }
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
