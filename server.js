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

// === Static public (admin frontend) ===
app.use(express.static(path.join(__dirname, "public")));

// === DB connect ===
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// === Import services (robust against default/named exports) ===
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

// Helpers
const runGlobal = runGlobalMod.default ?? runGlobalMod.runGlobal ?? runGlobalMod;
const runContinental = runContinentalMod.default ?? runContinentalMod.runContinental ?? runContinentalMod;
const runSuperForecast = superForecastMod.default ?? superForecastMod.runSuperForecast ?? superForecastMod;
const forecastService = forecastServiceMod.default ?? forecastServiceMod;
const radarService = radarServiceMod.default ?? radarServiceMod;
const podcastService = podcastServiceMod.default ?? podcastServiceMod;
const chatService = chatServiceMod.default ?? chatServiceMod;
const { getLogs } = logsMod;
const { getEngineState } = engineStateMod;
const { getActiveAlerts, updateAlertStatus } = alertsServiceMod;

// ==============================
// API ROUTES
// ==============================

// Test
app.get("/", (req, res) => res.json({ success: true, message: "🌍 Centrale Nucléaire Météo Backend en ligne" }));

// Runs
app.post("/api/run-global", async (req, res) => {
  try {
    if (typeof runGlobal !== "function") throw new Error("runGlobal non dispo");
    res.json({ success: true, result: await runGlobal() });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post("/api/run-continental", async (req, res) => {
  try {
    if (typeof runContinental !== "function") throw new Error("runContinental non dispo");
    res.json({ success: true, result: await runContinental() });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Forecasts
app.post("/api/superforecast", async (req, res) => {
  try {
    const { lat, lon, country } = req.body;
    res.json(await runSuperForecast({ lat, lon, country }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get("/api/localforecast/:lat/:lon/:country?", async (req, res) => {
  try {
    const { lat, lon, country } = req.params;
    const fn = forecastService.getLocalForecast ?? forecastService.getForecast;
    if (!fn) throw new Error("forecastService non dispo");
    res.json(await fn(lat, lon, country));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get("/api/forecast/:country", async (req, res) => {
  try {
    if (!forecastService.getForecast) throw new Error("getForecast non dispo");
    res.json(await forecastService.getForecast(req.params.country));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  try { res.json({ success: true, alerts: await getActiveAlerts() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post("/api/alerts/:id/:action", async (req, res) => {
  try { res.json({ success: true, result: await updateAlertStatus(req.params.id, req.params.action) }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Radar
app.get("/api/radar/global", async (req, res) => {
  try {
    const fn = radarService.getGlobalRadar ?? radarService.radarHandler;
    if (!fn) throw new Error("radarService non dispo");
    res.json({ success: true, radar: await fn() });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Podcasts
app.get("/api/podcast/:country", async (req, res) => {
  try {
    if (!podcastService.generatePodcast) throw new Error("generatePodcast non dispo");
    res.json({ success: true, podcast: await podcastService.generatePodcast(req.params.country) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Chat
app.post("/api/chat", async (req, res) => {
  try {
    const ask = chatService.askAI ?? chatService;
    res.json({ success: true, reply: await ask(req.body.message || "") });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Logs & State
app.get("/api/logs", (req, res) => res.json(getLogs()));
app.get("/api/engine-state", (req, res) => res.json(getEngineState()));

// Admin page
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin-pp.html")));

// ==============================
// Start server
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
