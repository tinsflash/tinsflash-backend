// PATH: services/chatService.js
// Chat IA pour /api/chat
import { askAI } from "./aiService.js";

export async function chatWithJean(message) {
  const safeMsg = (message ?? "").toString().trim();
  if (!safeMsg) return { reply: "Pose une question météo précise." };

  const reply = await askAI(safeMsg);
  return { reply };
}
