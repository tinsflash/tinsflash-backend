// services/chatService.js
import OpenAI from "openai";
import dotenv from "dotenv";
import { addLog } from "./logsService.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Dialogue direct avec J.E.A.N. (IA chef mécanicien météo)
 * - Répond aux questions admin dans la console
 * - Explique les runs, alertes, anomalies
 */
export async function chatWithJean(message) {
  try {
    addLog("💬 Question posée à J.E.A.N.: " + message);

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "Tu es J.E.A.N., chef mécanicien de la centrale nucléaire météo mondiale. "
            + "Tu es expert en météorologie, climatologie et mathématiques. "
            + "Tu réponds toujours de façon précise, claire, fiable et scientifique. "
            + "Tu expliques l’analyse des modèles météo, la détection d’anomalies et la génération d’alertes. "
            + "Tu aides l’administrateur à comprendre et piloter le moteur météo.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const reply = response.choices[0].message.content.trim();
    addLog("🤖 Réponse J.E.A.N.: " + reply);

    return reply;
  } catch (err) {
    addLog("❌ Erreur chatWithJean: " + err.message);
    return "⚠️ JEAN n’est pas disponible pour le moment.";
  }
}

export default { chatWithJean };
