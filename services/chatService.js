// services/chatService.js

async function askJean(message) {
  try {
    return {
      role: "assistant",
      reply: `🤖 JEAN dit : ${message} (explication météo simplifiée)`
    };
  } catch (err) {
    console.error("❌ ChatService error:", err.message);
    return { reply: "Erreur du service chat" };
  }
}

export default { askJean };
