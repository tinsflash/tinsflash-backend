// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import runGlobal from "./services/runGlobal.js";
import runContinental from "./services/runContinental.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import { getLogs } from "./services/adminLogs.js";
import { getEngineState } from "./services/engineState.js";
import { getActiveAlerts, updateAlertStatus } from "./services/alertsService.js";

// === DB Models (⚠️ SEUL Forecast est utile maintenant) ===
import Forecast from "./models/Forecast.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// 📡 API ROUTES
// ==============================

// Test API
app.get("/", (req, res) => {
  res.json({ success: true, message: "🌍 Centrale Nucléaire Météo Backend en ligne" });
});

// Run Global Forecasts
app.post("/api/run-global", async (req, res) => {
  try {
    const result = await runGlobal();
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Run Continental Forecasts (zones non couvertes)
app.post("/api/run-continental", async (req, res) => {
  try {
    const result = await runContinental();
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get Logs
app.get("/api/logs", (req, res) => {
  res.json({ success: true, logs: getLogs() });
});

// Get Engine State
app.get("/api/engine-state", (req, res) => {
  res.json({ success: true, state: getEngineState() });
});

// Alerts - Get Active
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getActiveAlerts();
    res.json({ success: true, alerts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Alerts - Update Status (validate / expert / wait / ignore)
app.post("/api/alerts/:id/:action", (req, res) => {
  try {
    const { id, action } = req.params;
    const result = updateAlertStatus(id, action);
    if (!result.ok) return res.status(404).json(result);
    res.json({ success: true, buckets: result.buckets });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Radar
app.get("/api/radar/global", async (req, res) => {
  try {
    const radar = await radarService.getGlobalRadar();
    res.json({ success: true, radar });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Podcasts
app.get("/api/podcast/:country", async (req, res) => {
  try {
    const { country } = req.params;
    const podcast = await podcastService.generatePodcast(country);
    res.json({ success: true, podcast });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Chat with AI (admin only)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatService.askAI(message);
    res.json({ success: true, response });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==============================
// 🚀 Server Start
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
