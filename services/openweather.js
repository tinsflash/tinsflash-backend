import fetch from 'node-fetch';

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;

export default async function openweather(location, options = {}) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_KEY}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[OpenWeather] Erreur API: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    temperature: data.main.temp,
    precipitation: data.rain ? data.rain['1h'] || 0 : 0,
    wind: data.wind.speed,
    source: 'OpenWeather'
  };
}
