// -------------------------
// 🌍 Admin Routes
// -------------------------
import express from "express";
import superForecast from "../services/superForecast.js";
import { getLogs } from "../services/logsService.js";
import Forecast from "../models/Forecast.js";

const router = express.Router();

// ✅ Stats générales
router.get("/stats", async (req, res) => {
  try {
    const totalForecasts = await Forecast.countDocuments();
    const users = {
      free: 1500,
      premium: 600,
      pro: 300,
      elite: 100,
    };
    res.json({
      system: "OK",
      forecasts: totalForecasts,
      users,
      activeAlerts: 12,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Lancer un SuperForecast
router.post("/run-superforecast", async (req, res) => {
  try {
    const { lat = 50.85, lon = 4.35 } = req.body; // par défaut Bruxelles
    const result = await superForecast.runFullForecast(lat, lon);
    res.json({ success: true, message: "Run SuperForecast lancé ✅", result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Récupérer les logs
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Récupérer les alertes
router.get("/alerts", async (req, res) => {
  try {
    // Ici on prend les dernières prévisions stockées
    const forecasts = await Forecast.find().sort({ timestamp: -1 }).limit(5);
    const alerts = forecasts.map(f => ({
      id: f._id,
      condition: f.data?.condition || "N/A",
      temp: f.data?.temp || "N/A",
      anomaly: f.anomaly || false,
    }));
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Récupérer les utilisateurs
router.get("/users", (req, res) => {
  try {
    res.json({
      free: 1500,
      premium: 600,
      pro: 300,
      elite: 100,
      horsZone: 250,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Validation d’alertes (70%–90%)
router.post("/validate-alert", (req, res) => {
  const { id, action } = req.body; // action = accept/refuse/escalate
  res.json({ success: true, id, action });
});

export default router;
