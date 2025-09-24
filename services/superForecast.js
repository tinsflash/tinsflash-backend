// services/superForecast.js
import pkg from "cohere-ai";
import { addLog } from "./logsService.js";

const { CohereClient } = pkg;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function runSuperForecast(forecastData) {
  try {
    await addLog("🚀 SuperForecast lancé");

    const prompt = `
      Analyse les prévisions météo fusionnées suivantes :
      ${JSON.stringify(forecastData, null, 2)}
      Fournis :
      - Une tendance générale par pays (BE, FR, LUX, USA si dispo)
      - Les risques principaux (pluie, vent, neige, orages, inondations)
      - La probabilité (%) d’événements extrêmes
    `;

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [{ role: "user", content: prompt }],
    });

    const analysis =
      response.message?.content?.[0]?.text ||
      response.text ||
      "⚠️ Analyse IA indisponible";

    await addLog(`📊 Analyse SuperForecast: ${analysis}`);

    return analysis;
  } catch (err) {
    console.error("❌ Erreur SuperForecast:", err.message);
    await addLog("❌ Erreur SuperForecast: " + err.message);
    return "Erreur : SuperForecast indisponible.";
  }
}
