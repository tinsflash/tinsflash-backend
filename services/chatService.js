// services/chatService.js
import fetch from "node-fetch";

const COHERE_API_KEY = process.env.COHERE_API_KEY;

export async function chatWithJean(message) {
  try {
    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus", // ✅ modèle cohérent avec ton projet
        message,
      }),
    });

    const data = await response.json();

    if (!data.text) {
      return { text: "⚠️ Réponse inattendue de Cohere", raw: data };
    }

    return { text: data.text, raw: data };
  } catch (err) {
    return { text: "❌ Erreur avec Cohere: " + err.message };
  }
}
