// services/textGenService.js
import { askAI } from "./chatService.js";

/**
 * Génération de texte via ChatGPT5 (utilisé dans la console admin)
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateText(prompt) {
  try {
    const reply = await askAI(prompt);
    return reply || "⚠️ Pas de réponse de l'IA";
  } catch (err) {
    console.error("❌ generateText error:", err.message);
    return `Erreur IA: ${err.message}`;
  }
}
