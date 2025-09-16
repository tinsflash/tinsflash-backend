import fetch from "node-fetch";

export async function getForecast(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHER_KEY}`;
    const reply = await fetch(url);
    const data = await reply.json();

    return {
      source: "OpenWeather",
      reliability: 92, // Ex : calcul basé sur les modèles croisés
      data
    };
  } catch (err) {
    throw new Error("Erreur service prévisions météo : " + err.message);
  }
}
