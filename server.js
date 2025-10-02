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

// ✅ Router vérification
import verifyRouter from "./services/verifyRouter.js";
app.use("/api/verify", verifyRouter);

// ✅ Cohere service (J.E.A.N. public)
import { askCohere } from "./services/cohereService.js";

// Helper safeCall
const safeCall = async (fn, ...args) =>
  typeof fn === "function" ? await fn(...args) : null;

// === Page d'accueil ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Runs
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

app.post("/api/run-continental", async (req, res) => {
  try {
    await checkSourcesFreshness();
    res.json({
      success: true,
      result: await safeCall(runContinental.runContinental),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Forecasts
app.post("/api/superforecast", async (req, res) => {
  try {
    const { lat, lon, country, region } = req.body;
    await checkSourcesFreshness();
    res.json(
      await safeCall(superForecast.runSuperForecast, { lat, lon, country, region })
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
    res.json((await safeCall(alertsService.getActiveAlerts)) || []);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/alerts/:id/:action", async (req, res) => {
  try {
    res.json({
      success: true,
      result: await safeCall(
        alertsService.updateAlertStatus,
        req.params.id,
        req.params.action
      ),
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
    res.json({
      success: true,
      reply: await safeCall(chatService.askAI, message || ""),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Chat IA moteur
app.post("/api/chat/engine", async (req, res) => {
  try {
    const { message } = req.body;
    res.json({
      success: true,
      reply: await safeCall(chatService.askAIEngine, message || ""),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ✅ TextGen (IA console admin)
app.post("/api/textgen", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt manquant" });
    }
    const result = await safeCall(textGenService.generateText, prompt);
    res.json({ success: true, reply: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Logs & Engine state
app.get("/api/logs", async (req, res) => {
  res.json(await adminLogs.getLogs());
});

// ✅ Logs SSE (live stream)
app.get("/api/logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  adminLogs.registerClient(res);
});

app.get("/api/engine-state", async (req, res) => {
  res.json((await safeCall(engineStateService.getEngineState)) || {});
});

// Sources
app.get("/api/sources", async (req, res) => {
  try {
    res.json({ success: true, sources: await checkSourcesFreshness() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Checkup
app.get("/api/checkup", async (req, res) => {
  try {
    const state = await safeCall(engineStateService.getEngineState);
    res.json(state?.checkup || {});
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ✅ Infos météo mondiales
app.get("/api/news", async (req, res) => {
  try {
    res.json({ success: true, news: await safeCall(newsService.getNews) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ✅ Utilisateurs
app.get("/api/users", async (req, res) => {
  try {
    res.json({ success: true, users: await safeCall(userService.getUsers) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ✅ Chat public J.E.A.N. (Index public via Cohere)
app.post("/api/jean", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: "Message manquant" });
    }
    const reply = await askCohere(message);
    res.json({ success: true, reply });
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
app.get("/admin-chat", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-chat.html"))
);
app.get("/admin-radar", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-radar.html"))
);
app.get("/admin-index", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-index.html"))
);
app.get("/admin-infos", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-infos.html"))
);
app.get("/admin-users", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-users.html"))
);

// === Start server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
