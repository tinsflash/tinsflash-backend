// services/openaiService.js
import { openai } from "./openai.js";

export async function askOpenAI(message, context = {}) {
  try {
    const zone = context.zone || "global";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // tu peux changer pour "gpt-4o-mini" si tu veux réduire le coût
      messages: [
        { role: "system", content: "Tu es un assistant météorologique expert." },
        { role: "user", content: `${message} (zone: ${zone})` },
      ],
      temperature: 0.4,
    });

    const reply =
      completion.choices?.[0]?.message?.content || "Réponse vide de GPT";

    return { success: true, reply };
  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    return {
      success: false,
      reply: "⚠️ Service IA (OpenAI) indisponible, réessayez plus tard.",
    };
  }
}
