// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import forecastService from "./services/forecastService.js";
import runSuperForecast from "./services/superForecast.js";
import radarService from "./services/radarService.js";
import generateBulletin from "./services/bulletinService.js";
import { chatWithJean } from "./services/chatService.js";
import { addLog } from "./services/logsService.js";
import checkCoverage from "./services/checkCoverage.js";

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
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// 📡 API ROUTES
// ==============================

// --- Forecasts ---
app.get("/api/forecast/:zone", checkCoverage, async (req, res) => {
  try {
    const { zone } = req.params;
    if (req.coverage.covered) {
      const forecast = await forecastService.getForecast(zone);
      return res.json(forecast);
    } else {
      return res.json({ zone, source: "open-data", message: "Zone non couverte - prévisions Open Data" });
    }
  } catch (err) {
    console.error("❌ Forecast error:", err);
    res.status(500).json({ error: "Forecast service failed" });
  }
});

// --- Local forecast ---
app.get("/api/localforecast/:lat/:lon", checkCoverage, async (req, res) => {
  try {
    if (req.coverage.covered) {
      const forecast = await forecastService.getLocalForecast(req.params.lat, req.params.lon);
      return res.json(forecast);
    } else {
      return res.json({ coords: req.params, source: "open-data", message: "Zone non couverte - prévisions Open Data" });
    }
  } catch (err) {
    console.error("❌ Local forecast error:", err);
    res.status(500).json({ error: "Local forecast service failed" });
  }
});

// --- SuperForecast ---
app.get("/api/superforecast", checkCoverage, async (req, res) => {
  try {
    if (req.coverage.covered) {
      const result = await runSuperForecast({ lat: 50.5, lon: 4.7, country: "Belgium" });
      return res.json(result);
    } else {
      return res.json({ source: "alerts", message: "Zone non couverte - alertes continentales uniquement" });
    }
  } catch (err) {
    console.error("❌ SuperForecast error:", err);
    res.status(500).json({ error: "SuperForecast failed" });
  }
});

// --- Alerts ---
app.get("/api/alerts/:zone", checkCoverage, async (req, res) => {
  try {
    const detMod = await import("./services/alertDetector.js");
    const detectAlerts = detMod.detectAlerts || detMod.default;

    if (typeof detectAlerts !== "function") {
      return res.status(500).json({ error: "alertDetector introuvable" });
    }

    let processAlerts = null;
    try {
      const engMod = await import("./services/alertsEngine.js");
      processAlerts = engMod.processAlerts || engMod.default || null;
    } catch {
      processAlerts = null;
    }

    const rawAlerts = await detectAlerts(req.params.zone);
    const enriched = processAlerts ? await processAlerts(rawAlerts, { zone: req.params.zone }) : rawAlerts;

    res.json({ zone: req.params.zone, alerts: enriched });
  } catch (err) {
    console.error("❌ Alerts route error:", err);
    res.status(500).json({ error: "Alerts service failed" });
  }
});

// --- Radar ---
app.get("/api/radar/:zone", checkCoverage, async (req, res) => {
  try {
    const data = await radarService.radarHandler(req.params.zone);
    res.json(data);
  } catch (err) {
    console.error("❌ Radar error:", err);
    res.status(500).json({ error: "Radar service failed" });
  }
});

// --- Bulletins ---
app.get("/api/bulletin/:zone", checkCoverage, async (req, res) => {
  try {
    const data = await generateBulletin(req.params.zone);
    res.json(data);
  } catch (err) {
    console.error("❌ Bulletin error:", err);
    res.status(500).json({ error: "Bulletin service failed" });
  }
});

// --- Chat ---
app.post("/api/chat", checkCoverage, async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatWithJean(message);
    res.json(response);
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat service failed" });
  }
});

// --- Logs ---
app.post("/api/logs", async (req, res) => {
  try {
    const { service, message } = req.body;
    await addLog(service, message);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Logs error:", err);
    res.status(500).json({ error: "Logs service failed" });
  }
});

// --- Checkup ---
app.get("/api/checkup", async (req, res) => {
  try {
    const zonesTest = [
      { country: "Belgium", lat: 50.5, lon: 4.7 },
      { country: "France", lat: 48.8, lon: 2.3 },
      { country: "USA", lat: 38.9, lon: -77.0 },
      { country: "Norway", lat: 59.9, lon: 10.7 },
      { country: "Brazil", lat: -15.8, lon: -47.9 }
    ];

    const results = [];
    for (const z of zonesTest) {
      try {
        const forecast = await runSuperForecast(z);
        results.push({
          zone: z.country,
          covered: !!forecast.covered,
          status: forecast.analysis ? "✅ OK" : "❌ KO",
          details: typeof forecast.analysis === "string"
            ? forecast.analysis.slice(0, 300)
            : (forecast.analysis || forecast.error || "").toString().slice(0, 300),
        });
      } catch (err) {
        results.push({
          zone: z.country,
          covered: false,
          status: "❌ KO",
          details: err.message || String(err),
        });
      }
    }

    res.json({ checkup: results });
  } catch (err) {
    console.error("❌ Checkup error:", err);
    res.status(500).json({ error: "Checkup failed" });
  }
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
