const axios = require("axios");

// Météo standard → OpenWeather
async function getWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const res = await axios.get(url);
  return res.data;
}

// Météo Pro → Meteomatics
async function getWeatherPro(lat, lon) {
  const user = process.env.METEOMATIC_USER;
  const pass = process.env.METEOMATIC_PASS;
  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  const today = new Date().toISOString().split("T")[0];
  const url = `https://api.meteomatics.com/${today}T00:00:00Z/t_2m:C/${lat},${lon}/json`;

  const res = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` }
  });

  return res.data;
}

module.exports = { getWeather, getWeatherPro };

