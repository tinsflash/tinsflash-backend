// services/aiService.js
import OpenAI from "openai";
import { CohereClient } from "cohere-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// ================================
// 🔮 Fonction principale de génération de réponse
// ================================
export async function generateAIResponse(prompt) {
  let lastErr = null;

  // 🔀 Liste des modèles testés par ordre de priorité
  const candidates = [
    "gpt-5",        // modèle principal
    "gpt-5-turbo",  // alias possible
    "gpt-4o",       // fallback
    "gpt-4o-mini"   // dernier recours OpenAI
  ];

  for (const model of candidates) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "Tu es le moteur IA météo nucléaire TINSFLASH, spécialisé en météorologie et en alertes précises."
          },
          { role: "user", content: prompt },
        ],
      });

      return {
        success: true,
        reply: response.choices[0].message.content,
        provider: "openai",
        model,
      };
    } catch (e) {
      console.error(`❌ Erreur modèle ${model}:`, e.response?.data || e.message || e);
      lastErr = e;
    }
  }

  // 🌐 Fallback Cohere si OpenAI échoue totalement
  try {
    const cohereResp = await cohere.chat({
      model: "command-r-plus",
      message: prompt,
    });

    return {
      success: true,
      reply: cohereResp.text,
      provider: "cohere",
      model: "command-r-plus",
    };
  } catch (e) {
    console.error("❌ Erreur Cohere:", e.message || e);
    lastErr = e;
  }

  // ❌ Rien n’a marché
  return {
    success: false,
    reply: "⚠️ IA indisponible pour le moment.",
    error: lastErr?.message || "Erreur inconnue",
  };
}
