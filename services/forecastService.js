// services/forecastService.js
import openweather from "./openweather.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicusService from "./copernicusService.js";
import wetterzentrale from "./wetterzentrale.js";
import trullemans from "./trulleMans.js";
import localFactors from "./localFactors.js";
import geoFactors from "./geoFactors.js";

/**
 * 🔥 Machine nucléaire météo :
 * Combine plusieurs sources météo, applique corrections locales et géographiques,
 * et renvoie une prévision ultra-fiable.
 */

/**
 * Récupère la prévision pour un lieu donné
 */
export async function getForecast(location) {
  try {
    const [ow, mm, nasa, copernicus, wz, trull] = await Promise.all([
      openweather(location),
      meteomatics(location),
      nasaSat(location.lat, location.lon),
      copernicusService(location),
      wetterzentrale(location),
      trullemans(location),
    ]);

    // Fusionner les résultats
    const combined = {
      temperature: average([
        ow.temperature,
        mm.temperature,
        nasa.temperature,
        copernicus.temperature,
        wz.temperature,
        trull.temperature,
      ]),
      precipitation: average([
        ow.precipitation,
        mm.precipitation,
        nasa.precipitation,
        copernicus.precipitation,
        wz.precipitation,
        trull.precipitation,
      ]),
      wind: average([
        ow.wind,
        mm.wind,
        nasa.wind,
        copernicus.wind,
        wz.wind,
        trull.wind,
      ]),
      sources: ["OpenWeather", "Meteomatics", "NASA", "Copernicus", "Wetterzentrale", "Trullemans"],
    };

    // Appliquer les facteurs locaux et géographiques
    const adjusted = localFactors(location, combined);
    const finalForecast = geoFactors(location, adjusted);

    return {
      ...finalForecast,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("❌ Erreur dans getForecast:", err.message);
    return { error: "Impossible de récupérer la prévision" };
  }
}

/**
 * Récupère un intervalle de prévisions
 */
export async function getForecastRange(location, start, end) {
  try {
    const results = [];
    let current = new Date(start);

    while (current <= new Date(end)) {
      const forecast = await getForecast({
        ...location,
        date: current.toISOString().split("T")[0],
      });
      results.push(forecast);

      // avancer d'un jour
      current.setDate(current.getDate() + 1);
    }

    return results;
  } catch (err) {
    console.error("❌ Erreur dans getForecastRange:", err.message);
    return [];
  }
}

/**
 * Moyenne sécurisée
 */
function average(values) {
  const nums = values.filter((v) => v !== undefined && v !== null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ✅ Export par défaut pour éviter les erreurs
export default {
  getForecast,
  getForecastRange,
};
