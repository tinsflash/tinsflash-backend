// routes/admin.js
import express from "express";
import Forecast from "../models/Forecast.js";
import Alert from "../models/Alert.js";
import { getLogs } from "../services/logsService.js";

const router = express.Router();

// --- Stats ---
router.get("/stats", async (req, res) => {
  try {
    const forecasts = await Forecast.countDocuments();
    const alerts = await Alert.countDocuments();
    res.json({
      forecasts,
      alerts,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Logs ---
router.get("/logs", (req, res) => {
  res.json(getLogs());
});

// --- Users ---
router.get("/users", (req, res) => {
  res.json({
    covered: { free: 12, premium: 3, pro: 1, proPlus: 0 },
    nonCovered: { free: 4, premium: 1, pro: 0, proPlus: 0 },
  });
});

// --- Bulletins (BE, FR, LU modifiables) ---
router.get("/bulletins", async (req, res) => {
  try {
    const forecast = await Forecast.findOne().sort({ timestamp: -1 });
    res.json({
      belgium: forecast?.bulletinBelgium || "",
      france: forecast?.bulletinFrance || "",
      luxembourg: forecast?.bulletinLuxembourg || "",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulletins", async (req, res) => {
  try {
    const { belgium, france, luxembourg } = req.body;
    const forecast = await Forecast.findOne().sort({ timestamp: -1 });
    if (forecast) {
      forecast.bulletinBelgium = belgium;
      forecast.bulletinFrance = france;
      forecast.bulletinLuxembourg = luxembourg;
      await forecast.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
