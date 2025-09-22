// services/chatService.js
import OpenAI from "openai";
import dotenv from "dotenv";
import { addLog } from "./logsService.js";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Dialogue avec J.E.A.N. – Chef mécano météo nucléaire
 * Analyse runs, alertes et modèles météo en temps réel
 */
export async function chatWithJean(message) {
  try {
    addLog("💬 Question envoyée à J.E.A.N.: " + message);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // GPT-5 optimisé
      messages: [
        {
          role: "system",
          content: `Tu es J.E.A.N., chef mécanicien de la Centrale Nucléaire Météo.
Tu es expert en météorologie, climatologie, mathématiques et physique.
Ta mission : analyser les runs météo, expliquer les alertes, comparer nos prévisions aux autres modèles,
et répondre de façon claire, précise, fiable et pédagogique.`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 600,
      temperature: 0.3,
    });

    const reply = response.choices[0].message.content;
    addLog("🤖 Réponse J.E.A.N.: " + reply);
    return reply;
  } catch (err) {
    addLog("❌ Erreur chat J.E.A.N.: " + err.message);
    return "⚠️ JEAN n’est pas disponible pour le moment.";
  }
}

export default { chatWithJean };
