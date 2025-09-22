// services/superForecast.js
import { addLog } from "./logsService.js";
import Forecast from "../models/Forecast.js";
import { getLocalForecast, getNationalForecast } from "./forecastService.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Run complet du SuperForecast
 */
async function runFullForecast(lat, lon, country = "Europe/USA") {
  try {
    addLog("🚀 Run SuperForecast lancé");
    addLog(`📡 Lancement pour lat=${lat}, lon=${lon}, pays=${country}`);

    // 1. Prévisions locales + nationales
    const local = await getLocalForecast(lat, lon, country);
    const national = await getNationalForecast(country);

    addLog("✅ Prévisions brutes récupérées");

    // 2. Fusion IA avec GPT-5
    addLog("🔄 Fusion des données avec IA (GPT-5)...");
    const aiAnalysis = await client.chat.completions.create({
      model: "gpt-4o-mini", // GPT-5
      messages: [
        {
          role: "system",
          content: `Tu es J.E.A.N., chef mécanicien météo nucléaire.
Fusionne toutes les prévisions (locales + nationales), détecte anomalies,
et génère un bulletin météo clair, précis et fiable.
Toujours expliquer les écarts avec les normales de saison.`,
        },
        {
          role: "user",
          content: `Prévisions locales: ${JSON.stringify(local)}
Prévisions nationales: ${JSON.stringify(national)}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.2,
    });

    const bulletin = aiAnalysis.choices[0].message.content;

    // 3. Sauvegarde en base
    const forecast = new Forecast({
      location: { lat, lon },
      data: { local, national },
      bulletin,
      timestamp: new Date(),
    });

    await forecast.save();
    addLog("💾 SuperForecast sauvegardé en base");
    addLog("📰 Bulletin généré via IA");

    return { forecast, bulletin };
  } catch (err) {
    addLog("❌ Erreur SuperForecast: " + err.message);
    throw err;
  }
}

export default { runFullForecast };
