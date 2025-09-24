// services/chatService.js
import express from "express";
import { CohereClientV2 } from "cohere-ai";

const router = express.Router();

// ================================
// 🤖 Client Cohere IA
// ================================
const cohere = new CohereClientV2({
  apiKey: process.env.COHERE_API_KEY,
});

// ================================
// 💬 Route Chat IA
// ================================
router.post("/", async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: "⚠️ Message vide" });
  }

  try {
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [{ role: "user", content: message }],
    });

    const reply =
      response?.message?.content?.[0]?.text ??
      "⚠️ Pas de réponse de l'IA.";

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat IA error:", err?.response?.data || err.message || err);
    res.status(500).json({ reply: "Erreur serveur IA." });
  }
});

export default router;
