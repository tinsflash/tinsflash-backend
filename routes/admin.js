// routes/admin.js
import express from "express";
import { runFullForecast } from "../services/superForecast.js";
import { getLogs } from "../services/logsService.js";
import { getAlerts } from "../services/alertsService.js";
import { askJean } from "../services/jeanService.js";

const router = express.Router();

// 🚀 Lancer un SuperForecast
router.post("/run", async (req, res) => {
  try {
    const { lat, lon } = req.body || { lat: 50.85, lon: 4.35 }; // par défaut Bruxelles
    const result = await runFullForecast(lat, lon);
    res.json({ success: true, message: "Run lancé avec succès", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lancement run", error: err.message });
  }
});

// 📜 Récupérer les logs
router.get("/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ success: false, message: "Impossible de charger les logs" });
  }
});

// ⚠️ Récupérer les alertes
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ success: false, message: "Impossible de charger les alertes" });
  }
});

// 🤖 Chat avec J.E.A.N.
router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await askJean(question);
    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ success: false, message: "JEAN n’est pas dispo", error: err.message });
  }
});

export default router;
