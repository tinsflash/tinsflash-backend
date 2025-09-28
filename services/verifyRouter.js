// services/verifyRouter.js
import express from "express";
import { verifyToken } from "../utils/tokenUtils.js"; // si tu utilises déjà une vérification JWT
import { getEngineState } from "./engineState.js";
import { askAIEngine } from "./chatService.js"; // IA moteur déjà dispo ici

const router = express.Router();

// Vérification de token (accès sécurisé à la console admin)
router.use((req, res, next) => {
  try {
    const token = req.headers["authorization"];
    if (!token || !verifyToken(token)) {
      return res.status(403).json({ success: false, error: "Accès refusé" });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
