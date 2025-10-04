// PATH: server.js
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
import { runGlobal } from "./services/runGlobal.js";
import * as runContinental from "./services/runContinental.js";
import * as superForecast from "./services/superForecast.js";
import * as forecastService from "./services/forecastService.js";
import * as radarService from "./services/radarService.js";
import * as podcastService from "./services/podcastService.js";
import * as chatService from "./services/chatService.js";
import * as engineStateService from "./services/engineState.js";
import * as alertsService from "./services/alertsService.js";
import * as textGenService from "./services/textGenService.js";
import * as newsService from "./services/newsService.js";
import * as userService from "./services/userService.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import * as adminLogs from "./services/adminLogs.js";
import { runWorldAlerts } from "./services/runWorldAlerts.js"; 
import { askCohere } from "./services/cohereService.js";
import { addSubscription, sendNotification } from "./services/pushService.js";

const safeCall = async (fn, ...args) =>
  typeof fn === "function" ? await fn(...args) : null;

// === Page d'accueil ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// === Runs ===
app.post("/api/run-global", async (req, res) => {
  try {
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await safeCall(runGlobal, zone || "Europe");
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// … (tous tes autres endpoints déjà en place inchangés)

// === NEW : Status global moteur ===
app.get("/api/status", async (req, res) => {
  try {
    const state = await safeCall(engineStateService.getEngineState);
    res.json({
      status: state?.checkup?.engineStatus || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || "unknown",
      steps: state?.checkup || {},
      alerts: state?.alerts || [],
      alertsCount: state?.alerts?.length || 0,
      forecasts: state?.forecastsContinental || {},
      finalReport: state?.finalReport || {},
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Admin pages ===
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"))
);
app.get("/admin-alerts", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-alerts.html"))
);
// … idem pour les autres pages

// === Start server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
