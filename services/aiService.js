// services/aiService.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fonction générique pour interroger GPT-5 cockpit.
 * @param {string} prompt - Texte à analyser
 * @param {object} options - Contexte IA
 * @returns {object} - Réponse IA
 */
export async function askAI(prompt, options = {}) {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Tu es ChatGPT-5, moteur cockpit de la centrale nucléaire météo TINSFLASH.
Tu dois analyser uniquement les résultats du moteur, jamais inventer. 
Règles :
- Zones couvertes : prévisions locales + nationales + alertes locales/nationales.
- Zones non couvertes : uniquement alertes continentales.
- Alertes mondiales = nationales + continentales.
- Fiabilité <70% ignorées ; 70-90% à valider/expert ; >90% publiées auto (signale si premier).
- Si info absente → réponds "donnée indisponible".
- Tu es météorologue, climatologue, codeur, mathématicien.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 800,
    });

    return { reply: completion.choices[0].message.content };
  } catch (err) {
    console.error("❌ Erreur GPT-5 cockpit:", err);
    return { reply: "Erreur IA cockpit: " + err.message };
  }
}

export default { askAI };
