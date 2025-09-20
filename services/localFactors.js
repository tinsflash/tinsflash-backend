// services/localFactors.js

// Ajuste les prévisions en fonction de facteurs locaux (ex: microclimat)
export function adjustWithLocalFactors(forecast, region = "BE") {
  if (!forecast) return forecast;

  if (region === "BE") {
    forecast.reliability += 5;
  }
  if (forecast.temperature_max && forecast.temperature_max > 30) {
    forecast.reliability -= 2; // fortes chaleurs = incertitude
  }

  return forecast;
}

// ✅ Alias attendu par superForecast.js
export function applyLocalFactors(forecast, lat, lon) {
  let region = "GENERIC";
  if (lat > 49 && lat < 52 && lon > 2 && lon < 6) region = "BE";
  return adjustWithLocalFactors(forecast, region);
}
