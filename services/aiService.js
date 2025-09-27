// services/aiService.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * IA cockpit reliée au moteur météo nucléaire
 * Jamais de ville / prévision publique
 * Toujours connecté aux étapes moteur
 */
export async function askAI(message, options = {}) {
  try {
    const context = options.context || "cockpit";

    if (context === "cockpit") {
      // IA spéciale Admin
      const completion = await openai.chat.completions.create({
        model: "gpt-5", // ⚡ Toujours ChatGPT-5
        messages: [
          {
            role: "system",
            content: `
              Tu es l'IA cockpit de la Centrale Nucléaire Météo TINSFLASH.
              Règles strictes :
              - Tu ne parles que du moteur météo (logs, erreurs, checkup, alertes, fiabilité).
              - Jamais de météo publique par ville, sauf comparaison si demandé.
              - Toujours en 100 % réel, connecté au moteur nucléaire météo.
              - Si une info est manquante, tu renvoies "donnée indisponible" plutôt qu'inventer.
              - Objectif : précision maximale, alerte avant tout le monde, frissons NASA.
            `,
          },
          { role: "user", content: message },
        ],
      });

      return {
        success: true,
        reply: completion.choices[0].message.content,
        provider: "openai",
        model: "gpt-5",
      };
    }

    // Sécurité : si jamais utilisé ailleurs
    return {
      success: false,
      reply: "Accès refusé (réservé à la console cockpit).",
    };
  } catch (err) {
    console.error("❌ Erreur IA cockpit:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}
