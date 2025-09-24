// services/superForecast.js
// 👉 Utilise Cohere via REST (clé message) + construit des prévisions
// prêtes pour l’admin (formatage sûr pour éviter “undefined” côté UI).

import { addLog } from "./logsService.js";
import { injectForecasts } from "./forecastService.js";

const COHERE_URL = "https://api.cohere.ai/v1/chat";
const COHERE_KEY = process.env.COHERE_API_KEY;

// Zones couvertes (UE27 + UK + UA + USA)
const COVERED_EUROPE = [
  "DE","AT","BE","BG","CY","HR","DK","ES","EE","FI","FR","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PL","PT","CZ","RO","SK","SI","SE"
];
const EXTRA_COVERED = ["UK", "UA"];
const USA_STATES = ["CA", "NY", "TX", "FL", "WA"]; // à étendre

function toNumOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ➜ Pour éviter “undefined”, on renvoie toujours des champs présents (null si inconnu)
function safeRow(country, src) {
  return {
    country,
    date: new Date().toISOString().split("T")[0],
    minTemp: toNumOrNull(src?.min),
    maxTemp: toNumOrNull(src?.max),
    rainProbability: toNumOrNull(src?.rain),
    windSpeed: toNumOrNull(src?.wind),
  };
}

function buildForecastData(fusionData = {}) {
  const rows = [];

  // 🇧🇪 Belgique (national)
  rows.push(safeRow("BE", fusionData.BE));

  // 🇫🇷 France multi-zones + national si présent
  const frNational = fusionData.FR || {};
  ["NO", "NE", "SO", "SE", "COR"].forEach(z => {
    const key = `FR-${z}`;
    rows.push(safeRow(key, fusionData[key] || frNational));
  });
  rows.push(safeRow("FR", frNational)); // national si dispo

  // 🇺🇸 USA (États + national)
  USA_STATES.forEach(st => {
    const key = `USA-${st}`;
    rows.push(safeRow(key, fusionData[key] || fusionData.USA));
  });
  rows.push(safeRow("USA", fusionData.USA));

  // UE27 + UK + UA (hors FR/BE déjà ajoutés)
  [...COVERED_EUROPE, ...EXTRA_COVERED].forEach(cc => {
    if (cc !== "FR" && cc !== "BE") {
      rows.push(safeRow(cc, fusionData[cc]));
    }
  });

  return rows;
}

export async function runSuperForecast(fusionData = {}) {
  try {
    await addLog("🚀 Run SuperForecast lancé");

    // 1) Analyse IA (message = prompt unique)
    if (!COHERE_KEY) {
      throw new Error("COHERE_API_KEY manquant dans l'environnement");
    }

    const prompt =
      "Analyse météo multi-modèles pour zones couvertes (UE27 + UK + Ukraine + USA). " +
      "Détaille les risques majeurs (pluie, vent, neige, orages, inondations), " +
      "et signale toute anomalie significative.";

    const res = await fetch(COHERE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COHERE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus",
        message: prompt, // ✅ clé attendue par Cohere
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`Cohere HTTP ${res.status} – ${errTxt}`);
    }

    const data = await res.json();
    const analysis =
      data?.text ||
      data?.message?.content?.[0]?.text ||
      "⚠️ Analyse IA indisponible";

    await addLog(`📊 Analyse IA SuperForecast: ${analysis}`);

    // 2) Structuration des données de prévisions
    const forecastData = buildForecastData(fusionData);

    // 3) Injection MongoDB
    await injectForecasts(forecastData);
    await addLog("💾 Prévisions stockées en base");

    await addLog("🎯 Run SuperForecast terminé");
    return { analysis, forecastData };
  } catch (err) {
    await addLog("❌ Erreur SuperForecast: " + err.message);
    return { analysis: null, forecastData: [] };
  }
}

export default { runSuperForecast };
