// services/trullemans.js
export function applyTrullemansAdjustments(forecast) {
  // Hypothèse: Trullemans corrige la température en fonction de l’humidité
  if (forecast.precipitation > 20) {
    forecast.temperature_max -= 1;
  }
  return forecast;
}
