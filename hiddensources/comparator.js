// hiddensources/comparator.js
// Compare nos prévisions internes avec celles pompées ailleurs

import { getBMBCForecast } from "./trullemans.js";
import { getMeteomaticsForecast } from "./meteomatics.js";
import { getWetterzentrale } from "./wetterzentrale.js";
import { getOpenWeather } from "./openweather.js";

export async function compareSources(ourForecast, lat = 50.5, lon = 4.5) {
  const sources = [];

  // BMBC
  sources.push(await getBMBCForecast());

  // Meteomatics
  sources.push(await getMeteomaticsForecast(lat, lon));

  // Wetterzentrale
  sources.push(await getWetterzentrale());

  // OpenWeather
  sources.push(await getOpenWeather(lat, lon));

  // Analyse simple
  return sources.map(src => {
    if (src.error) {
      return { source: src.source, status: "Erreur récupération" };
    }

    return {
      source: src.source,
      data: src,
      concordance: ourForecast.includes("pluie") && JSON.stringify(src).includes("pluie")
        ? "Aligné"
        : "Différent"
    };
  });
}
