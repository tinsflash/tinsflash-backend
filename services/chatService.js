import { CohereClient } from "cohere-ai";

// 🔑 Création du client Cohere
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // clé API stockée dans Render
});

async function chatWithJean(message) {
  try {
    const response = await cohere.generate({
      model: "command-xlarge-nightly", // modèle gratuit et puissant
      prompt: `Tu es J.E.A.N., l’IA de la Centrale Nucléaire Météo Mondiale.
Analyse ce message et génère une réponse ultra-précise sur la météo, prévisions et alertes.
Message: ${message}`,
      max_tokens: 200,
      temperature: 0.5,
    });

    if (
      response &&
      response.generations &&
      response.generations.length > 0
    ) {
      return { text: response.generations[0].text.trim() };
    } else {
      return { text: "⚠️ Réponse inattendue de Cohere (aucun texte trouvé)." };
    }
  } catch (err) {
    return { text: "❌ Erreur IA Cohere: " + err.message };
  }
}

export default { chatWithJean };
