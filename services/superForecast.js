// services/superForecast.js
import axios from "axios";
import coherePkg from "cohere-ai";
import forecastService from "./forecastService.js";
import alertsService from "./alertsService.js";

// Init Cohere client
const { CohereClient } = coherePkg;
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function runSuperForecast(lat, lon) {
  try {
    console.log("🚀 Lancement SuperForecast...");

    // 1️⃣ Récupération des données météo multi-sources (placeholder pour l’instant)
    const fakeData = {
      min: 5,
      max: 15,
      icon: "🌤️",
      text: "Temps globalement calme avec éclaircies"
    };

    // 2️⃣ Analyse IA J.E.A.N.
    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        {
          role: "user",
          content: `Analyse ces prévisions météo pour lat=${lat}, lon=${lon} et génère un résumé clair + alertes éventuelles: ${JSON.stringify(fakeData)}`
        }
      ]
    });

    let aiSummary = "";
    if (response.text) {
      aiSummary = response.text;
    } else if (response.message?.content?.[0]?.text) {
      aiSummary = response.message.content[0].text;
    } else {
      aiSummary = "⚠️ Résumé IA non disponible.";
    }

    // 3️⃣ Sauvegarde prévision nationale (Belgique en exemple)
    await forecastService.saveNationalForecast("BE", [], aiSummary, fakeData.icon);

    // 4️⃣ Détection et sauvegarde alerte éventuelle
    if (aiSummary.toLowerCase().includes("tempête") || aiSummary.toLowerCase().includes("orage")) {
      await alertsService.createAlert({
        type: "Orage/Tempête",
        level: "orange",
        certainty: 85,
        description: aiSummary,
        location: "Belgique"
      });
    }

    console.log("✅ SuperForecast terminé avec succès");
    return { forecast: aiSummary, icon: fakeData.icon };
  } catch (err) {
    console.error("❌ Erreur dans SuperForecast :", err.message);
    return { forecast: "⚠️ Erreur dans le moteur SuperForecast." };
  }
}

export default { runSuperForecast };
