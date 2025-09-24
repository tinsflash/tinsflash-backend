// services/chatService.js
import { CohereClientV2 } from "cohere-ai";

// ✅ Initialisation du client Cohere V2
const cohere = new CohereClientV2({
  apiKey: process.env.COHERE_API_KEY, // clé stockée dans Render
});

/**
 * 💬 Fonction principale de chat avec J.E.A.N.
 * Compatible avec server.js (import { chatWithJean } ...)
 */
export async function chatWithJean(message) {
  try {
    // Appel API Cohere V2
    const response = await cohere.chat({
      model: "command-a-03-2025", // dernier modèle dispo
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    // ✅ Extraction du texte de la réponse
    const reply = response.message?.content
      ?.map((c) => (c.type === "text" ? c.text : ""))
      .join("\n")
      .trim();

    return reply || "⚠️ Pas de réponse générée par J.E.A.N.";
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err);
    return "Erreur côté IA (Cohere non disponible).";
  }
}
