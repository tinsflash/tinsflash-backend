const axios = require("axios");

async function getMeteomatics(lat, lon) {
  const user = process.env.METEOMATICS_USER;
  const pass = process.env.METEOMATICS_PASS;

  const now = new Date().toISOString().split(".")[0] + "Z";
  const url = `https://api.meteomatics.com/${now}/t_2m:C,precip_1h:mm,wind_speed_10m:ms/${lat},${lon}/json`;

  try {
    const response = await axios.get(url, {
      auth: { username: user, password: pass },
    });
    return response.data;
  } catch (error) {
    console.error("Erreur Meteomatics:", error.message);
    throw new Error("Impossible d'obtenir les données Meteomatics");
  }
}

module.exports = { getMeteomatics };


