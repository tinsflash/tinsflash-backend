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
// 🔮 Fonction principale IA
// ================================
export async function generateAIResponse(prompt, context = "forecast") {
  let systemPrompt;

  if (context === "forecast") {
    systemPrompt =
      "Tu es le moteur IA météo nucléaire TINSFLASH. " +
      "Tu donnes uniquement des prévisions météo locales, nationales et globales, " +
      "issues des modèles croisés (GFS, ECMWF, ICON, etc.), du relief, satellites, facteurs environnementaux. " +
      "Sois ultra précis, concis, fiable et factuel. Ne parle pas du moteur interne.";
  } else if (context === "admin") {
    systemPrompt =
      "Tu es l’assistant IA de la centrale nucléaire météo TINSFLASH. " +
      "Tu expliques uniquement l’état du moteur, les logs, les erreurs, la couverture, la fiabilité des alertes. " +
      "Ne parle jamais de ville ou de localisation météo sauf si on te le demande explicitement. " +
      "Agis comme un technicien du réacteur nucléaire météo.";
  } else {
    systemPrompt =
      "Tu es le moteur IA météo nucléaire TINSFLASH. Reste précis et factuel.";
  }

  let lastErr = null;

  // 🔀 Liste des modèles OpenAI par ordre de priorité
  const candidates = ["gpt-5", "gpt-5-turbo", "gpt-4o", "gpt-4o-mini"];

  for (const model of candidates) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
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

// 🔁 Alias rétro-compatible
export const askAI = generateAIResponse;
