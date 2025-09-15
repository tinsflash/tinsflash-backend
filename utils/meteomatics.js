// utils/meteomatics.js
const axios = require("axios");

async function getMeteomaticsWeather(lat, lon) {
  try {
    const user = process.env.METEOMATIC_USER;
    const pass = process.env.METEOMATIC_PASS;

    // Exemple : température, vent et précipitations (ajoutons-en d’autres ensuite)
    const params = "t_2m:C,precip_1h:mm,wind_speed_10m:ms";
    const start = new Date().toISOString().split(".")[0] + "Z";
    const url = `https://api.meteomatics.com/${start}/PT1H/${params}/${lat},${lon}/json`;

    const response = await axios.get(url, {
      auth: { username: user, password: pass },
    });

    return response.data;
  } catch (error) {
    console.error("Erreur API Meteomatics:", error.message);
    throw new Error("Impossible de récupérer les données Meteomatics");
  }
}

module.exports = { getMeteomaticsWeather };

