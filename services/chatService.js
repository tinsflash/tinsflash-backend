// services/chatService.js
// Service pour dialoguer avec l'IA (ChatGPT5 réservé console/moteur)

async function askAI(message) {
  try {
    // Ici on simulera la réponse IA avec un objet structuré
    // (tu pourras brancher ton connecteur GPT-5 ensuite)
    return {
      result: "Diagnostic effectué",
      input: message,
      checks: {
        moteur: "OK",
        ia: "OK",
        server: "OK",
        previsions: "OK"
      },
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { error: err.message };
  }
}

export default { askAI };
