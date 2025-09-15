const { getWeather } = require("./weather");
const { getMeteomatics } = require("./meteomatics");

async function getFusionWeather(lat, lon) {
  try {
    // Données des deux modèles
    const ow = await getWeather(lat, lon);
    const mm = await getMeteomatics(lat, lon);

    // Exemple de fusion (température)
    const tempOpenWeather = ow.main?.temp;
    const tempMeteomatics = mm?.data?.[0]?.coordinates?.[0]?.dates?.[0]?.value;

    const averageTemp = (
      (tempOpenWeather + tempMeteomatics) / 2
    ).toFixed(1);

    // Calcul d’un indice de fiabilité (plus l’écart est faible, plus c’est fiable)
    const diff = Math.abs(tempOpenWeather - tempMeteomatics);
    const reliability = `${(100 - diff * 2).toFixed(1)}%`;

    return {
      temperature: averageTemp,
      temp_openweather: tempOpenWeather,
      temp_meteomatics: tempMeteomatics,
      reliability,
    };
  } catch (error) {
    console.error("Erreur fusion météo:", error.message);
    throw new Error("Impossible de fusionner les données météo");
  }
}

module.exports = { getFusionWeather };
