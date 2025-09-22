// services/jeanService.js
import OpenAI from "openai";
import { addLog } from "./logsService.js";

// ⚠️ Stocke ta clé API dans les variables d’environnement Render
// Settings > Environment > Add environment variable
// KEY = OPENAI_API_KEY, VALUE = ta clé
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * J.E.A.N. – Chef mécanicien de la Centrale Nucléaire Météo
 * - Analyse météo, climat, math, physique
 * - Répond aux questions de l’admin console
 * - Justifie ses réponses avec des données claires
 */
export async function askJean(question) {
  try {
    addLog(`🤖 JEAN consulté: ${question}`);

    const response = await client.chat.completions.create({
      model: "gpt-5", // GPT-5 en prod
      messages: [
        {
          role: "system",
          content: `
Tu es J.E.A.N., chef mécanicien et expert météo de la Centrale Nucléaire Tinsflash.
Règles :
- Toujours répondre 100% réel, basé sur les données météo et climat disponibles.
- Donner des explications claires et scientifiques (math, physique, climat).
- Tu es l’assistant ultime pour anticiper les phénomènes dangereux.
- Compare si besoin avec les modèles GFS, ECMWF, ICON, Copernicus ERA5, NASA POWER, Wetterzentrale, Trullemans.
- Si l’admin demande pourquoi une prévision diffère des autres → explique la différence.
- Si l’admin demande d’analyser une alerte → répond par un degré de certitude + justification scientifique.
- Pas de démo, pas de test, pas de simulation → toujours 100% opérationnel et pointu.
        `,
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.2, // haute précision
      max_tokens: 500,
    });

    const answer = response.choices[0].message.content.trim();
    addLog(`🤖 JEAN a répondu: ${answer}`);

    return answer;
  } catch (err) {
    addLog("❌ Erreur JEAN: " + err.message);
    throw err;
  }
}
