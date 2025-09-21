// hiddensources/iconDwd.js
import axios from "axios";

async function getForecast(lat, lon) {
  try {
    const res = await axios.get(
      `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=auto`
    );

    return {
      source: "ICON-DWD",
      temperature_min: Math.min(...res.data.hourly.temperature_2m),
      temperature_max: Math.max(...res.data.hourly.temperature_2m),
      wind: Math.max(...res.data.hourly.wind_speed_10m),
      precipitation: res.data.hourly.precipitation.reduce((a, b) => a + b, 0),
      reliability: 80
    };
  } catch (err) {
    console.error("❌ ICON-DWD error:", err.message);
    return {
      source: "ICON-DWD",
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
