// services/chatService.js
import { askJean } from "./openai.js";

async function chatWithJean(message) {
  try {
    if (!message || message.trim() === "") {
      return "⚠️ Message vide.";
    }
    const reply = await askJean(message);
    return reply || "⚠️ Pas de réponse de J.E.A.N.";
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err.message);
    return "❌ Erreur lors de la communication avec J.E.A.N.";
  }
}

export default { chatWithJean };
