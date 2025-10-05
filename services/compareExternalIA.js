// PATH: services/compareExternalIA.js
// 🌍 Module Comparateur Externe IA — TINSFLASH (100% indépendant, 0% dépendant)

// Objectif : comparer les prévisions et alertes officielles (NOAA, Wetterzentrale, Copernicus...)
// avec celles générées par notre moteur IA J.E.A.N., afin de mesurer notre avance et notre fiabilité.

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

// Liste des sources externes surveillées
const SOURCES = {
  NOAA: "https://api.weather.gov/alerts/active",
  METEO_FRANCE: "https://public-api.meteo.fr/v1/alerts", // fallback si clé
  WETTERZENTRALE: "https://www.wetterzentrale.de", // scrap / prévisions visuelles
  ECMWF: "https://www.ecmwf.int/en/forecasts/charts/data", // validation modèle brut
  OPENWEATHER: "https://api.openweathermap.org/data/2.5/weather",
  COPERNICUS: "https://cds.climate.copernicus.eu/api/v2", // anomalies climatiques
};

// Utilitaire : comparer deux alertes selon intensité, type et localisation
function compareAlerts(ours, theirs) {
  const results = [];

  for (const alert of ours) {
    const similar = theirs.find(
      (a) =>
        a.event === alert.event &&
        Math.abs(a.lat - alert.lat) < 1 &&
        Math.abs(a.lon - alert.lon) < 1
    );

    if (similar) {
      results.push({
        event: alert.event,
        zone: alert.zone,
        ours_time: alert.start,
        theirs_time: similar.sent || similar.onset,
        advance_hours:
          (new Date(similar.sent || similar.onset) - new Date(alert.start)) /
          1000 /
          3600,
        matched: true,
      });
    } else {
      results.push({
        event: alert.event,
        zone: alert.zone,
        ours_time: alert.start,
        theirs_time: null,
        advance_hours: null,
        matched: false,
      });
    }
  }

  return results;
}

/**
 * 🔍 Fonction principale : compare nos alertes avec celles des autres sources.
 * @param {Array} localAlerts - nos alertes locales générées par le moteur
 * @returns {Object} rapport complet d’avance et de cohérence
 */
export async function compareExternalAlerts(localAlerts = []) {
  await addEngineLog("🛰️ Analyse comparative externe des alertes...");

  const externalAlerts = {};
  const errors = [];

  // 1️⃣ Récupération des alertes externes
  for (const [name, url] of Object.entries(SOURCES)) {
    try {
      const res = await axios.get(url, { timeout: 15000 });
      const data = res.data || {};
      externalAlerts[name] = data.features || data.alerts || [];
      await addEngineLog(`✅ Source ${name} récupérée (${externalAlerts[name].length} alertes).`);
    } catch (err) {
      errors.push(`[${name}] ${err.message}`);
      await addEngineError(`⚠️ Source ${name} inaccessible: ${err.message}`);
    }
  }

  // 2️⃣ Comparaison avec nos alertes locales
  const comparisons = {};
  for (const [name, theirs] of Object.entries(externalAlerts)) {
    comparisons[name] = compareAlerts(localAlerts, theirs);
  }

  // 3️⃣ Synthèse IA interne (optionnelle)
  let globalStats = {
    totalAlerts: localAlerts.length,
    sourcesCompared: Object.keys(externalAlerts).length,
    averageAdvance: 0,
    matches: 0,
    mismatches: 0,
  };

  let totalAdvance = 0;
  let counted = 0;

  for (const comp of Object.values(comparisons)) {
    for (const r of comp) {
      if (r.matched && typeof r.advance_hours === "number") {
        totalAdvance += r.advance_hours;
        counted++;
      }
      if (r.matched) globalStats.matches++;
      else globalStats.mismatches++;
    }
  }

  if (counted > 0) globalStats.averageAdvance = (totalAdvance / counted).toFixed(2);

  await addEngineLog(
    `📊 Comparaison terminée : ${globalStats.matches}/${globalStats.totalAlerts} concordantes, ` +
      `${globalStats.mismatches} divergentes, avance moyenne ${globalStats.averageAdvance}h`
  );

  return { globalStats, comparisons, errors };
}

/**
 * 🔁 Intégration automatisée dans le moteur principal (facultatif)
 * Exemple : appelé depuis runGlobal ou superForecast après génération d’alertes.
 */
export async function autoCompareAfterRun(localAlerts) {
  try {
    const result = await compareExternalAlerts(localAlerts);
    await addEngineLog("🧩 Analyse externe terminée et sauvegardée.");
    return result;
  } catch (err) {
    await addEngineError("❌ Erreur autoCompareAfterRun: " + err.message);
    return null;
  }
}

export default { compareExternalAlerts, autoCompareAfterRun };
