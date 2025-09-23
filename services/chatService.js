// services/chatService.js
import fetch from "node-fetch";
import { addLog } from "./logsService.js";

/**
 * 🤖 Chat avec J.E.A.N. (Gemini uniquement pour l’instant)
 */
async function chatWithJean(message) {
  try {
    // --- Gemini (Google AI Studio) ---
    addLog("⚡ Tentative réponse avec Gemini...");
    const gemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const geminiData = await gemini.json();
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      addLog("✅ Réponse obtenue via Gemini");
      return { engine: "Gemini", text: reply };
    }

    throw new Error("Pas de réponse valide de Gemini");
  } catch (err) {
    addLog("⚠️ Gemini indisponible: " + err.message);
    return {
      engine: "Fallback",
      text: "❌ J.E.A.N. est indisponible actuellement (Gemini off). Vérifiez la clé API.",
    };
  }
}

export default { chatWithJean };
