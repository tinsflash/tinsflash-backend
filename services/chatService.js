// src/services/chatService.js
import cohere from "cohere-ai";

cohere.init(process.env.COHERE_API_KEY); // 🔑 ta clé est déjà dans Render

async function chatWithJean(message) {
  try {
    const response = await cohere.generate({
      model: "command-xlarge-nightly", // ✅ modèle IA cohérent & gratuit
      prompt: `Tu es J.E.A.N., le moteur IA de la Centrale Nucléaire Météo Mondiale, tu es le plus grand expert météorologueet climatologuedu monde,.
Analyse ce message utilisateur et produis une réponse précise, fiable, en rapport avec la météo, prévisions et alertes.
Message: ${message}`,
      max_tokens: 200,
      temperature: 0.5
    });

    if (
      response &&
      response.body &&
      response.body.generations &&
      response.body.generations.length > 0
    ) {
      return { text: response.body.generations[0].text.trim() };
    } else {
      return { text: "⚠️ Réponse inattendue de Cohere (aucun texte généré)." };
    }
  } catch (err) {
    return { text: "❌ Erreur IA Cohere: " + err.message };
  }
}

export default { chatWithJean };
