// services/localFactors.js

function adjustWithLocalFactors(forecast, region = "GENERIC") {
  if (!forecast) return forecast;

  if (region === "BE") {
    forecast.reliability += 5;
  }

  if (forecast.temperature_max && forecast.temperature_max > 30) {
    forecast.reliability -= 2;
  }

  return forecast;
}

function applyLocalFactors(forecast, lat, lon) {
  let region = "GENERIC";
  if (lat > 49 && lat < 52 && lon > 2 && lon < 6) region = "BE";
  return adjustWithLocalFactors(forecast, region);
}

export default { applyLocalFactors, adjustWithLocalFactors };
