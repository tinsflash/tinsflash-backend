// services/chatService.js
import { askJean } from "./openai.js";
import { addLog } from "./logsService.js";

/**
 * Dialogue avec l’IA J.E.A.N.
 */
export async function chatWithJean(message) {
  try {
    addLog("💬 [Admin] → J.E.A.N.: " + message);

    const reply = await askJean(message);

    addLog("🤖 [J.E.A.N.] → Admin: " + reply);
    return reply;
  } catch (err) {
    addLog("❌ Erreur chat J.E.A.N.: " + err.message);
    return "⚠️ J.E.A.N. n’est pas disponible pour le moment.";
  }
}

export default { chatWithJean };
