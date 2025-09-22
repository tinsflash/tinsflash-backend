// services/chatService.js
import { askJean } from "./openai.js";

async function chatWithJean(message) {
  try {
    if (!message) {
      throw new Error("Message vide envoyé à J.E.A.N.");
    }

    const reply = await askJean(message);
    return reply;
  } catch (err) {
    console.error("❌ Erreur chatService:", err.message);
    return "⚠️ JEAN n’est pas disponible actuellement.";
  }
}

export default { chatWithJean };
