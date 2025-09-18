// services/forecastService.js
// Fusion des sources internes + pompage hiddensources
// -------------------------

import { getBMBCForecast } from "../hiddensources/trullemans.js";
import { getWetterzentrale } from "../hiddensources/wetterzentrale.js";
import { getOpenWeather } from "../hiddensources/openweather.js";
import { getMeteomaticsForecast } from "../hiddensources/meteomatics.js";
import { getWeatherIcon } from "./codesService.js";

// Petit helper pour moyenne numérique
function average(values) {
  const nums = values.filter(v => typeof v === "number" && !isNaN(v));
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ✅ Fonction principale
export async function getForecast(lat = 50.5, lon = 4.5) {
  const now = new Date();
  const sources = [];

  try {
    // ---- Trullemans (BMBC) ----
    const trullemans = await getBMBCForecast();
    sources.push(trullemans);

    // ---- Wetterzentrale (titres de modèles) ----
    const wz = await getWetterzentrale();
    sources.push(wz);

    // ---- OpenWeather ----
    const ow = await getOpenWeather(lat, lon);
    sources.push(ow);

    // ---- Meteomatics ----
    const mm = await getMeteomaticsForecast(lat, lon);
    sources.push(mm);

  } catch (err) {
    console.error("Erreur récupération sources forecast:", err);
  }

  // ---- Fusion des données ----
  const tempVals = [];
  const descVals = [];
  const reliability = [];

  for (const src of sources) {
    if (src.error) continue;

    if (src.temp) tempVals.push(src.temp);
    if (src.desc) descVals.push(src.desc);
    if (src.models) reliability.push("modèles: " + src.models.join(", ")); // wetterzentrale
  }

  // Moyenne température
  const temperature = average(tempVals) || 12;

  // Choix description : celle la plus fréquente ou fallback
  const description =
    descVals.length > 0
      ? descVals.sort((a, b) =>
          descVals.filter(v => v === a).length -
          descVals.filter(v => v === b).length
        ).pop()
      : "Ciel variable";

  // Icône à partir description simplifiée
  const icon = getWeatherIcon(
    description.includes("pluie") ? 61 :
    description.includes("neige") ? 71 :
    description.includes("orage") ? 95 :
    1 // soleil par défaut
  );

  // Indice de fiabilité = nombre de sources qui ont répondu
  const reliabilityIndex = Math.min(100, sources.filter(s => !s.error).length * 25);

  return {
    timestamp: now.toISOString(),
    location: { lat, lon },
    combined: {
      temperature,
      description,
      icon,
      reliability: `${reliabilityIndex}%`,
    },
    rawSources: sources, // ⚡ tu vois tout ce qui a été pompé
  };
}
