// services/cohereService.js
// 🎯 IA Cohere dédiée à J.E.A.N. (Index public uniquement)

import fetch from "node-fetch";

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_URL = "https://api.cohere.ai/v1/chat";

export async function askCohere(question, category = "grand public") {
  try {
    if (!COHERE_API_KEY) {
      throw new Error("❌ COHERE_API_KEY manquant dans .env");
    }

    const response = await fetch(COHERE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus", // ⚡ modèle Cohere dernière génération
        messages: [
          { role: "system", content: "Tu es J.E.A.N., conseiller météo grand public, précis et clair." },
          { role: "user", content: `Catégorie: ${category}\nQuestion: ${question}` }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status} ${data.message || response.statusText}`);
    }

    // ✅ Nouveau format Cohere
    const reply = data?.message?.content?.[0]?.text;
    return reply || "❌ Pas de réponse de J.E.A.N.";
  } catch (err) {
    console.error("⚠️ Cohere error:", err.message);
    return `Erreur J.E.A.N.: ${err.message}`;
  }
}
