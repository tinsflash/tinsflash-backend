// services/chatService.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

/**
 * Chat avec J.E.A.N. (IA météo nucléaire)
 */
async function chatWithJean(message) {
  try {
    const res = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus-08-2024", // ✅ modèle mis à jour
        messages: [
          { role: "system", content: "Tu es J.E.A.N., une IA experte météo et climatologue nucléaire. Donne des réponses précises, pointues et 100 % réelles." },
          { role: "user", content: message }
        ],
      }),
    });

    const data = await res.json();

    if (!data?.text && !data?.message?.content?.[0]?.text) {
      throw new Error("Réponse Cohere invalide: " + JSON.stringify(data));
    }

    const reply = data.text || data.message.content[0].text;

    await addLog("🤖 Réponse IA J.E.A.N.: " + reply);
    return reply;
  } catch (err) {
    console.error("❌ Erreur JEAN:", err.message);
    await addLog("❌ Erreur JEAN: " + err.message);
    return "Erreur IA: " + err.message;
  }
}

export default { chatWithJean };
