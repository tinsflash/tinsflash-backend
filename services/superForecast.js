// services/superForecast.js

import forecastVision from "./forecastVision.js";
import geoFactors from "./geoFactors.js";
import localFactors from "./localFactors.js";
import { getSeasonalNorms } from "../utils/seasonalNorms.js";

export default async function superForecast(location, options = {}) {
  try {
    // 1. ForecastVision = données croisées multi-sources
    const vision = await forecastVision(location, options);

    // 2. Facteurs géographiques et locaux
    const geo = await geoFactors(location);
    const local = await localFactors(location);

    // 3. Normes saisonnières (vraies données historiques)
    const norms = await getSeasonalNorms(location);

    // 4. Fusion finale : prévision "centrale nucléaire météo"
    const result = {
      temperature: refineWithAI(vision.temperature, geo, local, norms.temperature),
      precipitation: refineWithAI(vision.precipitation, geo, local, norms.precipitation),
      wind: refineWithAI(vision.wind, geo, local, norms.wind),
      base: vision,
      factors: { geo, local, norms }
    };

    return result;
  } catch (error) {
    console.error("Erreur dans superForecast:", error);
    throw error;
  }
}

// --- Utils internes ---

function refineWithAI(value, geo, local, norm) {
  let refined = value;

  // Ajustements géographiques
  if (geo && geo.adjustment) {
    refined += geo.adjustment;
  }

  // Ajustements locaux (urbain, relief, microclimat…)
  if (local && local.adjustment) {
    refined += local.adjustment;
  }

  // Pondération par les normes saisonnières réelles
  if (typeof norm === "number") {
    refined = (refined * 0.7) + (norm * 0.3); // pondération 70/30
  }

  return refined;
}
