// services/superForecast.js
import cohere from "cohere-ai";
import { addLog } from "./logsService.js";
import { injectForecasts } from "./forecastService.js";

// ✅ Initialisation correcte pour Cohere v7+
cohere.init(process.env.COHERE_API_KEY);

// ==============================
// 🌍 Zones couvertes
// ==============================
const COVERED_EUROPE = [
  "DE", "AT", "BE", "BG", "CY", "HR", "DK", "ES", "EE", "FI", "FR", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "CZ", "RO", "SK", "SI", "SE"
];
const EXTRA_COVERED = ["UK", "UA"];
const USA_STATES = ["CA", "NY", "TX", "FL", "WA"]; // 🔥 à enrichir avec tous les États

/**
 * Génère un tableau forecastData structuré pour injectForecasts
 */
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

  // 🇫🇷 France (multi-zones)
  ["NO", "NE", "SO", "SE", "COR"].forEach((zone) => {
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

  // 🌍 Autres pays couverts (Europe élargie + UK + UA)
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

  // 🌐 Exemple reste du monde (Brésil ici, généralisable)
  if (fusionData.BR) {
    results.push({
      country: "BR",
      date: today,
      minTemp: fusionData.BR.min,
      maxTemp: fusionData.BR.max,
      rainProbability: fusionData.BR.rain,
      windSpeed: fusionData.BR.wind,
    });
  }

  return results;
}

/**
 * Lance un run SuperForecast (fusion multi-modèles + IA)
 */
export async function runSuperForecast(fusionData) {
  try {
    await addLog("🚀 Run SuperForecast lancé");

    // === Étape 1 : Analyse IA via Cohere ===
    const prompt = `
      Analyse météorologique mondiale (données fusionnées multi-modèles).
      Détaille risques principaux : pluie, vent, neige, orages, inondations.
      Précise tendances par zones couvertes (Europe élargie, UK, Ukraine, USA).
      Mets en évidence toute anomalie majeure détectée.
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

    // === Étape 2 : Construire forecastData ===
    const forecastData = buildForecastData(fusionData);

    // === Étape 3 : Injection MongoDB ===
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
