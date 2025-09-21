// services/forecastVision.js

import { getSeasonalNorms } from "../utils/seasonalNorms.js";
import geoFactors from "./geoFactors.js";
import localFactors from "./localFactors.js";
import openweather from "./openweather.js";
import meteomatics from "./meteomatics.js";
import iconDwd from "./icon.js";
import nasaSat from "./nasaSat.js";
import trulleMans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";

export default async function forecastVision(location, options = {}) {
  try {
    // 1. Récupération des données météo de toutes les sources
    const [
      owData,
      meteoData,
      iconData,
      nasaData,
      trullData,
      wetterData
    ] = await Promise.all([
      openweather(location, options),
      meteomatics(location, options),
      iconDwd(location, options),
      nasaSat(location, options),
      trulleMans(location, options),
      wetterzentrale(location, options)
    ]);

    // 2. Facteurs géographiques et locaux
    const geo = await geoFactors(location);
    const local = await localFactors(location);

    // 3. Normes saisonnières (vraies valeurs historiques)
    const norms = await getSeasonalNorms(location);

    // 4. Fusionner toutes les données
    const merged = {
      temperature: average([
        owData.temperature,
        meteoData.temperature,
        iconData.temperature,
        nasaData.temperature,
        trullData.temperature,
        wetterData.temperature
      ]),
      precipitation: average([
        owData.precipitation,
        meteoData.precipitation,
        iconData.precipitation,
        nasaData.precipitation,
        trullData.precipitation,
        wetterData.precipitation
      ]),
      wind: average([
        owData.wind,
        meteoData.wind,
        iconData.wind,
        nasaData.wind,
        trullData.wind,
        wetterData.wind
      ]),
      sources: {
        openweather: owData,
        meteomatics: meteoData,
        iconDwd: iconData,
        nasaSat: nasaData,
        trulleMans: trullData,
        wetterzentrale: wetterData
      },
      factors: {
        geo,
        local,
        norms
      }
    };

    // 5. Ajustements avec facteurs géographiques, locaux et normes
    merged.temperature = adjustWithFactors(
      merged.temperature,
      geo,
      local,
      norms.temperature
    );
    merged.precipitation = adjustWithFactors(
      merged.precipitation,
      geo,
      local,
      norms.precipitation
    );
    merged.wind = adjustWithFactors(
      merged.wind,
      geo,
      local,
      norms.wind
    );

    return merged;
  } catch (error) {
    console.error("Erreur dans forecastVision:", error);
    throw error;
  }
}

// --- Utils internes ---

function average(values) {
  const valid = values.filter(v => typeof v === "number" && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function adjustWithFactors(value, geo, local, norm) {
  let adjusted = value;
  if (geo && geo.adjustment) {
    adjusted += geo.adjustment;
  }
  if (local && local.adjustment) {
    adjusted += local.adjustment;
  }
  if (typeof norm === "number") {
    adjusted = (adjusted + norm) / 2;
  }
  return adjusted;
}
