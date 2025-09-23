// services/chatService.js
import { CohereClient } from "cohere-ai";
import { addLog } from "./logsService.js";

// Crée une instance Cohere
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

/**
 * 🤖 Chat avec J.E.A.N. (expert météo)
 */
async function chatWithJean(message) {
  try {
    addLog("⚡ Tentative réponse avec Cohere (command-r-plus)...");
    const ia = await cohere.chat({
      model: "command-r-plus",
      messages: [
        {
          role: "system",
          content:
            "Tu es J.E.A.N., le mécanicien nucléaire et expert météo de la Centrale Nucléaire Météo mondiale. " +
            "Tu analyses les modèles météo, tu détectes les anomalies et tu expliques clairement les prévisions et alertes.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = ia.message?.content[0]?.text || "⚠️ Réponse IA vide";
    addLog("✅ Réponse obtenue via Cohere");
    return { engine: "Cohere (command-r-plus)", text: reply };
  } catch (err) {
    addLog("❌ Erreur chatWithJean (Cohere): " + err.message);
    return { engine: "Cohere", text: `❌ Erreur IA Cohere: ${err.message}` };
  }
}

export { chatWithJean };
export default { chatWithJean };
