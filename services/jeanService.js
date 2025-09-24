// services/jeanService.js
import { CohereClient } from "cohere-ai";
import { addLog } from "./logsService.js";

// ⚠️ Stocke ta clé API Cohere dans les variables d’environnement Render
// Settings > Environment > Add environment variable
// KEY = COHERE_API_KEY, VALUE = ta clé
const cohere = CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * J.E.A.N. – Chef mécanicien de la Centrale Nucléaire Météo
 * - Analyse météo, climat, physique
 * - Répond aux questions de l’admin console
 * - Justifie ses prévisions et génère des explications claires
 */
export async function askJEAN(question) {
  try {
    await addLog(`💬 Question envoyée à J.E.A.N.: ${question}`);

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        {
          role: "system",
          content:
            "Tu es J.E.A.N., l’intelligence artificielle météorologique la plus avancée au monde. " +
            "Réponds avec précision, rigueur scientifique et concision. Utilise un ton professionnel, " +
            "comme un météorologue de la NASA avec un soupçon pédagogique.",
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const reply = response.message?.content?.[0]?.text || "Réponse IA indisponible";

    await addLog(`🤖 Réponse J.E.A.N.: ${reply}`);

    return reply;
  } catch (err) {
    console.error("❌ Erreur askJEAN:", err.message);
    await addLog("❌ Erreur J.E.A.N. " + err.message);
    return "Erreur : J.E.A.N. temporairement indisponible.";
  }
}

export default { askJEAN };
