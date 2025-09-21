// services/forecastVision.js

function detectSeasonalAnomaly(forecast) {
  // logique pour détecter anomalies saisonnières
  if (!forecast || !forecast.temp) return null;

  const anomalies = [];
  if (forecast.temp < -10 || forecast.temp > 40) {
    anomalies.push("Anomalie extrême de température détectée !");
  }

  return anomalies.length > 0 ? anomalies : null;
}

export { detectSeasonalAnomaly };
