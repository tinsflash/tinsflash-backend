// services/chatService.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

const COHERE_API_KEY = process.env.COHERE_API_KEY;

async function chatWithJean(message) {
  try {
    if (!COHERE_API_KEY) {
      await addLog("❌ Clé Cohere manquante");
      return { reply: "⚠️ IA indisponible – clé API manquante.", debug: null };
    }

    if (!message || message.trim().length === 0) {
      await addLog("⚠️ Question vide envoyée à J.E.A.N.");
      return { reply: "⚠️ Merci de poser une question.", debug: null };
    }

    await addLog(`💬 Question à J.E.A.N.: ${message}`);

    const res = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-03-2025", // ✅ modèle valide
        messages: [
          { role: "system", content: "Tu es J.E.A.N., une IA météorologique nucléaire. Donne des prévisions ultra précises et scientifiques." },
          { role: "user", content: message }
        ],
      }),
    });

    const data = await res.json();
    await addLog(`📡 Réponse Cohere (brute): ${JSON.stringify(data)}`);

    let reply = "⚠️ IA indisponible – réponse vide.";

    // ✅ Analyse sécurisée du format de réponse
    if (data.message && Array.isArray(data.message.content)) {
      reply = data.message.content.map(p => p.text || "").join(" ");
    } else if (data.text) {
      reply = data.text;
    } else if (data.output_text) {
      reply = data.output_text;
    } else if (data.message && typeof data.message === "string") {
      reply = data.message;
    }

    await addLog(`🤖 Réponse J.E.A.N.: ${reply}`);
    return { reply, debug: data };

  } catch (err) {
    await addLog(`❌ Erreur JEAN: ${err.message}`);
    return { reply: "⚠️ IA indisponible – erreur serveur.", debug: null };
  }
}

export default { chatWithJean };
