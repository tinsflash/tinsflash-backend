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
        model: "command-r-plus", // ✅ modèle gratuit + stable
        message: `Tu es J.E.A.N., le chef mécanicien de la centrale nucléaire météo mondiale.
Analyse les données météo et réponds clairement, de manière experte et précise.

Message utilisateur : ${message}`,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // ✅ Cas API /chat
    if (data.text) {
      return { text: data.text.trim() };
    }

    // ✅ Cas API /generate
    if (data.generations && data.generations.length > 0) {
      return { text: data.generations[0].text.trim() };
    }

    // ⚠️ Fallback si rien n’est trouvé
    return { text: "⚠️ Réponse inattendue de Cohere (aucun texte trouvé)." };
  } catch (err) {
    return { text: `❌ Erreur Cohere: ${err.message}` };
  }
}
