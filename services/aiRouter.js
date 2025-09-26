// services/aiRouter.js
import express from "express";
import { askOpenAI } from "./openaiService.js";
import { askAI as askCohere } from "./aiService.js";

const router = express.Router();

/**
 * POST /api/chat
 * Body: { message, zone, engine }
 *
 * - engine = "openai" → GPT-4o/5 (admin, moteur)
 * - engine = "cohere" → Cohere (utilisateurs)
 * - par défaut → Cohere
 */
router.post("/", async (req, res) => {
  try {
    const { message, zone, engine } = req.body;

    let result;

    if (engine === "openai") {
      result = await askOpenAI(message, { zone });
    } else {
      result = await askCohere(message, { zone });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Erreur moteur IA" });
  }
});

export default router;
