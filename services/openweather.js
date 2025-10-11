// ==========================================================
// 🌦️ OpenWeather Service – TINSFLASH PRO+++
// ==========================================================
import axios from "axios";

export async function fetchOpenWeather(lat, lon) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error("Clé API OpenWeather absente");
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;
    const { data } = await axios.get(url, { timeout: 15000 });

    return {
      source: "OpenWeather",
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind: data.wind.speed,
      clouds: data.clouds.all,
      description: data.weather[0]?.description || "n/d",
      timestamp: new Date(),
      status: "ok",
    };
  } catch (err) {
    return {
      source: "OpenWeather",
      error: err.message,
      status: "error",
      timestamp: new Date(),
    };
  }
}
