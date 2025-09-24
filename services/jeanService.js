// services/jeanService.js
import coherePkg from "cohere-ai";
import { addLog } from "./logsService.js";

const { CohereClient } = coherePkg;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
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

    const response = await cohere.chat({
      model: "command-r-plus",
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
        { role: "user", content: question },
      ],
    });

    let answer = "";
    if (response.text) {
      answer = response.text;
    } else if (response.message?.content?.[0]?.text) {
      answer = response.message.content[0].text;
    } else {
      answer = "⚠️ Réponse IA vide ou non reconnue.";
    }

    addLog(`🤖 JEAN a répondu: ${answer}`);
    return answer;
  } catch (err) {
    console.error("❌ Erreur IA JEAN :", err.message);
    return "⚠️ JEAN indisponible pour le moment.";
  }
}
