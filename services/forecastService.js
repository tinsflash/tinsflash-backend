// services/forecastService.js
import axios from "axios";
import Forecast from "../models/Forecast.js";
import { askOpenAI } from "../utils/openai.js";

export async function runForecast(lat = 50.8503, lon = 4.3517) {
  const results = [];
  const errors = [];

  try {
    // --- 1. OpenMeteo ---
    const om = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`
    );
    results.push({
      source: "OpenMeteo",
      temperature: om.data.hourly.temperature_2m[0],
      precipitation: om.data.hourly.precipitation[0],
      wind: om.data.hourly.wind_speed_10m[0],
    });
  } catch (err) {
    errors.push("Erreur OpenMeteo: " + err.message);
  }

  try {
    // --- 2. OpenWeather ---
    const ow = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}&units=metric`
    );
    results.push({
      source: "OpenWeather",
      temperature: ow.data.main.temp,
      precipitation: ow.data.rain ? ow.data.rain["1h"] || 0 : 0,
      wind: ow.data.wind.speed,
    });
  } catch (err) {
    errors.push("Erreur OpenWeather: " + err.message);
  }

  try {
    // --- 3. DWD (proxy open-meteo) ---
    const dwd = await axios.get(
      `https://dwd.api-proxy.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`
    );
    results.push({
      source: "DWD",
      temperature: dwd.data.hourly.temperature_2m[0],
      precipitation: dwd.data.hourly.precipitation[0],
      wind: dwd.data.hourly.wind_speed_10m[0],
    });
  } catch (err) {
    errors.push("Erreur DWD: " + err.message);
  }

  // --- IA Fusion ---
  let finalForecast = null;
  try {
    const prompt = `
    Voici les prévisions issues de plusieurs modèles météo :
    ${JSON.stringify(results, null, 2)}

    Croise-les et propose une prévision consolidée pour la localisation (lat:${lat}, lon:${lon}).
    Donne un JSON { temperature, precipitation, wind, reliability, description }.
    `;
    const ai = await askOpenAI(prompt);
    finalForecast = JSON.parse(ai);
  } catch (err) {
    errors.push("Erreur IA: " + err.message);
  }

  // --- Enregistrement DB ---
  const forecast = new Forecast({
    time: new Date(),
    location: { lat, lon },
    models: results,
    final: finalForecast,
    errors,
  });

  await forecast.save();

  return forecast;
}
