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

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";

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
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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
    console.error("❌ Forecast API error:", err.message);
    res.status(500).json({ error: "Forecast API failed" });
  }
});

// === SuperForecast (centrale IA nucléaire) ===
app.post("/api/superforecast", async (req, res) => {
  try {
    const { forecastData } = req.body;
    const analysis = await superForecastService.runSuperForecast(forecastData);
    res.json({ analysis });
  } catch (err) {
    console.error("❌ SuperForecast API error:", err.message);
    res.status(500).json({ error: "SuperForecast API failed" });
  }
});

// === Alertes ===
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    console.error("❌ Alerts API error:", err.message);
    res.status(500).json({ error: "Alerts API failed" });
  }
});

// === Radar ===
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    console.error("❌ Radar API error:", err.message);
    res.status(500).json({ error: "Radar API failed" });
  }
});

// === Podcasts météo ===
app.get("/api/podcasts", async (req, res) => {
  try {
    const podcasts = await podcastService.getPodcasts();
    res.json(podcasts);
  } catch (err) {
    console.error("❌ Podcast API error:", err.message);
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
    console.error("❌ Chat API error:", err.message);
    res.status(500).json({ error: "Chat API failed" });
  }
});

// ==============================
// 🚀 Start server
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Centrale Nucléaire Météo active sur port ${PORT}`);
});
