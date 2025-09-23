// services/chatService.js
import fetch from "node-fetch";

export async function chatWithJean(message) {
  try {
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        Authorization: `BEARER ${process.env.COHERE_API_KEY}`, // ✅ clé Render
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command", // ✅ modèle gratuit de Cohere
        prompt: `Tu es J.E.A.N., chef mécanicien de la centrale nucléaire météo mondiale.
Analyse les données météo et réponds clairement, de manière experte et précise.

Message utilisateur : ${message}`,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // ✅ Extraction correcte du texte
    if (data.generations && data.generations.length > 0) {
      return { text: data.generations[0].text.trim() };
    } else {
      return { text: "⚠️ Réponse inattendue de Cohere." };
    }
  } catch (err) {
    return { text: `❌ Erreur Cohere: ${err.message}` };
  }
}
