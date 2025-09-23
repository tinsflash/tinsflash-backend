// services/chatService.js
import fetch from "node-fetch";

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_API_URL = "https://api.cohere.ai/v1/chat";

export async function chatWithJean(message) {
  if (!COHERE_API_KEY) {
    return { text: "❌ Clé Cohere manquante. Vérifiez vos variables d'environnement." };
  }

  try {
    const response = await fetch(COHERE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus", // ✅ modèle le plus puissant en gratuit
        messages: [
          {
            role: "system",
            content:
              "Tu es J.E.A.N., chef mécanicien de la centrale nucléaire météo. \
              Expert météo, climat, mathématiques, ton rôle est d’analyser les \
              modèles météo et radars fusionnés pour générer des prévisions fiables, \
              détecter des anomalies et créer des alertes précises. \
              Tu dois toujours fournir une analyse détaillée et compréhensible.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.message && data.message.content) {
      return { text: data.message.content[0].text };
    }

    return { text: "⚠️ Réponse inattendue de Cohere.", raw: data };
  } catch (err) {
    return { text: "❌ Erreur lors de l’appel à Cohere: " + err.message };
  }
}
