// services/aiService.js
import cohere from "cohere-ai";

cohere.init(process.env.COHERE_API_KEY);

export async function askAI(message, context = {}) {
  try {
    const zone = context.zone || "global";

    const response = await cohere.chat({
      model: "command-r-plus",
      message: `${message} (zone: ${zone})`,
      temperature: 0.5,
    });

    return {
      success: true,
      reply: response.text || "Réponse vide de l'IA",
    };
  } catch (err) {
    console.error("❌ IA error:", err.message);
    return {
      success: false,
      reply: "⚠️ IA (Cohere) indisponible, réessayez plus tard.",
    };
  }
}
