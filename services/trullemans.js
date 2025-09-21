// services/trullemans.js

function getForecast(lat, lon) {
  try {
    let forecast = {
      source: "Trullemans",
      temperature_min: 6,
      temperature_max: 16,
      wind: 12,
      precipitation: 8,
      reliability: 65
    };

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

export default { getForecast };
