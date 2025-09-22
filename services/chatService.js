// services/chatService.js
import openai from "./openai.js";

/**
 * Pose une question à J.E.A.N. (IA météo)
 */
async function askJean(message) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    // ✅ Retourne bien le contenu texte
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Erreur J.E.A.N.:", err.message);
    return "Erreur IA J.E.A.N.";
  }
}

export default { askJean };
