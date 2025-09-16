// hiddensources/openweather.js
// OpenWeather API Premium - clé déjà fournie par toi

import fetch from "node-fetch";

export async function getOpenWeather(lat = 50.5, lon = 4.5) {
  try {
    const key = process.env.OPENWEATHER_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=fr`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      source: "OpenWeather",
      temp: data?.main?.temp,
      desc: data?.weather?.[0]?.description,
      date: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Erreur OpenWeather:", err);
    return { source: "OpenWeather", error: true };
  }
}
