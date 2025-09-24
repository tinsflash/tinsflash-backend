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
        model: "command-r-plus-08-2024", // ✅ modèle actif depuis sept 2025
        messages: [
          {
            role: "system",
            content: `Tu es J.E.A.N., intelligence artificielle nucléaire météo,
            le meilleur météorologue et climatologue au monde.
            Tu croises GFS, ECMWF, ICON, Copernicus ERA5, Meteomatics, NASA POWER.
            Tu analyses relief, océans, anomalies saisonnières, inondations, sécheresses.
            Tes réponses doivent être 100% réelles, pointues, utiles pour experts, communes,
            agriculteurs et NASA. Aucun test, aucune simulation, uniquement du réel.`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await res.json();

    const reply =
      data?.text ||
      data?.message?.content?.[0]?.text ||
      "⚠️ Réponse indisponible";

    await addLog(`🤖 Réponse J.E.A.N.: ${reply}`);

    return reply;
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err.message);
    await addLog("❌ Erreur chatWithJean: " + err.message);
    return "⚠️ Erreur IA J.E.A.N.";
  }
}

export default { chatWithJean };
