// services/chatService.js
import { askJean } from "./openai.js";

/**
 * Chat avec J.E.A.N.
 * @param {string} message
 * @returns {Promise<string>}
 */
async function chatWithJean(message) {
  if (!message || message.trim() === "") {
    return "⚠️ Message vide, essaye encore.";
  }
  return await askJean(message);
}

export default { chatWithJean };
