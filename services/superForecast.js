// services/superForecast.js
import { CohereClient } from "cohere-ai";
import { addLog } from "./logsService.js";
import { injectForecasts } from "./forecastService.js";

// ✅ Nouvelle initialisation (sans .init())
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// ==============================
// 🌍 Zones couvertes
// ==============================
const COVERED_EUROPE = [
  "DE","AT","BE","BG","CY","HR","DK","ES","EE","FI","FR","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PL","PT","CZ","RO","SK","SI","SE"
];
const EXTRA_COVERED = ["UK", "UA"];
const USA_STATES = ["CA", "NY", "TX", "FL", "WA"]; // 🔥 à enrichir

function buildForecastData(fusionData) {
  const today = new Date().toISOString().split("T")[0];
  const results = [];

  // 🇧🇪 Belgique
  results.push({
    country: "BE",
    date: today,
    minTemp: fusionData.BE?.min || null,
    maxTemp: fusionData.BE?.max || null,
    rainProbability: fusionData.BE?.rain || null,
    windSpeed: fusionData.BE?.wind || null,
  });

  // 🇫🇷 France multi-zones
  ["NO","NE","SO","SE","COR"].forEach((zone) => {
    results.push({
      country: `FR-${zone}`,
      date: today,
      minTemp: fusionData[`FR-${zone}`]?.min || fusionData.FR?.min || null,
      maxTemp: fusionData[`FR-${zone}`]?.max || fusionData.FR?.max || null,
      rainProbability: fusionData[`FR-${zone}`]?.rain || fusionData.FR?.rain || null,
      windSpeed: fusionData[`FR-${zone}`]?.wind || fusionData.FR?.wind || null,
    });
  });

  // 🇺🇸 USA (par État + national)
  USA_STATES.forEach((state) => {
    results.push({
      country: `USA-${state}`,
      date: today,
      minTemp: fusionData[`USA-${state}`]?.min || fusionData.USA?.min || null,
      maxTemp: fusionData[`USA-${state}`]?.max || fusionData.USA?.max || null,
      rainProbability: fusionData[`USA-${state}`]?.rain || fusionData.USA?.rain || null,
      windSpeed: fusionData[`USA-${state}`]?.wind || fusionData.USA?.wind || null,
    });
  });
  results.push({
    country: "USA",
    date: today,
    minTemp: fusionData.USA?.min || null,
    maxTemp: fusionData.USA?.max || null,
    rainProbability: fusionData.USA?.rain || null,
    windSpeed: fusionData.USA?.wind || null,
  });

  // Autres pays UE élargie + UK + UA
  [...COVERED_EUROPE, ...EXTRA_COVERED].forEach((cc) => {
    if (cc !== "FR" && cc !== "BE") {
      results.push({
        country: cc,
        date: today,
        minTemp: fusionData[cc]?.min || null,
        maxTemp: fusionData[cc]?.max || null,
        rainProbability: fusionData[cc]?.rain || null,
        windSpeed: fusionData[cc]?.wind || null,
      });
    }
  });

  return results;
}

// ==============================
// 🚀 SuperForecast
// ==============================
export async function runSuperForecast(fusionData) {
  try {
    await addLog("🚀 Run SuperForecast lancé");

    // 🔮 Analyse IA J.E.A.N.
    const prompt = `
      Analyse météorologique mondiale (multi-modèles).
      Détaille : pluie, vent, neige, orages, inondations.
      Tendances par zones couvertes (UE27, UK, UA, USA).
      Mets en évidence anomalies majeures.
    `;

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [{ role: "user", content: prompt }],
    });

    const analysis =
      response?.text ||
      response?.message?.content?.[0]?.text ||
      "⚠️ Analyse IA indisponible";

    await addLog(`📊 Analyse IA SuperForecast: ${analysis}`);

    // Construire données prévisions
    const forecastData = buildForecastData(fusionData);

    // Injection DB
    await injectForecasts(forecastData);

    await addLog("🎯 SuperForecast terminé avec succès");
    return { analysis, forecastData };
  } catch (err) {
    console.error("❌ Erreur runSuperForecast:", err.message);
    await addLog("❌ Erreur SuperForecast: " + err.message);
    return { analysis: null, forecastData: [] };
  }
}

export default { runSuperForecast };
