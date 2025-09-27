// services/chatService.js
import express from "express";
import { askAI } from "./aiService.js";

const router = express.Router();

/**
 * Chat IA — Console Admin uniquement
 * ⚡ Relié au moteur nucléaire météo
 */
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    // 🔒 Toujours en mode cockpit (pas d’utilisateur public ici)
    const reply = await askAI(message, { context: "cockpit" });

    res.json({ reply });
  } catch (err) {
    console.error("❌ Erreur Chat IA cockpit:", err);
    res.status(500).json({ error: "Erreur serveur Chat IA cockpit" });
  }
});

export default router;
