import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import { getForecast } from "./services/forecastService.js";
import { runSuperForecast } from "./services/superForecast.js";
import { getAlerts } from "./services/alertsService.js";
import { getRadar } from "./services/radarService.js";
import { saveLog, getLogs } from "./services/logsService.js";
import { chatWithJean } from "./services/chatService.js";
import { runAllModels } from "./services/meteoManager.js";
import { generateBulletin } from "./services/bulletinService.js";
import { getWeatherNews } from "./services/newsService.js";
import { getSatelliteImages } from "./services/nasaSat.js";
import { getCopernicusData } from "./services/copernicusService.js";
import { getWZCharts } from "./services/wetterzentrale.js";
import { getTrullemansData } from "./services/trullemans.js";
import { checkZoneCoverage } from "./services/checkCoverage.js";
// podcastService désactivé temporairement

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// === Routes ===

// Prévisions simples
app.get("/api/forecast/:zone", async (req, res) => {
  try {
    const covered = checkZoneCoverage(req.params.zone);
    if (!covered) return res.status(400).json({ error: "Zone not covered" });
    const forecast = await getForecast(req.params.zone);
    res.json(forecast);
  } catch (err) {
    console.error("❌ Forecast error:", err);
    res.status(500).json({ error: "Forecast failed" });
  }
});

// SuperForecast
app.get("/api/superforecast", async (req, res) => {
  try {
    const result = await runSuperForecast();
    res.json(result);
  } catch (err) {
    console.error("❌ SuperForecast error:", err);
    res.status(500).json({ error: "SuperForecast failed" });
  }
});

// Alertes
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    console.error("❌ Alerts error:", err);
    res.status(500).json({ error: "Alerts failed" });
  }
});

// Radar
app.get("/api/radar/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const radar = await getRadar(lat, lon);
    res.json(radar);
  } catch (err) {
    console.error("❌ Radar error:", err);
    res.status(500).json({ error: "Radar failed" });
  }
});

// Chat IA (Jean)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatWithJean(message);
    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// Logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Logs failed" });
  }
});

// Bulletin
app.get("/api/bulletin", async (req, res) => {
  try {
    const bulletin = await generateBulletin();
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ error: "Bulletin failed" });
  }
});

// News
app.get("/api/news", async (req, res) => {
  try {
    const news = await getWeatherNews();
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "News failed" });
  }
});

// NASA Satellites
app.get("/api/nasa/sat", async (req, res) => {
  try {
    const sat = await getSatelliteImages();
    res.json(sat);
  } catch (err) {
    res.status(500).json({ error: "NASA sat failed" });
  }
});

// Copernicus
app.get("/api/copernicus", async (req, res) => {
  try {
    const data = await getCopernicusData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Copernicus failed" });
  }
});

// Wetterzentrale
app.get("/api/wetterzentrale", async (req, res) => {
  try {
    const data = await getWZCharts();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Wetterzentrale failed" });
  }
});

// Trullemans
app.get("/api/trullemans", async (req, res) => {
  try {
    const data = await getTrullemansData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Trullemans failed" });
  }
});

// === Server start ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
