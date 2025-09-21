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

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// ==============================
// 📡 API ROUTES
// ==============================

// 🚀 Supercalculateur météo
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { lat, lon } = req.body || { lat: 50.5, lon: 4.7 };

    console.log(`🛰️ [Supercalc] Lancement run complet lat=${lat}, lon=${lon}`);
    const result = await superForecast.runFullForecast(lat, lon);

    if (!result.success) {
      pushAdminNotification(`❌ Run échoué sur lat=${lat}, lon=${lon} → ${result.error}`);
      throw new Error(result.error || "Echec SuperForecast");
    }

    if (result.anomaly) {
      pushAdminNotification(`⚠️ Anomalie détectée sur lat=${lat}, lon=${lon} → ${result.anomaly.message}`);
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Erreur Supercalc:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📍 Prévisions locales
app.get("/api/forecast/local", async (req, res) => {
  try {
    const forecast = await forecastService.getLocalForecast(req.query.lat, req.query.lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🌍 Prévisions nationales
app.get("/api/forecast/national", async (req, res) => {
  try {
    const forecast = await forecastService.getNationalForecast(req.query.country);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📅 Prévisions 7 jours
app.get("/api/forecast/7days", async (req, res) => {
  try {
    const forecast = await forecastService.get7DayForecast(req.query.lat, req.query.lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🛰️ Radar météo
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar(req.query.type || "rain");
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎙 Podcast météo
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const podcast = await podcastService.generatePodcast(req.body.text);
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🤖 Chat IA (Jean)
app.post("/api/chat", async (req, res) => {
  try {
    const response = await chatService.askJean(req.body.message);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 📜 LOGS SUPERFORECAST
// ==============================
app.get("/api/supercalc/logs", async (req, res) => {
  try {
    const logs = await Forecast.find().sort({ timestamp: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    console.error("❌ Erreur récupération logs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// ⚠️ NOTIFICATIONS ADMIN
// ==============================
let adminNotifications = [];

export function pushAdminNotification(message) {
  adminNotifications.push({
    message,
    timestamp: new Date()
  });
  console.log("⚠️ [ADMIN] " + message);
}

app.get("/api/admin/notifications", (req, res) => {
  res.json(adminNotifications);
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur lancé sur port ${PORT}`));
