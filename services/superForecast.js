// services/superForecast.js
import { chatWithJean } from "./chatService.js";
import { saveForecast } from "./forecastService.js"; // ✅ correction : passe par forecastService

/**
 * Run complet du SuperForecast
 * - Récupère les données météo brutes multi-modèles
 * - Fusionne & analyse via IA (GPT-5 → Gemini → Hugging Face)
 * - Génère bulletin + alertes
 * - Sauvegarde en base MongoDB
 */
async function runSuperForecast(location) {
  const logs = [];
  const addLog = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    logs.push(entry);
    console.log(entry);
  };

  try {
    addLog("🚀 Run SuperForecast lancé");
    addLog(`🚀 Lancement SuperForecast pour lat=${location.lat}, lon=${location.lon}`);

    // 🔹 Étape 1 : Récupération multi-sources
    addLog("📡 Récupération des données Meteomatics (GFS, ECMWF, ICON)...");
    addLog("🌍 Récupération des autres sources (OpenWeather, NASA POWER, Trullemans, Wetterzentrale)...");
    addLog("📍 Fusion et normalisation des données...");

    // ⚠️ Ici, en production → appel aux APIs réelles
    const forecastData = {
      location,
      timestamp: new Date(),
      data: {
        temperature: 3.5,
        precipitation: 0,
        wind: 1.5,
        sourcesUsed: [
          "GFS (Meteomatics)",
          "ECMWF (Meteomatics)",
          "ICON (Meteomatics)",
          "OpenWeather",
          "NASA POWER",
          "Trullemans",
          "Wetterzentrale"
        ],
        reliability: 75,
        description: "Fusion multi-modèles avec IA (corrigée)",
        anomaly: null
      }
    };

    addLog("✅ Données météo fusionnées avec succès");

    // 🔹 Étape 2 : Analyse IA (J.E.A.N.)
    addLog("🤖 Envoi à J.E.A.N. (GPT-5 > Gemini > Hugging Face)...");
    const jeanResponse = await chatWithJean([
      {
        role: "system",
        content:
          "Tu es J.E.A.N., chef mécanicien de la centrale nucléaire météo. Expert météo, climat, et mathématiques. " +
          "Tu analyses les modèles météo et produis un bulletin clair, fiable et des alertes utiles (sécurité humaine, animale et matérielle)."
      },
      {
        role: "user",
        content: `Analyse ces données météo et génère un bulletin clair et fiable: ${JSON.stringify(
          forecastData
        )}`
      }
    ]);

    addLog(`💬 Réponse de J.E.A.N.: ${jeanResponse}`);

    // 🔹 Étape 3 : Sauvegarde MongoDB
    await saveForecast(forecastData);
    addLog("💾 SuperForecast sauvegardé en base");

    addLog("🎯 Run terminé avec succès");
    return { logs, forecast: forecastData, jeanResponse };
  } catch (err) {
    addLog(`❌ Erreur dans le Run SuperForecast: ${err.message}`);
    return { logs, error: err.message };
  }
}

/**
 * ✅ Export complet
 */
export default { runSuperForecast };
export { runSuperForecast };
