// services/localFactors.js

function applyLocalFactors(forecast, lat, lon) {
  try {
    console.log("🌍 Application facteurs locaux");

    // Exemple : Belgique = climat océanique tempéré
    if (lat >= 49 && lat <= 51.5 && lon >= 2 && lon <= 6) {
      forecast.reliability = (forecast.reliability || 80) - 5;
      forecast.description = (forecast.description || "") + " (ajustement climat belge)";
    }

    // Exemple : zones méditerranéennes
    if (lat >= 40 && lat <= 44 && lon >= 5 && lon <= 10) {
      forecast.precipitation *= 0.7;
      forecast.description = (forecast.description || "") + " (influence méditerranéenne)";
    }

    return forecast;
  } catch (err) {
    console.error("❌ Erreur localFactors:", err.message);
    return forecast;
  }
}

// 👉 Export par défaut (pas d’accolades)
export default applyLocalFactors;
