// services/chatService.js
import { askJean } from "./openai.js";

/**
 * Service de discussion avec J.E.A.N.
 * @param {string} message - Le message envoyé par l’utilisateur
 * @returns {Promise<string>} - Réponse de J.E.A.N.
 */
export async function chatWithJean(message) {
  try {
    if (!message || message.trim().length === 0) {
      return "⚠️ Message vide. Merci de poser une question à J.E.A.N.";
    }

    // Appel de l’IA via openai.js
    const response = await askJean(message);

    return response || "⚠️ JEAN n’a pas de réponse pour le moment.";
  } catch (error) {
    console.error("Erreur dans chatService:", error.message);
    return "❌ Erreur interne J.E.A.N. : " + error.message;
  }
}

export default { chatWithJean };
