// services/localFactors.js

export function applyLocalFactors(forecast, region = "BE") {
  // 🇧🇪 Ajustements pour la Belgique
  if (region === "BE") {
    forecast.reliability = Math.min(100, forecast.reliability + 5);
  }

  // 🇫🇷 Ajustements pour la France
  if (region === "FR") {
    forecast.temperature_max += 1;
  }

  // On peut rajouter d'autres pays/régions ici plus tard
  return forecast;
}
