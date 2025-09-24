// services/chatService.js
import express from "express";
import { CohereClientV2 } from "cohere-ai";

const router = express.Router();

const cohere = new CohereClientV2({
  apiKey: process.env.COHERE_API_KEY, // clé API stockée dans Render
});

// POST /api/chat
router.post("/", async (req, res) => {
  const { message } = req.body;
  try {
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        { role: "user", content: message }
      ],
    });

    const reply = response.message.content[0].text;
    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat IA error:", err.message);
    res.status(500).json({ reply: "Erreur serveur IA." });
  }
});

export default router;
