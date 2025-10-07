// ==========================================================
// 💬 TINSFLASH – IA J.E.A.N. Chat Service
// 🔄 Remplace Cohere par OpenAI GPT-4o-mini (console & utilisateurs)
// ==========================================================

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ⚠️ à placer dans ton .env
});

// ==========================================================
// 🚀 Fonction principale
// ==========================================================
export async function askCohere(question, category = "grand public") {
  try {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("❌ OPENAI_API_KEY manquant dans .env");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // ⚡ modèle ultra-rapide, économique et intelligent
      messages: [
        {
          role: "system",
          content:
            "Tu es J.E.A.N., assistant météorologique TINSFLASH. Réponds avec précision, clarté et un ton humain.",
        },
        {
          role: "user",
          content: `Catégorie: ${category}\nQuestion: ${question}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "❌ Aucune réponse disponible pour le moment.";

    // 🔎 Détection d'avatar selon le ton de la réponse
    let avatar = "default";
    const lower = reply.toLowerCase();
    if (/soleil|sun|clair|beau/.test(lower)) avatar = "sun";
    else if (/pluie|rain/.test(lower)) avatar = "rain";
    else if (/neige|snow/.test(lower)) avatar = "snow";
    else if (/orage|storm|tonnerre/.test(lower)) avatar = "storm";
    else if (/alerte|danger|warning/.test(lower)) avatar = "alert";

    return { reply, avatar };
  } catch (err) {
    console.error("⚠️ Erreur GPT-4o-mini:", err.message);
    return {
      reply: `Erreur J.E.A.N.: ${err.message}`,
      avatar: "default",
    };
  }
}
