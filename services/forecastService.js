// services/forecastService.js
import axios from "axios";

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Prévisions locales (point GPS)
 */
export async function getLocalForecast(lat, lon) {
  try {
    const url = `${OPENWEATHER_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric&lang=fr`;
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("❌ Erreur getLocalForecast:", err.message);
    throw new Error("Impossible de récupérer la prévision locale.");
  }
}

/**
 * Prévisions nationales (par pays)
 * On utilise la météo capitale du pays comme proxy rapide
 */
export async function getNationalForecast(country) {
  try {
    const url = `${OPENWEATHER_URL}/forecast?q=${country}&appid=${OPENWEATHER_KEY}&units=metric&lang=fr`;
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("❌ Erreur getNationalForecast:", err.message);
    throw new Error("Impossible de récupérer la prévision nationale.");
  }
}

/**
 * Prévisions sur 7 jours (GPS)
 */
export async function get7DayForecast(lat, lon) {
  try {
    const url = `${OPENWEATHER_URL}/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${OPENWEATHER_KEY}&units=metric&lang=fr`;
    const res = await axios.get(url);
    return res.data.daily; // uniquement les 7 jours
  } catch (err) {
    console.error("❌ Erreur get7DayForecast:", err.message);
    throw new Error("Impossible de récupérer la prévision 7 jours.");
  }
}
