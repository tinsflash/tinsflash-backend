// hiddensources/openweather.js
import axios from "axios";

const API_KEY = process.env.OPENWEATHER_KEY || "demo";

async function getForecast(lat, lon) {
  try {
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
    );

    const temps = res.data.list.map(d => d.main.temp);
    const wind = res.data.list.map(d => d.wind.speed);
    const rain = res.data.list.map(d => (d.rain ? d.rain["3h"] || 0 : 0));

    return {
      source: "OpenWeather",
      temperature_min: Math.min(...temps),
      temperature_max: Math.max(...temps),
      wind: Math.max(...wind),
      precipitation: rain.reduce((a, b) => a + b, 0),
      reliability: 70
    };
  } catch (err) {
    console.error("❌ OpenWeather error:", err.message);
    return {
      source: "OpenWeather",
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
