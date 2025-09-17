// -------------------------
// 🌍 Admin Routes
// -------------------------
import express from "express";
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

export default router;
