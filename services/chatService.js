// services/chatService.js
import express from "express";
import { CohereClientV2 } from "cohere-ai";

const router = express.Router();

// Initialisation client Cohere avec ta clé API Render
const cohere = new CohereClientV2({
  apiKey: process.env.COHERE_API_KEY,
});

// === Route POST /api/chat ===
// Permet d'envoyer une question et de recevoir une réponse IA
router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ reply: "⚠️ Message vide" });
  }

  try {
    const response = await cohere.chat({
      model: "command-a-03-2025", // modèle IA mis à jour septembre 2025
      messages: [
        { role: "user", content: message }
      ],
    });

    // La réponse est structurée → extraire le texte
    let reply = "⚠️ Pas de réponse IA.";
    if (
      response.message &&
      response.message.content &&
      response.message.content.length > 0
    ) {
      reply = response.message.content[0].text;
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat IA error:", err);
    res.status(500).json({ reply: "Erreur serveur IA." });
  }
});

export default router;
