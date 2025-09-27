// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// === DB ===
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));
}

// === Services ===
import runGlobal from "./services/runGlobal.js";
import runContinental from "./services/runContinental.js";
import runSuperForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import { getLogs } from "./services/adminLogs.js";
import { getEngineState } from "./services/engineState.js";
import * as alertsService from "./services/alertsService.js"; // ⚡ import all

// === Routes ===
app.get("/", (req, res) =>
  res.json({ success: true, message: "🌍 Centrale Nucléaire Météo Backend en ligne" })
);

// Runs
app.post("/api/run-global", async (req, res) => {
  try {
    res.json({ success: true, result: await runGlobal() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.post("/api/run-continental", async (req, res) => {
  try {
    res.json({ success: true, result: await runContinental() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Forecasts
app.post("/api/superforecast", async (req, res) => {
  try {
    const { lat, lon, country } = req.body;
    res.json(await runSuperForecast({ lat, lon, country }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/forecast/:country", async (req, res) => {
  try {
    res.json(await forecastService.getForecast(req.params.country));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    if (alertsService.getActiveAlerts) {
      res.json({ success: true, alerts: await alertsService.getActiveAlerts() });
    } else {
      res.json({ success: true, alerts: [] });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.post("/api/alerts/:id/:action", async (req, res) => {
  try {
    if (alertsService.updateAlertStatus) {
      res.json({
        success: true,
        result: await alertsService.updateAlertStatus(req.params.id, req.params.action),
      });
    } else {
      res.json({ success: false, error: "updateAlertStatus non dispo" });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Radar
app.get("/api/radar/global", async (req, res) => {
  try {
    const fn = radarService.getGlobalRadar ?? radarService.radarHandler;
    res.json({ success: true, radar: await fn() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Podcasts
app.get("/api/podcast/:country", async (req, res) => {
  try {
    res.json({ success: true, podcast: await podcastService.generatePodcast(req.params.country) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const ask = chatService.askAI ?? chatService;
    res.json({ success: true, reply: await ask(message || "") });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Logs & State
app.get("/api/logs", (req, res) => res.json(getLogs()));
app.get("/api/engine-state", (req, res) => res.json(getEngineState()));

// Admin page
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"))
);

// === Start server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
