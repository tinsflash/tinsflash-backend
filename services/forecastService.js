// services/forecastService.js
import fetch from "node-fetch";

/**
 * Prévisions locales (ville ou coordonnées précises)
 * Europe / USA = précision max
 * Autres zones = open data basique
 */
async function getLocalForecast(lat, lon) {
  const apiKey = process.env.OPENWEATHER_KEY;
  if (!apiKey) throw new Error("❌ OPENWEATHER_KEY manquant dans .env");

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`❌ Erreur OpenWeather local: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Prévisions nationales (basées sur la capitale ou ville principale)
 */
async function getNationalForecast(country) {
  const apiKey = process.env.OPENWEATHER_KEY;
  if (!apiKey) throw new Error("❌ OPENWEATHER_KEY manquant dans .env");

  // Exemple simple : on prend le pays comme requête directe
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${country}&units=metric&lang=fr&appid=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`❌ Erreur OpenWeather national: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Prévisions sur 7 jours (OneCall API)
 */
async function get7DayForecast(lat, lon) {
  const apiKey = process.env.OPENWEATHER_KEY;
  if (!apiKey) throw new Error("❌ OPENWEATHER_KEY manquant dans .env");

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&lang=fr&appid=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`❌ Erreur OpenWeather 7j: ${res.statusText}`);
  }

  return res.json();
}

// ✅ Export par défaut → attendu par server.js et superForecast.js
export default {
  getLocalForecast,
  getNationalForecast,
  get7DayForecast,
};
