// routes/admin.js
import express from "express";
import { addLog, getLogs } from "../services/logsService.js";

const router = express.Router();

// -------------------------
// 🌍 Admin Routes
// -------------------------

// ✅ Statistiques système
router.get("/stats", (req, res) => {
  res.json({
    system: "OK",
    users: 2500, // TODO: à remplacer par un comptage User.countDocuments() si nécessaire
    activeAlerts: 12,
    podcasts: 56,
  });
});

// ✅ Logs en temps réel
router.get("/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération logs : " + error.message });
  }
});

// ✅ Validation d’alertes (70%–90%)
router.post("/validate-alert", (req, res) => {
  const { id, action } = req.body; // action = accept/refuse/escalate
  if (!id || !action) {
    return res.status(400).json({ error: "Paramètres manquants (id, action)" });
  }

  addLog(`⚠️ Alerte ${id} validée avec action: ${action}`);
  res.json({ success: true, id, action });
});

export default router;
