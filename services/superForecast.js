// services/superForecast.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";
import { injectForecasts } from "./forecastService.js";
import ClimateFactors from "./climateFactors.js";

// ==============================
// 🌍 Zones couvertes
// ==============================
const COVERED_EUROPE = [
  "DE", "AT", "BE", "BG", "CY", "HR", "DK", "ES", "EE", "FI", "FR", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "CZ", "RO", "SK", "SI", "SE"
];
const EXTRA_COVERED = ["UK", "UA"];
const USA_STATES = ["CA", "NY", "TX", "FL", "WA"]; // 🔥 à enrichir progressivement

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

  return results;
}

/**
 * Lance un run SuperForecast (fusion multi-modèles + IA + facteurs climat)
 */
export async function runSuperForecast(fusionData, lat = 50.5, lon = 4.5) {
  try {
    await addLog("🚀 Run SuperForecast lancé");

    // === Étape 1 : Analyse IA via Cohere ===
    const prompt = `
      Analyse météorologique nucléaire mondiale.
      Croise GFS, ECMWF, ICON, Copernicus, Meteomatics, NASA POWER, Trullemans, Wetterzentrale.
      Intègre relief, altitude, climat local, proximité mers/rivières, facteurs urbains.
      Détaille risques pluie, vent, neige, orages, inondations.
      Mets en évidence toute anomalie majeure détectée.
      Précision maximale pour 🇧🇪 BE, 🇫🇷 FR multi-zones, 🇺🇸 USA (états + national), 🇪🇺 UE27, 🇬🇧 UK, 🇺🇦 UA.
    `;

    const res = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-a-03-2025",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    const analysis =
      data?.text ||
      data?.message?.content?.[0]?.text ||
      "⚠️ Analyse IA indisponible";

    await addLog(`📊 Analyse IA SuperForecast: ${analysis}`);

    // === Étape 2 : Construire forecastData ===
    let forecastData = buildForecastData(fusionData);

    // === Étape 3 : Application ClimateFactors sur chaque entrée ===
    const adjustedData = [];
    for (const entry of forecastData) {
      const adjusted = await ClimateFactors.applyClimateFactors(entry, lat, lon, {
        zoneType: entry.country.startsWith("USA-") ? "urban" : "rural",
      });
      adjustedData.push(adjusted);
    }

    // === Étape 4 : Injection MongoDB ===
    await injectForecasts(adjustedData);

    await addLog("🎯 SuperForecast terminé avec succès");
    return { analysis, forecastData: adjustedData };
  } catch (err) {
    console.error("❌ Erreur runSuperForecast:", err.message);
    await addLog("❌ Erreur SuperForecast: " + err.message);
    return { analysis: null, forecastData: [] };
  }
}

export default { runSuperForecast };
