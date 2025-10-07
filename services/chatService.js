/* ===========================================================
   💬 Chat console admin – IA économique (GPT-4o mini)
   =========================================================== */
export async function askAIAdmin(message = "", mode = "moteur") {
  try {
    const SYSTEM_ADMIN = `
Tu es l'assistant IA "J.E.A.N. Console", propulsé par GPT-4o mini.
Ta mission : aider Patrick à interpréter les prévisions, les runs du moteur
et les alertes TINSFLASH, avec précision, rigueur et clarté.
Parle en français, ton professionnel mais humain.
Donne des explications simples, fiables et opérationnelles.
`;

    const prefix =
      mode === "meteo"
        ? "Analyse météo / climat demandée :"
        : "Demande liée au moteur ou à la console :";

    const prompt = `${prefix}\n${message}`;
    // 🔁 Passage automatique par openaiService.js
    const reply = await askOpenAI(SYSTEM_ADMIN, prompt, {
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 400,
    });

    return reply || "Réponse IA console indisponible.";
  } catch (err) {
    console.error("❌ askAIAdmin error:", err.message);
    return "Erreur IA admin (GPT-4o mini).";
  }
}
