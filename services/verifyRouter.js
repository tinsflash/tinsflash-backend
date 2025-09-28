// services/verifyRouter.js
import express from "express";
import { getEngineState } from "./engineState.js";
import { askAIEngine } from "./chatService.js"; // IA moteur

const router = express.Router();

// Route : état du moteur météo
router.get("/engine-state", async (req, res) => {
  try {
    const state = getEngineState();
    res.json({ success: true, state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route : chat IA moteur (console admin)
router.post("/chat/engine", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await askAIEngine(message || "");
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
