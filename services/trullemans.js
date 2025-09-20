// services/trullemans.js

// 🔮 Modèle Trullemans (ajustements empiriques)
// Simulation simple pour compléter les autres sources météo
function getForecast(lat, lon) {
  try {
    // Données de base fictives (à remplacer si API/algorithme spécifique dispo)
    let forecast = {
      source: "Trullemans",
      temperature_min: 6,
      temperature_max: 16,
      wind: 12,
      precipitation: 8,
      reliability: 65
    };

    // Ajustement spécifique Trullemans : humidité/fortes pluies → baisse de T° max
    if (forecast.precipitation > 20) {
      forecast.temperature_max -= 1;
    }

    return forecast;
  } catch (err) {
    console.error("❌ Trullemans error:", err.message);
    return {
      source: "Trullemans",
      temperature_min: 0,
      temperature_max: 0,
      wind: 0,
      precipitation: 0,
      reliability: 0,
      error: err.message
    };
  }
}

// ✅ Export par défaut attendu par superForecast.js
export default { getForecast };
