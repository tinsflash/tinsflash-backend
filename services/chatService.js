// services/chatService.js
import { askJean } from "./openai.js";
import { addLog } from "./logsService.js";

/**
 * Dialogue avec l’IA J.E.A.N.
 * @param {string} message - Question posée
 * @returns {Promise<string>} Réponse de l’IA
 */
export async function chatWithJean(message) {
  try {
    addLog("💬 Question envoyée à J.E.A.N.: " + message);
    const reply = await askJean(message);
    addLog("🤖 Réponse J.E.A.N.: " + reply);
    return reply;
  } catch (err) {
    addLog("❌ Erreur chat J.E.A.N.: " + err.message);
    throw err;
  }
}
