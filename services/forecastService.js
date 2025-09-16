import fetch from "node-fetch";

export async function getForecast(lat, lon) {
  try {
    const apiKey = process.env.OPENWEATHER_KEY;
    if (!apiKey) {
      throw new Error("Clé OPENWEATHER_KEY manquante dans Render !");
    }

    // Construire l’URL
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    console.log("🔎 URL appelée :", url);

    // Requête vers OpenWeather
    const reply = await fetch(url);
    const data = await reply.json();

    console.log("📡 Réponse OpenWeather :", data);

    if (data.cod !== "200") {
      throw new Error(data.message || "Erreur API OpenWeather");
    }

    return {
      source: "OpenWeather",
      reliability: 92,
      data,
    };
  } catch (err) {
    throw new Error("Erreur service prévisions météo : " + err.message);
  }
}
