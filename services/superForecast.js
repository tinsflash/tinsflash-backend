// services/superForecast.js
import axios from "axios";
import Forecast from "../models/Forecast.js";
import { CohereClient } from "cohere-ai";

const cohere = CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Fonction principale pour exécuter un SuperForecast
async function runSuperForecast(lat, lon) {
  try {
    console.log("🚀 Run SuperForecast lancé");

    // 1. Récupération des données météo
    console.log("📍 Lancement SuperForecast pour lat=" + lat + ", lon=" + lon);

    const sources = [
      "https://api.open-meteo.com/v1/forecast?latitude=" +
        lat +
        "&longitude=" +
        lon +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto",
      "https://api.openweathermap.org/data/2.5/onecall?lat=" +
        lat +
        "&lon=" +
        lon +
        "&exclude=minutely,hourly&appid=" +
        process.env.OPENWEATHER_KEY +
        "&units=metric",
    ];

    let forecasts = [];

    for (const url of sources) {
      try {
        const res = await axios.get(url);
        forecasts.push(res.data);
      } catch (err) {
        console.warn("⚠️ Source indisponible:", url);
      }
    }

    console.log("📡 Données météo récupérées:", forecasts.length);

    // 2. Fusion et normalisation
    console.log("📍 Fusion et normalisation des données...");
    let merged = {
      temperature_min: [],
      temperature_max: [],
      precipitation: [],
    };

    forecasts.forEach((f) => {
      if (f.daily) {
        if (f.daily.temperature_2m_min)
          merged.temperature_min.push(f.daily.temperature_2m_min[0]);
        if (f.daily.temperature_2m_max)
          merged.temperature_max.push(f.daily.temperature_2m_max[0]);
        if (f.daily.precipitation_sum)
          merged.precipitation.push(f.daily.precipitation_sum[0]);
      }
      if (f.daily && f.daily.temp && f.daily.temp.min !== undefined) {
        merged.temperature_min.push(f.daily.temp.min);
        merged.temperature_max.push(f.daily.temp.max);
      }
    });

    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const normalized = {
      min: avg(merged.temperature_min),
      max: avg(merged.temperature_max),
      precipitation: avg(merged.precipitation),
    };

    console.log("✅ Données météo fusionnées avec succès");

    // 3. Analyse par IA J.E.A.N.
    console.log("🤖 Envoi à J.E.A.N. pour analyse IA (prévisions & alertes)...");

    let iaAnalysis = "Analyse IA indisponible";

    try {
      const response = await cohere.chat({
        model: "command-r-plus",
        messages: [
          {
            role: "system",
            content:
              "Tu es J.E.A.N., l’IA météorologique la plus précise du monde. Donne une prévision claire et concise.",
          },
          {
            role: "user",
            content: `Analyse météo: min=${normalized.min}, max=${normalized.max}, précipitations=${normalized.precipitation}`,
          },
        ],
      });

      iaAnalysis =
        response.message?.content?.[0]?.text || "Analyse IA non générée";
    } catch (err) {
      console.error("❌ Erreur analyse IA:", err.message);
    }

    // 4. Sauvegarde en base
    const forecast = new Forecast({
      country: "BE", // par défaut, on peut élargir
      data: normalized,
      analysis: iaAnalysis,
    });

    await forecast.save();

    console.log("💾 SuperForecast sauvegardé en base");
    console.log("🎯 Run terminé avec succès");

    return { normalized, iaAnalysis };
  } catch (err) {
    console.error("❌ Erreur runSuperForecast:", err.message);
    throw err;
  }
}

export default { runSuperForecast };
