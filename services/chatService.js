// services/chatService.js
import { askJean } from "./openai.js";

const chatService = {
  async chatWithJean(message) {
    try {
      if (!message || message.trim() === "") {
        throw new Error("Message vide envoyé à J.E.A.N.");
      }

      const reply = await askJean(message);
      return reply;
    } catch (err) {
      console.error("❌ Erreur chatService:", err.message);
      return "⚠️ J.E.A.N. n’est pas disponible actuellement.";
    }
  }
};

export default chatService;
