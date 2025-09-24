// services/chatService.js
import express from "express";
import { CohereClientV2 } from "cohere-ai";

const router = express.Router();

// Initialisation Cohere
const cohere = new CohereClientV2({
  apiKey: process.env.COHERE_API_KEY,
});

// === Route POST /api/chat ===
router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ reply: "⚠️ Message vide" });
  }

  try {
    const response = await cohere.chat({
      model: "command-a-03-2025", // modèle mis à jour (septembre 2025)
      messages: [{ role: "user", content: message }],
    });

    let reply = "⚠️ Pas de réponse IA.";
    if (response.message?.content?.length > 0) {
      reply = response.message.content[0].text;
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat IA error:", err);
    res.status(500).json({ reply: "Erreur serveur IA." });
  }
});

// ✅ Export direct d’un Router Express
export default router;
