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

// === Optional static public (admin frontend) ===
app.use(express.static(path.join(__dirname, "public")));

// === DB connect (only if MONGO_URI provided) ===
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
} else {
  console.warn("⚠️ MONGO_URI not set — skipping MongoDB connection");
}

// === Try to import services but be tolerant to named/default export differences ===
import * as runGlobalMod from "./services/runGlobal.js";
import * as runContinentalMod from "./services/runContinental.js";
import * as superForecastMod from "./services/superForecast.js";
import * as forecastServiceMod from "./services/forecastService.js";
import * as radarServiceMod from "./services/radarService.js";
import * as podcastServiceMod from "./services/podcastService.js";
import * as chatServiceMod from "./services/chatService.js";
import * as logsMod from "./services/adminLogs.js";
import * as engineStateMod from "./services/engineState.js";
import * as alertsServiceMod from "./services/alertsService.js";

// Helpers to resolve the "real" exported function (support default vs named)
const runGlobal = runGlobalMod.default ?? runGlobalMod.runGlobal ?? runGlobalMod;
const runContinental = runContinentalMod.default ?? runContinentalMod.runContinental ?? runContinentalMod;
const runSuperForecast = superForecastMod.default ?? superForecastMod.runSuperForecast ?? superForecastMod;
const forecastService = forecastServiceMod.default ?? forecastServiceMod;
const radarService = radarServiceMod.default ?? radarServiceMod;
const podcastService = podcastServiceMod.default ?? podcastServiceMod;
const chatService = chatServiceMod.default ?? chatServiceMod;
const { getLogs, addLog } = logsMod;
const { getEngineState, saveEngineState, addEngineLog } = engineStateMod;
const { getActiveAlerts, updateAlertStatus } = alertsServiceMod;

// ==============================
// API ROUTES
// ==============================

app.get("/", (req, res) => {
  res.json({ success: true, message: "🌍 Centrale Nucléaire Météo Backend en ligne" });
});

// RUN GLOBAL
app.post("/api/run-global", async (req, res) => {
  try {
    if (typeof runGlobal !== "function") throw new Error("runGlobal handler not available");
    const result = await runGlobal();
    addLog("API: run-global executed");
    res.json({ success: true, result });
  } catch (e) {
    addLog(`API run-global error: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
});

// RUN CONTINENTAL
app.post("/api/run-continental", async (req, res) => {
  try {
    if (typeof runContinental !== "function") throw new Error("runContinental handler not available");
    const result = await runContinental();
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// SuperForecast per point
app.post("/api/superforecast", async (req, res) => {
  try {
    const { lat, lon, country } = req.body;
    if (typeof runSuperForecast !== "function") throw new Error("runSuperForecast not available");
    const out = await runSuperForecast({ lat, lon, country });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Local forecast (directly from forecastService)
app.get("/api/localforecast/:lat/:lon/:country?", async (req, res) => {
  try {
    const { lat, lon, country } = req.params;
    if (!forecastService.getLocalForecast && !forecastService.getForecast) {
      throw new Error("forecastService exports not found");
    }
    const d = await (forecastService.getLocalForecast
      ? forecastService.getLocalForecast(lat, lon, country)
      : forecastService.getForecast(country));
    res.json(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// National forecast
app.get("/api/forecast/:country", async (req, res) => {
  try {
    const { country } = req.params;
    if (!forecastService.getForecast) throw new Error("forecastService.getForecast not available");
    const d = await forecastService.getForecast(country);
    res.json(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Alerts: get active
app.get("/api/alerts", async (req, res) => {
  try {
    if (!getActiveAlerts) throw new Error("getActiveAlerts not available");
    const alerts = await getActiveAlerts();
    res.json({ success: true, ...alerts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Alerts: update status (validate / expert / wait / ignore)
app.post("/api/alerts/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    if (typeof updateAlertStatus !== "function") throw new Error("updateAlertStatus not implemented");
    const result = await updateAlertStatus(id, action);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Radar global
app.get("/api/radar/global", async (req, res) => {
  try {
    const radarFn = radarService.getGlobalRadar ?? radarService.radarHandler ?? radarService.default?.getGlobalRadar;
    if (!radarFn) throw new Error("radar service missing getGlobalRadar/radarHandler");
    const radar = await radarFn();
    res.json({ success: true, radar });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Logs, engine-state, chat
app.get("/api/logs", (req, res) => {
  res.json(getLogs());
});
app.get("/api/engine-state", (req, res) => {
  res.json(getEngineState());
});
app.post("/api/chat", async (req, res) => {
  try {
    if (!chatService
