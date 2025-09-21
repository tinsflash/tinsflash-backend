// src/server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import superForecast from "./services/superForecast.js";
import radarService from "./services/radarService.js";
import alertsService from "./services/alertsService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import forecastVision from "./services/forecastVision.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- ROUTES ---

// SuperForecast (fusion multi-modèles)
app.get("/api/supercalc/run", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const forecast = await superForecast.runSuperForecast(lat, lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: "Erreur SuperForecast", details: err.message });
  }
});

// Forecast local (simplifié)
app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const forecast = await superForecast.runSuperForecast(lat, lon);
    res.json(forecast.mergedForecast);
  } catch (err) {
    res.status(500).json({ error: "Erreur forecast local", details: err.message });
  }
});

// Radar
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: "Erreur radar", details: err.message });
  }
});

// Alertes
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Erreur alerts", details: err.message });
  }
});

// Podcasts météo
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { text } = req.body;
    const podcast = await podcastService.generatePodcast(text);
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: "Erreur podcast", details: err.message });
  }
});

// Chat IA (Jean)
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await chatService.askJean(question);
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: "Erreur chat", details: err.message });
  }
});

// Anomalies saisonnières (Copernicus ERA5)
app.get("/api/anomalies/seasonal", async (req, res) => {
  try {
    const { lat, lon, variable } = req.query;
    const anomaly = await forecastVision.detectSeasonalAnomaly(
      lat,
      lon,
      variable || "2m_temperature"
    );
    res.json(anomaly);
  } catch (err) {
    res.status(500).json({ error: "Erreur anomalies", details: err.message });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Serveur météo lancé sur http://localhost:${PORT}`);
});
