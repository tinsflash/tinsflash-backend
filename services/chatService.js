/* ===========================================================
   💬 Chat console admin – IA économique (GPT-4o-mini)
   =========================================================== */
export async function askAIAdmin(message = "", mode = "moteur") {
  try {
    const SYSTEM_ADMIN = `
Tu es "J.E.A.N. Console", propulsé par GPT-4o-mini.
Ton rôle : aider Patrick et Michael à interpréter les prévisions,
les runs du moteur et les alertes météo TINSFLASH.
Parle en français, ton professionnel mais humain.
Donne des explications simples, fiables et opérationnelles.
Affiche toujours le modèle utilisé au début de ta réponse :
(par ex. "🧠 Modèle : GPT-4o-mini").
`;

    const prefix =
      mode === "meteo"
        ? "Analyse météo / climat demandée :"
        : "Demande liée au moteur ou à la console :";

    const prompt = `${prefix}\n${message}`;
    const reply = await askOpenAI(SYSTEM_ADMIN, prompt, {
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 400,
    });

    // 🔁 injection du tag modèle si l'IA l'oublie
    const taggedReply = reply.startsWith("🧠")
      ? reply
      : `🧠 Modèle : GPT-4o-mini\n\n${reply}`;

    return taggedReply;
  } catch (err) {
    console.error("❌ askAIAdmin error:", err.message);
    return "Erreur IA admin (GPT-4o-mini).";
  }
}
