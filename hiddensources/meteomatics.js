// hiddensources/meteomatics.js
import axios from "axios";

async function getForecast(lat, lon) {
  try {
    // Exemple simplifié : remplacer par vraie API Meteomatics si clé dispo
    const res = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`
    );

    return {
      source: "Meteomatics",
      temperature_min: Math.min(...res.data.hourly.temperature_2m),
      temperature_max: Math.max(...res.data.hourly.temperature_2m),
      wind: Math.max(...res.data.hourly.wind_speed_10m),
      precipitation: res.data.hourly.precipitation.reduce((a, b) => a + b, 0),
      reliability: 75
    };
  } catch (err) {
    console.error("❌ Meteomatics error:", err.message);
    return null;
  }
}

export default { getForecast };
