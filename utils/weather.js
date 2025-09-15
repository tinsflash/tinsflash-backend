const axios = require("axios");

async function getWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Erreur OpenWeather:", error.message);
    throw new Error("Impossible d'obtenir les données OpenWeather");
  }
}

module.exports = { getWeather };
