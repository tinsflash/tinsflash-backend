// services/chatService.js
import { askJean } from "./openai.js";

/**
 * Service qui relaie les questions de l’admin vers J.E.A.N.
 * @param {string} message - Question ou texte envoyé par l’admin
 * @returns {Promise<string>} - Réponse de J.E.A.N.
 */
async function askJeanService(message) {
  try {
    const response = await askJean(message);
    return response;
  } catch (err) {
    console.error("Erreur chatService:", err.message);
    return "⚠️ JEAN ne répond pas.";
  }
}

export default { askJean: askJeanService };
