// services/chatService.js
import express from "express";
import { CohereClientV2 } from "cohere-ai";

const router = express.Router();

// Client Cohere connecté à la clé API (Render)
const cohere = new CohereClientV2({
  apiKey: process.env.COHERE_API_KEY,
});

// Route POST → /api/chat
router.post("/", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await cohere.chat({
      model: "command-a-03-2025", // modèle IA
      messages: [
        { role: "user", content: message }
      ],
    });

    // Extraction du texte de la réponse
    const reply = response.message.content[0].text;
    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat IA error:", err.message);
    res.status(500).json({ reply: "Erreur serveur IA." });
  }
});

export default router;
