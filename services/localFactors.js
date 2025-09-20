// services/localFactors.js
export function adjustWithLocalFactors(forecast, region = "BE") {
  if (region === "BE") {
    forecast.reliability = Math.min(100, forecast.reliability + 5);
  }
  if (region === "FR") {
    forecast.temperature_max += 1;
  }
  return forecast;
}
