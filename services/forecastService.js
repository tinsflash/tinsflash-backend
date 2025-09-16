import fetch from "node-fetch";

export async function getForecast(lat, lon) {
  const apiKey = process.env.OPENWEATHER_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_KEY manquant dans les variables d'environnement");
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;

  const reply = await fetch(url);
  const data = await reply.json();

  if (data.cod !== "200") {
    throw new Error(data.message || "Erreur API OpenWeather");
  }

  return {
    source: "OpenWeather",
    reliability: 92,
    data
  };
}
