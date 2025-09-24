// services/chatService.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

const COHERE_API_KEY = process.env.COHERE_API_KEY;

async function chatWithJean(message) {
  try {
    if (!COHERE_API_KEY) {
      await addLog("❌ Clé Cohere manquante");
      return "⚠️ IA indisponible – clé API manquante.";
    }

    await addLog(`💬 Question à J.E.A.N.: ${message}`);

    const res = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-03-2025",   // ✅ modèle actuel disponible
        messages: [
          {
            role: "system",
            content:
              "Tu es J.E.A.N., l'assistant météorologique nucléaire. Réponds de manière scientifique, précise et concise.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await res.json();

    // Log brut de la réponse pour debug
    await addLog(`📡 Réponse Cohere (brute): ${JSON.stringify(data)}`);

    if (data.message) {
      const reply = data.message.content
        .map((part) => part.text)
        .join(" ");
      await addLog(`🤖 Réponse J.E.A.N.: ${reply}`);
      return reply;
    } else if (data.text) {
      // fallback si Cohere renvoie directement un champ text
      await addLog(`🤖 Réponse J.E.A.N.: ${data.text}`);
      return data.text;
    } else {
      await addLog("⚠️ Réponse vide de Cohere");
      return "⚠️ IA indisponible – réponse vide.";
    }
  } catch (err) {
    await addLog(`❌ Erreur JEAN: ${err.message}`);
    return "⚠️ IA indisponible – erreur serveur.";
  }
}

export default { chatWithJean };
