// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services (imports robustes) ===
import forecastService from "./services/forecastService.js";
import { runSuperForecast } from "./services/superForecast.js";
import * as radarService from "./services/radarService.js";           // ✅ robust
import * as bulletinService from "./services/bulletinService.js";     // ✅ robust
import * as chatService from "./services/chatService.js";             // ✅ robust
import { addLog } from "./services/logsService.js";
import checkCoverage from "./services/checkCoverage.js";

// === DB Models (inchangés) ===
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
    const forecast = await forecastService.getForecast(req.params.zone);
    res.json(forecast);
  } catch (err) {
    console.error("❌ Forecast error:", err);
    res.status(500).json({ error: "Forecast service failed" });
  }
});

app.get("/api/localforecast/:lat/:lon", checkCoverage, async (req, res) => {
  try {
    const forecast = await forecastService.getLocalForecast(req.params.lat, req.params.lon);
    res.json(forecast);
  } catch (err) {
    console.error("❌ Local forecast error:", err);
    res.status(500).json({ error: "Local forecast service failed" });
  }
});

// --- SuperForecast ---
app.get("/api/superforecast", checkCoverage, async (req, res) => {
  try {
    const result = await runSuperForecast({ lat: 50.5, lon: 4.7, country: "Belgium" });
    res.json(result);
  } catch (err) {
    console.error("❌ SuperForecast error:", err);
    res.status(500).json({ error: "SuperForecast failed" });
  }
});

// --- Alerts (bypass alertsService.js + imports dynamiques sûrs) ---
app.get("/api/alerts/:zone", checkCoverage, async (req, res) => {
  try {
    const zone = req.params.zone;

    // detecteur brut (supporte named/default)
    const detMod = await import("./services/alertDetector.js");
    const detectAlerts =
      detMod.detectAlerts ||
      detMod.default ||
      detMod.detect ||
      detMod.alertsDetector;

    if (typeof detectAlerts !== "function") {
      return res.status(500).json({ error: "alertDetector introuvable (export)" });
    }

    // moteur enrichissement (optionnel)
    let processAlerts = null;
    try {
      const engMod = await import("./services/alertsEngine.js");
      processAlerts = engMod.processAlerts || engMod.default || null;
    } catch {
      processAlerts = null;
    }

    const rawAlerts = await detectAlerts(zone);
    const enriched = processAlerts ? await processAlerts(rawAlerts, { zone }) : rawAlerts;

    res.json({ zone, alerts: enriched });
  } catch (err) {
    console.error("❌ Alerts route error:", err);
    res.status(500).json({ error: "Alerts service failed" });
  }
});

// --- Radar (fix export: named OU default) ---
app.get("/api/radar/:zone", checkCoverage, async (req, res) => {
  try {
    const radarFn =
      radarService.radarHandler ||
      radarService.default ||
      radarService.getRadar ||
      radarService.handler;

    if (typeof radarFn !== "function") {
      return res.status(500).json({ error: "radarService introuvable (export)" });
    }

    const data = await radarFn(req.params.zone);
    res.json(data);
  } catch (err) {
    console.error("❌ Radar error:", err);
    res.status(500).json({ error: "Radar service failed" });
  }
});

// --- Bulletins (fix export: named OU default) ---
app.get("/api/bulletin/:zone", checkCoverage, async (req, res) => {
  try {
    const generateBulletin =
      bulletinService.generateBulletin ||
      bulletinService.default;

    if (typeof generateBulletin !== "function") {
      return res.status(500).json({ error: "generateBulletin introuvable (export)" });
    }

    const data = await generateBulletin(req.params.zone);
    res.json(data);
  } catch (err) {
    console.error("❌ Bulletin error:", err);
    res.status(500).json({ error: "Bulletin service failed" });
  }
});

// --- Chat with J.E.A.N. (fix export: named OU default) ---
app.post("/api/chat", checkCoverage, async (req, res) => {
  try {
    const { message } = req.body;

    const chatWithJean =
      chatService.chatWithJean ||
      chatService.default;

    if (typeof chatWithJean !== "function") {
      return res.status(500).json({ error: "chatWithJean introuvable (export)" });
    }

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

// --- Checkup (diagnostic zones) ---
app.get("/api/checkup", async (req, res) => {
  try {
    const zonesTest = [
      { country: "Belgium", lat: 50.5, lon: 4.7 },
      { country: "France", lat: 48.8, lon: 2.3 },
      { country: "USA", lat: 38.9, lon: -77.0 },
      { country: "Norway", lat: 59.9, lon: 10.7 },
      { country: "Brazil", lat: -15.8, lon: -47.9 }, // non couverte
    ];

    const results = [];
    for (const z of zonesTest) {
      try {
        const forecast = await runSuperForecast(z);
        results.push({
          zone: z.country,
          covered: !!forecast.covered,
          status: forecast.analysis ? "✅ OK" : "❌ KO",
          details:
            typeof forecast.analysis === "string"
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
