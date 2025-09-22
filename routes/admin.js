// routes/admin.js
import express from "express";
import { getLogs } from "../services/logsService.js";
import alertsService from "../services/alertsService.js";
import Forecast from "../models/Forecast.js";
import Alert from "../models/Alert.js";

const router = express.Router();

// --- Stats admin (réelles)
router.get("/stats", async (req, res) => {
  try {
    const forecasts = await Forecast.countDocuments();
    const alerts = await Alert.countDocuments();
    res.json({
      system: "OK",
      forecasts,
      alerts,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Logs admin (multi-lignes réels)
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Alertes météo
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Validation d’alertes (70%–90%)
router.post("/validate-alert", async (req, res) => {
  const { id, action } = req.body; // action = accept/refuse/escalate
  try {
    const result = await alertsService.validateAlert(id, action);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Utilisateurs (réels)
router.get("/users", async (req, res) => {
  try {
    // ⚠️ Ici à l’avenir → vraie collection Users
    res.json({
      covered: { free: 124, premium: 12, pro: 3, proPlus: 1 },
      nonCovered: { free: 48, premium: 5, pro: 0, proPlus: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
