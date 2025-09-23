// chatService.js
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * Chat avec J.E.A.N. (IA météo nucléaire)
 */
async function chatWithJean(message) {
  try {
    const response = await cohere.chat({
      model: "command-r-plus", // modèle IA gratuit actuel
      messages: [
        {
          role: "system",
          content: "Tu es J.E.A.N., expert météo de la Centrale Nucléaire Météo mondiale. \
          Tu analyses les données météo fusionnées, expliques les runs et alertes, \
          et aides l’administrateur à comprendre et valider les prévisions.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = response.message?.content?.[0]?.text || "⚠️ Réponse IA vide";
    return { text };
  } catch (err) {
    return { text: `❌ Erreur IA Cohere (chat API): ${err.message}` };
  }
}

export default { chatWithJean };
