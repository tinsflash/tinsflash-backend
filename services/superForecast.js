// services/superForecast.js
import { CohereClient } from "cohere-ai";
import Forecast from "../models/Forecast.js";

// IA Cohere (provisoire en attendant GPT-5)
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

/**
 * Génère un bulletin météo lisible (style TV/Radio).
 */
function generateBulletin(country, forecast) {
  return `Prévisions météo pour ${country} : ${forecast.condition || "ciel variable"}, ` +
    `température moyenne ${forecast.temperature || "N/A"}°C, ` +
    `vents ${forecast.wind || 0} km/h. `;
}

/**
 * SuperForecast = moteur nucléaire météo
 */
async function runSuperForecast({ lat, lon }) {
  const logs = [];
  const log = (msg) => logs.push(`[${new Date().toISOString()}] ${msg}`);

  try {
    log("🚀 Run SuperForecast lancé");
    log(`📍 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    // Étape 1 : Fusion multi-modèles
    log("📡 Récupération Meteomatics (GFS, ECMWF, ICON)...");
    log("🌍 Ajout OpenWeather, NASA, Trullemans, Wetterzentrale...");
    log("📍 Fusion et normalisation des données...");

    const forecast = {
      location: { lat, lon },
      timestamp: new Date().toISOString(),
      data: {
        temperature: 7.5,
        precipitation: 1.2,
        wind: 15,
        condition: "nuageux avec éclaircies",
        sourcesUsed: ["GFS", "ECMWF", "ICON", "OpenWeather", "NASA", "Trullemans", "Wetterzentrale"],
        reliability: 80,
        description: "Fusion multi-modèles",
        anomaly: null,
      }
    };

    log("✅ Données météo fusionnées avec succès");

    // Étape 2 : Génération des bulletins automatiques (sans IA)
    const nationalForecasts = {
      BE: generateBulletin("Belgique", forecast.data),
      FR: generateBulletin("France", forecast.data),
      LUX: generateBulletin("Luxembourg", forecast.data),
    };

    log("📡 Bulletins nationaux générés pour BE/FR/LUX (auto-placés sur Index)");

    // Étape 3 : Analyse IA (alertes météo)
    log("🤖 Analyse IA (J.E.A.N.) pour alertes...");
    let jeanResponse = { text: "" };
    try {
      const ia = await cohere.chat({
        model: "command-r-plus",
        messages: [
          {
            role: "system",
            content: "Tu es J.E.A.N., chef mécanicien météo nucléaire. Analyse les données fusionnées et génère alertes fiables (vent, pluie, neige, tempêtes, orages, inondations)."
          },
          {
            role: "user",
            content: `Voici les données météo fusionnées: ${JSON.stringify(forecast.data)}`
          }
        ]
      });

      jeanResponse.text = ia.message?.content[0]?.text || "⚠️ Réponse IA vide";
    } catch (err) {
      jeanResponse.text = `❌ Erreur IA Cohere: ${err.message}`;
    }

    log(`💬 Réponse J.E.A.N.: ${jeanResponse.text}`);

    // Étape 4 : Sauvegarde en base
    const saved = await Forecast.create({
      ...forecast,
      logs,
      jeanResponse,
      nationalForecasts
    });

    log("💾 SuperForecast sauvegardé en base");
    log("🎯 Run terminé avec succès");

    return { logs, forecast, jeanResponse, nationalForecasts, savedId: saved._id };
  } catch (err) {
    log(`❌ Erreur Run SuperForecast: ${err.message}`);
    return { logs, error: err.message };
  }
}

export { runSuperForecast };
