// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

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
import Alert from "./models/Alerts.js";

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
// 🚀 API ROUTES
// ==============================

// Run SuperForecast (manuel)
app.post("/api/superforecast/run", async (req, res) => {
  try {
    const data = req.body || {};
    const result = await superForecast.runSuperForecast(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest forecasts
app.get("/api/forecasts", async (req, res) => {
  try {
    const forecasts = await Forecast.find().sort({ date: -1 }).limit(50);
    res.json(forecasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 🚨 ALERTS
// ==============================

// Get alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create alert (manual override OR IA injection)
app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.createAlert(req.body);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update alert (validate / reject / edit)
app.put("/api/alerts/:id", async (req, res) => {
  try {
    const updated = await alertsService.updateAlert(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Alerte non trouvée" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete alert
app.delete("/api/alerts/:id", async (req, res) => {
  try {
    const deleted = await alertsService.deleteAlert(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Alerte non trouvée" });
    res.json({ message: "Alerte supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force publish alert (bypass IA)
app.post("/api/alerts/publish/:id", async (req, res) => {
  try {
    const updated = await alertsService.updateAlert(req.params.id, {
      status: "✅",
      published: true,
    });
    if (!updated) return res.status(404).json({ error: "Alerte non trouvée" });
    await addLog(`🚨 Alerte forcée publiée manuellement: ${updated._id}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 💬 CHAT (J.E.A.N. IA)
// ==============================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatService.chatWithJean(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 📜 LOGS
// ==============================
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 🛰️ RADAR
// ==============================
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 🎙️ PODCAST
// ==============================
app.get("/api/podcast", async (req, res) => {
  try {
    const audio = await podcastService.generatePodcast();
    res.json(audio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 🌍 Server start
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Serveur météo nucléaire actif sur le port ${PORT}`)
);
