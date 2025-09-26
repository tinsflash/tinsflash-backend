// services/aiService.js
import OpenAI from "openai";

// Client OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // clé API dans Render
});

/**
 * Chat IA réservé au moteur nucléaire météo + Admin
 * @param {string} message - Question complète
 * @param {object} context - Contexte optionnel
 */
export async function askAI(message, context = {}) {
  try {
    const zone = context.zone || "global";

    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant météo nucléaire TINSFLASH.
          - Réponds toujours en français clair et professionnel.
          - Utilise uniquement les données du moteur et comparateurs.
          - Ne jamais inventer si donnée manquante.
          - Contexte: zone=${zone}`,
        },
        { role: "user", content: message },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    return {
      success: true,
      reply: completion.choices[0].message.content.trim(),
    };
  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    return {
      success: false,
      reply: "⚠️ IA (GPT-5) indisponible pour le moment.",
    };
  }
}
