// services/jeanService.js
import pkg from "cohere-ai";
import { addLog } from "./logsService.js";

const { CohereClient } = pkg;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * J.E.A.N. – IA experte météo/climat
 * Explications scientifiques, justification des alertes
 */
export async function askJEAN(question) {
  try {
    await addLog(`💬 Question posée à J.E.A.N.: ${question}`);

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        {
          role: "system",
          content:
            "Tu es J.E.A.N., l’intelligence artificielle météorologique la plus avancée du monde. " +
            "Réponds avec précision scientifique, concision et pédagogie, comme un météorologue NASA.",
        },
        { role: "user", content: question },
      ],
    });

    const reply =
      response.message?.content?.[0]?.text ||
      response.text ||
      "⚠️ Réponse J.E.A.N. indisponible";

    await addLog(`🤖 Réponse J.E.A.N.: ${reply}`);
    return reply;
  } catch (err) {
    console.error("❌ Erreur askJEAN:", err.message);
    await addLog("❌ Erreur J.E.A.N.: " + err.message);
    return "Erreur : J.E.A.N. temporairement indisponible.";
  }
}

export default { askJEAN };
