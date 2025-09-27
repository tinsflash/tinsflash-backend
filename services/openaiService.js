// services/openaiService.js
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ⚠️ clé à mettre dans Render (ENV VAR)
});

/**
 * Fonction générique pour poser une question à GPT-5
 * @param {string} prompt - Le texte envoyé à GPT
 * @returns {string} Réponse texte de GPT-5
 */
export async function askOpenAI(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-5", // 👉 forcer GPT-5
      messages: [
        {
          role: "system",
          content: `Tu es ChatGPT-5, expert en météorologie, climatologie, mathématiques et codage.
Tu travailles pour la centrale nucléaire météo TINSFLASH.
Toujours répondre de manière professionnelle, fiable, connectée au moteur.
Jamais de test, jamais de simulation : uniquement du 100% réel.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2, // maximum précision, pas de créativité inutile
      max_tokens: 800,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Erreur OpenAI API:", err.message);
    return `❌ Erreur OpenAI: ${err.message}`;
  }
}
