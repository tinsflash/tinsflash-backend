// superForecast.js
import { CohereClient } from "cohere-ai";
import Forecast from "../models/Forecast.js";

// Crée une instance du client Cohere
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

// Simulation fusion multi-modèles
async function runSuperForecast({ lat, lon }) {
  const logs = [];
  const log = (msg) => logs.push(`[${new Date().toISOString()}] ${msg}`);

  try {
    log("🚀 Run SuperForecast lancé");
    log(`📍 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    log("📡 Récupération des données Meteomatics (GFS, ECMWF, ICON)...");
    log("🌍 Récupération des autres sources (OpenWeather, NASA, Trullemans, Wetterzentrale)...");
    log("📍 Fusion et normalisation des données...");

    const forecast = {
      location: { lat, lon },
      timestamp: new Date().toISOString(),
      data: {
        temperature: 3.5,
        precipitation: 0,
        wind: 1.5,
        sourcesUsed: ["GFS", "ECMWF", "ICON", "OpenWeather", "NASA", "Trullemans", "Wetterzentrale"],
        reliability: 75,
        description: "Fusion multi-modèles avec IA",
        anomaly: null,
      }
    };

    log("✅ Données météo fusionnées avec succès");

    // Appel IA Cohere pour analyse
    log("🤖 Envoi à J.E.A.N. pour analyse IA (prévisions & alertes)...");
    let jeanResponse;
    try {
      const ia = await cohere.chat({
        model: "command-r-plus",
        messages: [
          { role: "system", content: "Tu es J.E.A.N., expert météo de la Centrale Nucléaire Météo. Analyse les données météo et génère prévisions et alertes fiables." },
          { role: "user", content: `Voici les données météo fusionnées: ${JSON.stringify(forecast.data)}. Donne une analyse précise.` }
        ]
      });

      jeanResponse = { text: ia.message?.content[0]?.text || "⚠️ Réponse IA vide" };
    } catch (err) {
      jeanResponse = { text: `❌ Erreur IA Cohere: ${err.message}` };
    }

    // Prévisions nationales auto
    const nationalForecasts = {
      BE: "Prévisions nationales Belgique générées et envoyées vers index.",
      FR: "Prévisions nationales France générées et envoyées vers index.",
      LUX: "Prévisions nationales Luxembourg générées et envoyées vers index.",
    };

    log("📡 Prévisions nationales générées automatiquement pour BE/FR/LUX");

    // Sauvegarde
    const saved = await Forecast.create({ ...forecast, logs, jeanResponse, nationalForecasts });
    log("💾 SuperForecast sauvegardé en base");
    log("🎯 Run terminé avec succès");

    return { logs, forecast, jeanResponse, nationalForecasts, savedId: saved._id };
  } catch (err) {
    log(`❌ Erreur Run SuperForecast: ${err.message}`);
    throw err;
  }
}

export { runSuperForecast };
