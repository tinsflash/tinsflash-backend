// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Services ===
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import alertsService from "./services/alertsService.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import { addLog, getLogs } from "./services/logsService.js";

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js"; // ✅ correspond bien au fichier

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ==============================
// 📡 MongoDB connection
// ==============================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// ==============================
// 🌍 Static files (admin + index)
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// ==============================
// 🚀 API ROUTES
// ==============================

// Run SuperForecast
app.post("/api/superforecast/run", async (req, res) => {
  try {
    const data = req.body || {};
    const result = await superForecast.runSuperForecast(data);
    res.json(result);
  } catch (err) {
    await addLog(`❌ Erreur SuperForecast: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Get forecasts
app.get("/api/forecasts", async (req, res) => {
  try {
    const forecasts = await Forecast.find().sort({ date: -1 }).limit(50);
    res.json(forecasts);
  } catch (err) {
    await addLog(`❌ Erreur récupération forecasts: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Get alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    await addLog(`❌ Erreur récupération alerts: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Create alert (manual)
app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.createAlert(req.body);
    res.json(alert);
  } catch (err) {
    await addLog(`❌ Erreur création alert: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Chat with J.E.A.N.
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const result = await chatService.chatWithJean(message);
    res.json(result);
  } catch (err) {
    await addLog(`❌ Erreur chat JEAN: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    await addLog(`❌ Erreur radar: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Podcast (si tu veux garder)
app.get("/api/podcast", async (req, res) => {
  try {
    const audio = await podcastService.generatePodcast();
    res.json(audio);
  } catch (err) {
    await addLog(`❌ Erreur podcast: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 🖥️ Catch-all (redirige vers index.html si route inconnue)
// ==============================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==============================
// 🚀 Start server
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Centrale météo nucléaire active sur le port ${PORT}`)
);
