const axios = require("axios");

async function getWeather(lat, lon) {
  try {
    // OpenWeather
    const ow = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.SATELLITE_API}&units=metric&lang=fr`
    );

    // Meteomatics (simplifié)
    const mmUser = process.env.METEOMATIC_USER;
    const mmPass = process.env.METEOMATIC_PASS;

    // ⚠️ Ici juste exemple → tu pourras ajouter des requêtes Meteomatics
    return {
      source: "TINSFLASH Fusion",
      temp: ow.data.main.temp,
      condition: ow.data.weather[0].description,
    };
  } catch (error) {
    return { error: "Impossible de récupérer météo" };
  }
}

module.exports = { getWeather };

