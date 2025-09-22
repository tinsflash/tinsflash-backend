// -------------------------
// 🌍 Admin Routes
// -------------------------
import express from "express";
import Log from "../models/Log.js";
import Alert from "../models/Alert.js";
import User from "../models/User.js";
import superForecast from "../services/superForecast.js";

const router = express.Router();

// Exemple stats système
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

// -------------------------
// 📜 Logs en temps réel
// -------------------------
router.get("/logs", async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
  res.json(logs);
});

// ⚠️ Alertes générées
router.get("/alerts", async (req, res) => {
  const alerts = await Alert.find().sort({ timestamp: -1 }).limit(20);
  res.json(alerts);
});

// 👥 Utilisateurs par catégorie
router.get("/users/stats", async (req, res) => {
  const categories = await User.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  res.json(categories);
});

// 🚀 Lancer un SuperForecast
router.post("/superforecast/run", async (req, res) => {
  try {
    await superForecast.runFullForecast(50.85, 4.35); // Bruxelles par défaut
    res.json({ status: "OK" });
  } catch (err) {
    res.status(500).json({ status: "Erreur", message: err.message });
  }
});

export default router;
