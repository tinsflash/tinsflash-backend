// chatService.js
import cohere from "cohere-ai";

cohere.init(process.env.COHERE_API_KEY);

async function chatWithJean(message) {
  try {
    const response = await cohere.chat.create({
      model: "command-r-plus", // moteur avancé
      messages: [
        { role: "system", content: "Tu es J.E.A.N., mécanicien et expert météo de la Centrale Nucléaire Météo. Analyse toujours avec hyper précision et donne des réponses claires et exploitables." },
        { role: "user", content: message }
      ]
    });

    return { text: response.message?.content[0]?.text || "⚠️ Réponse vide de J.E.A.N." };
  } catch (err) {
    return { text: `❌ Erreur IA Cohere (chat API): ${err.message}` };
  }
}

export default { chatWithJean };
