// services/superForecast.js
import { CohereClient } from "cohere-ai";
import { addLog } from "./logsService.js";
import { injectForecasts } from "./forecastService.js";

const cohere = process.env.COHERE_API_KEY
  ? new CohereClient({ token: process.env.COHERE_API_KEY })
  : null;

// ==============================
// 🌍 Zones couvertes
// ==============================
const COVERED_EUROPE = [
  "DE","AT","BE","BG","CY","HR","DK","ES","EE","FI","FR","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PL","PT","CZ","RO","SK","SI","SE"
];
const EXTRA_COVERED = ["UK", "UA"];
const USA_STATES = ["CA","NY","TX","FL","WA"]; // à étendre

/**
 * Construit la structure attendue par injectForecasts
 */
function buildForecastData(fusionData = {}) {
  const today = new Date().toISOString().split("T")[0];
  const out = [];

  // 🇧🇪 Belgique (national)
  if (fusionData.BE) {
    out.push({
      country: "BE",
      date: today,
      minTemp: fusionData.BE.min,
      maxTemp: fusionData.BE.max,
      rainProbability: fusionData.BE.rain,
      windSpeed: fusionData.BE.wind,
    });
  }

  // 🇫🇷 France (multi-zones)
  const zonesFR = ["NO","NE","SO","SE","COR"];
  zonesFR.forEach(z => {
    const key = `FR-${z}`;
    const src = fusionData[key] || fusionData.FR || {};
    if (Object.keys(src).length) {
      out.push({
        country: key,
        date: today,
        minTemp: src.min ?? null,
        maxTemp: src.max ?? null,
        rainProbability: src.rain ?? null,
        windSpeed: src.wind ?? null,
      });
    }
  });

  // 🇺🇸 USA (par état) + national
  USA_STATES.forEach(s => {
    const key = `USA-${s}`;
    const src = fusionData[key] || fusionData.USA || {};
    if (Object.keys(src).length) {
      out.push({
        country: key,
        date: today,
        minTemp: src.min ?? null,
        maxTemp: src.max ?? null,
        rainProbability: src.rain ?? null,
        windSpeed: src.wind ?? null,
      });
    }
  });
  if (fusionData.USA) {
    out.push({
      country: "USA",
      date: today,
      minTemp: fusionData.USA.min,
      maxTemp: fusionData.USA.max,
      rainProbability: fusionData.USA.rain,
      windSpeed: fusionData.USA.wind,
    });
  }

  // 🌍 Autres pays couverts (UE + UK + UA), hors FR/BE déjà traités
  [...COVERED_EUROPE, ...EXTRA_COVERED].forEach(cc => {
    if (cc !== "FR" && cc !== "BE") {
      const src = fusionData[cc] || {};
      if (Object.keys(src).length) {
        out.push({
          country: cc,
          date: today,
          minTemp: src.min ?? null,
          maxTemp: src.max ?? null,
          rainProbability: src.rain ?? null,
          windSpeed: src.wind ?? null,
        });
      }
    }
  });

  return out;
}

/**
 * Lancement du SuperForecast (fusion multi-modèles + analyse IA)
 */
export async function runSuperForecast(fusionData = {}) {
  try {
    await addLog("🚀 Run SuperForecast lancé");

    // 1) Analyse IA Cohere (si clé présente)
    let analysis = "⚠️ Analyse IA indisponible (clé manquante)";
    if (cohere) {
      const prompt = `
        Tu es J.E.A.N., IA météorologique nucléaire.
        Analyse ces données fusionnées multi-modèles (GFS/ECMWF/ICON + satellites) :
        - Priorise UE27 + UK + UA + USA (national + états)
        - Donne risques majeurs (pluie, vent, orage, neige, inondations)
        - Mets en avant toute anomalie saisonnière
        Réponds de façon concise et opérationnelle.`;
      const r = await cohere.chat({
        model: "command-r-plus",
        messages: [{ role: "user", content: prompt }],
      });
      analysis =
        r?.message?.content?.map(p => p?.text || "").join("\n").trim() ||
        r?.text ||
        analysis;
      await addLog("📊 Analyse IA générée par Cohere.");
    } else {
      await addLog("ℹ️ Cohere non initialisé (pas de COHERE_API_KEY).");
    }

    // 2) Construire les enregistrements Forecast
    const forecastData = buildForecastData(fusionData);

    // 3) Injection MongoDB
    if (forecastData.length) {
      await injectForecasts(forecastData);
      await addLog("💾 Prévisions sauvegardées en base.");
    } else {
      await addLog("⚠️ Aucune donnée fusionnée fournie au SuperForecast.");
    }

    await addLog("🎯 SuperForecast terminé avec succès");
    return { analysis, forecastData };
  } catch (err) {
    await addLog("❌ Erreur SuperForecast: " + err.message);
    return { analysis: null, forecastData: [] };
  }
}

export default { runSuperForecast };
