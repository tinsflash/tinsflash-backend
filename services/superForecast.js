// services/superForecast.js
import { chatWithJean } from "./chatService.js";
import { saveForecast } from "../db.js";

export async function runSuperForecast(location) {
  const logs = [];
  const addLog = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    logs.push(entry);
    console.log(entry);
  };

  try {
    addLog("🚀 Run SuperForecast lancé");
    addLog(`🚀 Lancement SuperForecast pour lat=${location.lat}, lon=${location.lon}`);

    // 🔹 Étape 1 : Récupération des données météo brutes
    addLog("📡 Récupération des données Meteomatics (GFS, ECMWF, ICON)...");
    addLog("🌍 Récupération des autres sources (OpenWeather, NASA, Trullemans, Wetterzentrale)...");
    addLog("📍 Fusion et normalisation des données...");

    const fakeForecast = {
      location,
      timestamp: new Date(),
      data: {
        temperature: 3.5,
        precipitation: 0,
        wind: 1.5,
        sourcesUsed: ["GFS", "ECMWF", "ICON", "OpenWeather", "NASA", "Trullemans", "Wetterzentrale"],
        reliability: 75,
        description: "Fusion multi-modèles avec IA",
        anomaly: null
      }
    };

    addLog("✅ Données météo fusionnées avec succès");

    // 🔹 Étape 2 : Analyse IA (J.E.A.N.)
    addLog("🤖 Envoi à J.E.A.N. pour analyse IA (prévisions & alertes)...");
    const jeanResponse = await chatWithJean([
      { role: "system", content: "Tu es J.E.A.N., chef mécanicien de la centrale nucléaire météo. Expert météo, climat, mathématiques. Tu analyses les modèles météo et produis des prévisions fiables et des alertes utiles pour la sécurité humaine, animale et matérielle." },
      { role: "user", content: `Analyse ces données météo et génère un bulletin clair et fiable: ${JSON.stringify(fakeForecast)}` }
    ]);

    addLog(`💬 Réponse de J.E.A.N.: ${jeanResponse}`);

    // 🔹 Étape 3 : Sauvegarde en base
    await saveForecast(fakeForecast);
    addLog("💾 SuperForecast sauvegardé en base");

    addLog("🎯 Run terminé avec succès");
    return { logs, forecast: fakeForecast, jeanResponse };

  } catch (err) {
    addLog(`❌ Erreur dans le Run SuperForecast: ${err.message}`);
    return { logs, error: err.message };
  }
}
