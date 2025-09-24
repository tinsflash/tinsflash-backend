// services/chatService.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

/**
 * Chat avec J.E.A.N. (IA experte météo/climat)
 */
export async function chatWithJean(message) {
  try {
    if (!message || message.trim().length === 0) {
      throw new Error("Message vide envoyé à J.E.A.N.");
    }

    await addLog(`💬 Question à J.E.A.N.: ${message}`);

    const res = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus-08-2024", // ✅ modèle stable
        messages: [
          {
            role: "system",
            content: `Tu es J.E.A.N., intelligence artificielle nucléaire météo.
            Tu analyses GFS, ECMWF, ICON, Meteomatics, NASA POWER, Copernicus ERA5.
            Tu donnes des réponses 100% réelles, jamais de test, jamais de démo.
            Style : précis, scientifique, pointu, utile pour experts, communes, agriculteurs, NASA.
            Tes réponses doivent donner des frissons aux météorologues.`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await res.json();

    // 🔎 LOG COMPLET DE LA RÉPONSE POUR DEBUG
    await addLog(`📡 Réponse brute Cohere: ${JSON.stringify(data)}`);

    // ✅ Essais multiples pour extraire le texte
    let reply =
      data?.text ||
      (data?.message && data.message.content && data.message.content[0]?.text) ||
      (data?.messages && data.messages[0]?.content?.[0]?.text) ||
      null;

    if (!reply) {
      reply = "⚠️ IA indisponible – vérifie clé Cohere ou quota";
    }

    await addLog(`🤖 Réponse J.E.A.N.: ${reply}`);
    return reply;
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err.message);
    await addLog("❌ Erreur chatWithJean: " + err.message);
    return "⚠️ Erreur IA J.E.A.N.";
  }
}

export default { chatWithJean };
