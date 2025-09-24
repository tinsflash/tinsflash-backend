// services/chatService.js
import { CohereClient } from "cohere-ai";
import { addLog } from "./logsService.js";

const hasKey = !!process.env.COHERE_API_KEY;
const cohere = hasKey ? new CohereClient({ token: process.env.COHERE_API_KEY }) : null;

/**
 * Chat IA J.E.A.N. — explications scientifiques, prévisions, alertes.
 */
export async function chatWithJean(message) {
  try {
    if (!message || !message.trim()) {
      return "Donne-moi ta question météo (zone, échéance, risque…).";
    }
    if (!cohere) {
      await addLog("❌ IA indisponible: COHERE_API_KEY manquant sur Render.");
      return "J.E.A.N. indisponible (clé IA absente sur le serveur).";
    }

    const res = await cohere.chat({
      model: "command-r-plus",
      messages: [{ role: "user", content: message }],
    });

    const text =
      res?.message?.content?.map(p => p?.text || "").join("\n").trim() ||
      res?.text ||
      "Analyse IA non fournie.";

    await addLog("🤖 JEAN a répondu via Cohere.");
    return text;
  } catch (err) {
    await addLog("❌ Erreur JEAN: " + err.message);
    return "Erreur IA: " + err.message;
  }
}

export default { chatWithJean };
