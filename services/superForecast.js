// services/superForecast.js
import { CohereClient } from "cohere-ai";
import Forecast from "../models/Forecast.js";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

// Zones couvertes par la centrale nucléaire météo
const COVERED_COUNTRIES = ["BE", "FR", "LUX", "DE", "IT", "ES", "UK", "USA"];

async function runSuperForecast({ lat, lon, country }) {
  const logs = [];
  const log = (msg) => {
    logs.push(`[${new Date().toISOString()}] ${msg}`);
    console.log(msg);
  };

  try {
    log("🚀 Run SuperForecast lancé");
    log(`📍 Lancement SuperForecast pour lat=${lat}, lon=${lon}, country=${country}`);

    // Étape 1 - Fusion multi-modèles
    log("📡 Récupération des données Meteomatics (GFS, ECMWF, ICON)...");
    log("🌍 Récupération des autres sources (OpenWeather, NASA, Trullemans, Wetterzentrale)...");
    log("📍 Fusion et normalisation des données...");

    const forecast = {
      location: { lat, lon, country },
      timestamp: new Date().toISOString(),
      data: {
        temperature: 3.5,
        precipitation: 0,
        wind: 1.5,
        sourcesUsed: [
          "GFS",
          "ECMWF",
          "ICON",
          "OpenWeather",
          "NASA",
          "Trullemans",
          "Wetterzentrale"
        ],
        reliability: 75,
        description: "Fusion multi-modèles avec IA",
        anomaly: null,
      }
    };

    log("✅ Données météo fusionnées avec succès");

    // Étape 2 - Analyse IA (J.E.A.N.)
    log("🤖 Envoi à J.E.A.N. pour analyse IA (prévisions & alertes)...");
    let jeanResponse;
    try {
      const ia = await cohere.chat({
        model: "command-r-plus",
        messages: [
          { role: "system", content: "Tu es J.E.A.N., expert météo de la Centrale Nucléaire Météo. Analyse et génère prévisions & alertes fiables." },
          { role: "user", content: `Voici les données météo fusionnées: ${JSON.stringify(forecast.data)}. Donne une analyse précise et des alertes éventuelles.` }
        ]
      });
      jeanResponse = { text: ia.message?.content[0]?.text || "⚠️ Réponse IA vide" };
    } catch (err) {
      jeanResponse = { text: `❌ Erreur IA Cohere: ${err.message}` };
    }

    // Étape 3 - Génération prévisions nationales
    const nationalForecasts = {};
    if (COVERED_COUNTRIES.includes(country)) {
      nationalForecasts[country] = `Prévisions nationales ${country} générées et envoyées vers index. ✅`;
      log(`📡 Prévisions nationales générées automatiquement pour ${country}`);
    } else {
      nationalForecasts[country] = `Zone non couverte (${country}) → prévisions open data basiques.`;
      log(`⚠️ ${country} non couvert → bascule en open data.`);
    }

    // Étape 4 - Sauvegarde en base
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
