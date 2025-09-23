// services/chatService.js
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // ⚡ ta clé est stockée dans Render
});

/**
 * Dialogue avec J.E.A.N. (mécanicien météo + expert climat)
 * @param {string} message - Question posée par l’admin ou envoyée lors d’un SuperForecast
 */
export async function chatWithJean(message) {
  try {
    if (!message || message.trim().length === 0) {
      return { text: "⚠️ Aucun message fourni à J.E.A.N." };
    }

    // Utilisation correcte de l’API Chat
    const response = await cohere.chat({
      model: "command-r-plus", // ⚡ modèle Cohere optimisé
      message: message,        // le message texte que tu envoies
    });

    // Cohere retourne le texte dans response.text
    if (response && response.text) {
      return { text: response.text };
    } else {
      return { text: "⚠️ Réponse inattendue de Cohere (aucun texte reçu)" };
    }
  } catch (error) {
    return {
      text: `❌ Erreur IA Cohere (chat API): ${error.message || error}`,
    };
  }
}
