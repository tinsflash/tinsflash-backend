const axios = require("axios");

async function getWeather(lat, lon) {
  try {
    const apiKey = process.env.OPENWEATHER_KEY; // ta clé est dans Render
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Erreur API météo:", error.message);
    throw new Error("Impossible de récupérer la météo");
  }
}

module.exports = { getWeather };

