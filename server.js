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
import Alert from "./models/Alert.js";   // ✅ corrigé : pas de "s"

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// 📡 API ROUTES
// ==============================

// Supercalculateur météo
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const result = await superForecast.runFullForecast();
    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Supercalc error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Prévisions locales
app.get("/api/forecast/local", async (req, res) => {
  try {
    const forecast = await forecastService.getLocalForecast(req.query.lat, req.query.lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Prévisions nationales
app.get("/api/forecast/national", async (req, res) => {
  try {
    const forecast = await forecastService.getNationalForecast(req.query.country);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Prévisions 7 jours
app.get("/api/forecast/7days", async (req, res) => {
  try {
    const forecast = await forecastService.get7DayForecast(req.query.lat, req.query.lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar météo
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar(req.query.type || "rain");
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Podcast météo
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const podcast = await podcastService.generatePodcast(req.body.text);
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat IA
app.post("/api/chat", async (req, res) => {
  try {
    const response = await chatService.askJean(req.body.message);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
