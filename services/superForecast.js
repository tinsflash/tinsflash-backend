// services/superForecast.js
import forecastService from "./forecastService.js";
import radarService from "./radarService.js";
import textGenService from "./textGenService.js";
import alertsService from "./alertsService.js";

/**
 * 🔥 SuperForecast :
 * Combine la prévision météo consolidée avec radar + génération de texte + alertes
 * pour produire un package complet destiné aux utilisateurs Premium.
 */

/**
 * Récupère une super-prévision complète
 */
export async function getSuperForecast(location, options = {}) {
  try {
    // 1️⃣ Récupération des prévisions multi-sources (centrale nucléaire météo)
    const forecast = await forecastService.getForecast(location);

    // 2️⃣ Radar temps réel (pluie, neige, vent)
    const radar = await radarService(location);

    // 3️⃣ Génération d’un résumé IA (textGen)
    const summary = await textGenService({
      forecast,
      radar,
      location,
      premium: options.premium || false,
    });

    // 4️⃣ Vérification des alertes météo
    const alerts = await alertsService(location, forecast);

    // 5️⃣ Pack final complet
    return {
      location,
      forecast,
      radar,
      alerts,
      summary,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("❌ Erreur dans getSuperForecast:", err.message);
    return { error: "Impossible de générer la super prévision" };
  }
}

/**
 * Récupère une super-prévision pour une plage de dates
 */
export async function getSuperForecastRange(location, start, end, options = {}) {
  try {
    const results = [];
    let current = new Date(start);

    while (current <= new Date(end)) {
      const daily = await getSuperForecast(
        { ...location, date: current.toISOString().split("T")[0] },
        options
      );
      results.push(daily);

      // avancer d’un jour
      current.setDate(current.getDate() + 1);
    }

    return results;
  } catch (err) {
    console.error("❌ Erreur dans getSuperForecastRange:", err.message);
    return [];
  }
}

// ✅ Export par défaut
export default {
  getSuperForecast,
  getSuperForecastRange,
};
