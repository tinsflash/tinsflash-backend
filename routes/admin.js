// routes/admin.js
import express from "express";
import { askJean } from "../services/jeanService.js";

const router = express.Router();

// Exemple console admin
router.get("/stats", (req, res) => {
  res.json({
    system: "OK",
    users: 2500,
    activeAlerts: 12,
    podcasts: 56,
  });
});

// Validation d’alertes (70%–90%)
router.post("/validate-alert", (req, res) => {
  const { id, action } = req.body; // action = accept/refuse/escalate
  res.json({ success: true, id, action });
});

// Chat avec J.E.A.N.
router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "❌ Question manquante" });

    const answer = await askJean(question);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "❌ Erreur JEAN", details: err.message });
  }
});

export default router;
