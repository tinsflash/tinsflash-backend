import { CohereClient } from "cohere-ai";

// 🔑 Création du client Cohere
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // clé API stockée dans Render
});

async function chatWithJean(message) {
  try {
    const response = await cohere.chat({
      model: "command-r-plus", // modèle chat recommandé par Cohere
      messages: [
        {
          role: "system",
          content:
            "Tu es J.E.A.N., le chef mécanicien de la Centrale Nucléaire Météo Mondiale. " +
            "Tu analyses les modèles météo fusionnés et génères des prévisions pointues, fiables et précises, " +
            "ainsi que des alertes critiques pour la sécurité humaine, animale et matérielle.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    if (response && response.message && response.message.content.length > 0) {
      return { text: response.message.content[0].text.trim() };
    } else {
      return { text: "⚠️ Réponse inattendue de Cohere (aucun texte trouvé)." };
    }
  } catch (err) {
    return { text: "❌ Erreur IA Cohere (chat API): " + err.message };
  }
}

export default { chatWithJean };
