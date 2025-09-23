// services/chatService.js
import fetch from "node-fetch";

export async function chatWithJean(message) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("❌ Clé GEMINI_API_KEY manquante dans .env");
    }

    // URL officielle Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    // Préparer la requête
    const body = {
      contents: [
        {
          parts: [{ text: typeof message === "string" ? message : JSON.stringify(message) }],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Gestion des erreurs
    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${JSON.stringify(data)}`);
    }

    // Extraire le texte de la réponse Gemini
    const output =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Aucune réponse générée par Gemini";

    return { text: output };
  } catch (err) {
    return { text: "❌ Erreur Gemini: " + err.message };
  }
}
