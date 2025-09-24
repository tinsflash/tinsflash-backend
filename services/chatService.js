// services/chatService.js
// 👉 Appelle l’API REST Cohere directement (pas le SDK) pour éviter
// les incompatibilités de version et l’erreur “Missing required key 'message'”.

import { addLog } from "./logsService.js";

const COHERE_URL = "https://api.cohere.ai/v1/chat";
const COHERE_KEY = process.env.COHERE_API_KEY;

export async function chatWithJean(message) {
  try {
    if (!COHERE_KEY) {
      throw new Error("COHERE_API_KEY manquant dans l'environnement");
    }
    if (!message || typeof message !== "string") {
      throw new Error("Message vide");
    }

    const body = {
      model: "command-r-plus",
      // ⚠️ Cohere attend 'message' (singulier), pas 'messages'
      message,
      temperature: 0.2,
    };

    const res = await fetch(COHERE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COHERE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`Cohere HTTP ${res.status} – ${errTxt}`);
    }

    const data = await res.json();
    // Réponses possibles : data.text (le plus courant) ou data.message?.content
    const answer =
      data?.text ||
      data?.message?.content?.[0]?.text ||
      "⚠️ Réponse IA vide";

    await addLog(`🤖 JEAN: ${answer}`);
    return answer;
  } catch (err) {
    await addLog(`❌ Erreur JEAN: ${err.message}`);
    throw err;
  }
}

export default { chatWithJean };
