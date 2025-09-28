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

// === Services (imports globaux) ===
import * as runGlobal from "./services/runGlobal.js";
import * as runContinental from "./services/runContinental.js";
import * as superForecast from "./services/superForecast.js";
import * as forecastService from "./services/forecastService.js";
import * as radarService from "./services/radarService.js";
import * as podcastService from "./services/podcastService.js";
import * as chatService from "./services/chatService.js";
import * as logsService from "./services/adminLogs.js";
import * as engineStateService from "./services/engineState.js";
import * as alertsService from "./services/alertsService.js";

// Helper safeCall
const safeCall = async (fn, ...args) =>
  typeof fn === "function" ? await fn(...args) : null;

// === Routes ===
app.get("/", (req, res) =>
  res.json({ success: true, message: "🌍 Centrale Nucléaire Météo Backend en ligne" })
);

// Runs
app.post("/api/run-global", async (req, res) => {
  try {
    res.json({ success: true, result: await safeCall(runGlobal.default ?? runGlobal.runGlobal) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/run-continental", async (req, res) => {
  try {
    res.json({
      success: true,
      result: await safeCall(runContinental.default ?? runContinental.runContinental),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Forecasts
app.post("/api/superforecast", async (req, res) => {
  try {
    const { lat, lon, country } = req.body;
    res.json(
      await safeCall(superForecast.default ?? superForecast.runSuperForecast, {
        lat,
        lon,
        country,
      })
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/forecast/:country", async (req, res) => {
  try {
    res.json(await safeCall(forecastService.getForecast, req.params.country));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    res.json({ success: true, alerts: (await safeCall(alertsService.getActiveAlerts)) || [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/alerts/:id/:action", async (req, res) => {
  try {
    res.json({
      success: true,
      result: await safeCall(alertsService.updateAlertStatus, req.params.id, req.params.action),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Radar
app.get("/api/radar/global", async (req, res) => {
  try {
    const fn = radarService.getGlobalRadar ?? radarService.radarHandler;
    res.json({ success: true, radar: await safeCall(fn) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Podcasts
app.get("/api/podcast/:country", async (req, res) => {
  try {
    res.json({
      success: true,
      podcast: await safeCall(podcastService.generatePodcast, req.params.country),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Chat IA général
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    res.json({ success: true, reply: await safeCall(chatService.askAI, message || "") });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Chat IA moteur (runs + alertes)
app.post("/api/chat/engine", async (req, res) => {
  try {
    const { message } = req.body;
    res.json({ success: true, reply: await safeCall(chatService.askAIEngine, message || "") });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Logs & Engine state
app.get("/api/logs", async (req, res) => {
  res.json(await safeCall(logsService.getLogs));
});

app.get("/api/engine-state", async (req, res) => {
  res.json(await safeCall(engineStateService.getEngineState));
});

// ✅ Nouveau : route Checkup
app.get("/api/checkup", async (req, res) => {
  try {
    const state = await safeCall(engineStateService.getEngineState);
    res.json(state?.checkup || {});
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin page
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"))
);

// === Start server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
