// services/chatService.js
import fetch from "node-fetch";

export async function chatWithJean(message) {
  try {
    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `BEARER ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus", // modèle Cohere
        message: message,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // 🔎 Debug log complet pour comprendre la réponse de Cohere
    console.log("🛰️ Réponse brute Cohere:", JSON.stringify(data, null, 2));

    // Cas /chat → réponse classique
    if (data.text) {
      return { text: data.text.trim() };
    }

    // Cas /generate → générations multiples
    if (data.generations && data.generations.length > 0) {
      return { text: data.generations[0].text.trim() };
    }

    return { text: "⚠️ Réponse inattendue de Cohere (aucun texte trouvé)." };
  } catch (err) {
    return { text: `❌ Erreur Cohere: ${err.message}` };
  }
}
