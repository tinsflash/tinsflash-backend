// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import forecastService from "./services/forecastService.js";
import superForecastService from "./services/superForecast.js";
import alertsService from "./services/alertsService.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import { getLogs } from "./services/logsService.js";

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";
import Log from "./models/Log.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur connexion MongoDB:", err));

// ==============================
// 📡 API ROUTES
// ==============================

// === Prévisions météo ===
app.get("/api/forecast/:country", async (req, res) => {
  try {
    const { country } = req.params;
    const data = await forecastService.getForecast(country);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur /api/forecast:", err.message);
    res.status(500).json({ error: "Forecast API failed" });
  }
});

// === SuperForecast (centrale nucléaire météo) ===
app.post("/api/superforecast", async (req, res) => {
  try {
    const { forecastData } = req.body;
    const result = await superForecastService.runSuperForecast(forecastData);
    res.json(result);
  } catch (err) {
    console.error("❌ Erreur /api/superforecast:", err.message);
    res.status(500).json({ error: "SuperForecast API failed" });
  }
});

// === Alertes ===
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    console.error("❌ Erreur /api/alerts:", err.message);
    res.status(500).json({ error: "Alerts API failed" });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.createAlert(req.body);
    res.json(alert);
  } catch (err) {
    console.error("❌ Erreur création alerte:", err.message);
    res.status(500).json({ error: "Create alert failed" });
  }
});

app.put("/api/alerts/:id/validate", async (req, res) => {
  try {
    const alert = await alertsService.validateAlert(req.params.id);
    res.json(alert);
  } catch (err) {
    console.error("❌ Erreur validation alerte:", err.message);
    res.status(500).json({ error: "Validate alert failed" });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  try {
    const alert = await alertsService.deleteAlert(req.params.id);
    res.json(alert);
  } catch (err) {
    console.error("❌ Erreur suppression alerte:", err.message);
    res.status(500).json({ error: "Delete alert failed" });
  }
});

// === Radar ===
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    console.error("❌ Erreur /api/radar:", err.message);
    res.status(500).json({ error: "Radar API failed" });
  }
});

// === Podcasts météo ===
app.get("/api/podcasts", async (req, res) => {
  try {
    const podcasts = await podcastService.getPodcasts();
    res.json(podcasts);
  } catch (err) {
    console.error("❌ Erreur /api/podcasts:", err.message);
    res.status(500).json({ error: "Podcast API failed" });
  }
});

// === Chat avec J.E.A.N. ===
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatService.askJEAN(message);
    res.json({ reply });
  } catch (err) {
    console.error("❌ Erreur /api/chat:", err.message);
    res.status(500).json({ error: "Chat API failed" });
  }
});

// === Admin : Logs ===
app.get("/api/admin/logs", async (req, res) => {
  try {
    const logs = await getLogs(200);
    res.json(logs.map(l => `[${l.createdAt.toISOString()}] ${l.message}`));
  } catch (err) {
    console.error("❌ Erreur /api/admin/logs:", err.message);
    res.status(500).json({ error: "Logs API failed" });
  }
});

// === Admin : Utilisateurs ===
app.get("/api/admin/users", async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: { type: "$type", zone: "$zone" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: "$_id.type",
          zone: "$_id.zone",
          count: 1
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error("❌ Erreur /api/admin/users:", err.message);
    res.status(500).json({ error: "Users API failed" });
  }
});

// ==============================
// 🚀 Start server
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Centrale Nucléaire Météo active sur port ${PORT}`);
});
