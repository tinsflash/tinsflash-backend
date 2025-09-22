// services/chatService.js
import { askJean } from "./openai.js";

/**
 * Service pour discuter avec J.E.A.N.
 * @param {string} message
 * @returns {Promise<string>}
 */
async function chatWithJean(message) {
  try {
    if (!message || message.trim() === "") {
      return "⚠️ Merci de poser une question à J.E.A.N.";
    }

    const response = await askJean(message);

    if (!response || typeof response !== "string") {
      return "⚠️ J.E.A.N. n’a pas su répondre cette fois.";
    }

    return response;
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err.message);
    return "⚠️ JEAN n’est pas disponible actuellement.";
  }
}

export default { chatWithJean };
