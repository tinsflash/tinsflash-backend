import { applyTrullemansAdjustments } from "../services/trullemans.js";

export async function compareSources(lat, lon) {
  try {
    // Exemple de comparaison de sources
    const baseForecast = {
      source: "Comparator",
      temperature: 15,
      wind: 20,
      precipitation: 5
    };

    // Application de la méthode Trullemans
    const adjusted = applyTrullemansAdjustments({ ...baseForecast });

    return {
      source: "Comparator",
      summary: `Temp ${adjusted.temperature}°C, Vent ${adjusted.wind} km/h`,
      adjustment: "Trullemans applied"
    };
  } catch (err) {
    return { source: "Comparator", error: err.message };
  }
}
