// PATH: services/aiService.js
import OpenAI from "openai";
import { CohereClient } from "cohere-ai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cohere = process.env.COHERE_API_KEY
  ? new CohereClient({ token: process.env.COHERE_API_KEY })
  : null;

export async function askAI(message, context = {}) {
  const zone = context.zone || "global";
  const system =
    context.system ||
    "Tu es le moteur IA météo interne. Tu fusionnes les sorties modèles et facteurs (relief, climat, environnement) et rédiges des bulletins fiables, concis et actionnables.";

  // Essai OpenAI en cascade : gpt-5 -> gpt-4o -> gpt-4o-mini
  const candidates = ["gpt-5", "gpt-4o", "gpt-4o-mini"];
  let lastErr;

  for (const model of candidates) {
    try {
      const r = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${message}\n(zone: ${zone})` },
        ],
      });
      const text = r?.choices?.[0]?.message?.content?.trim();
      if (text) return { success: true, reply: text, provider: "openai", model };
    } catch (e) {
      lastErr = e;
    }
  }

  // Fallback ultime : Cohere (on le garde séparé pour les users, mais ici c’est un filet de sécurité)
  if (cohere) {
    try {
      const r = await cohere.chat({
        model: "command-r-plus",
        message: `${message} (zone: ${zone})`,
        temperature: 0.3,
      });
      return { success: true, reply: r.text || "", provider: "cohere", model: "command-r-plus" };
    } catch (e) {
      lastErr = e;
    }
  }

  console.error("❌ IA error:", lastErr?.message || lastErr);
  return { success: false, reply: "⚠️ IA (GPT) indisponible pour le moment." };
}
