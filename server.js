// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import forecastService from "./services/forecastService.js";
import { runSuperForecast } from "./services/superForecast.js";
import * as alertsService from "./services/alertsService.js";
import { radarHandler } from "./services/radarService.js";
import { generateBulletin } from "./services/bulletinService.js";
import chatWithJean from "./services/chatService.js";
import { addLog } from "./services/logsService.js";
import checkCoverage from "./services/checkCoverage.js"; // ✅ middleware

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
    const forecast = await forecastService.getForecast(req.params.zone);
    res.json(forecast);
  } catch (err) {
    console.error("❌ Forecast error:", err);
    res.status(500).json({ error: "Forecast service failed" });
  }
});

app.get("/api/localforecast/:zone", checkCoverage, async (req, res) => {
  try {
    const forecast = await forecastService.getLocalForecast(req.params.zone);
    res.json(forecast);
  } catch (err) {
    console.error("❌ Local forecast error:", err);
    res.status(500).json({ error: "Local forecast service failed" });
  }
});

app.get("/api/nationalforecast/:country", checkCoverage, async (req, res) => {
  try {
    const forecast = await forecastService.getNationalForecast(req.params.country);
    res.json(forecast);
  } catch (err) {
    console.error("❌ National forecast error:", err);
    res.status(500).json({ error: "National forecast service failed" });
  }
});

app.get("/api/forecast7days/:zone", checkCoverage, async (req, res) => {
  try {
    const forecast = await forecastService.get7DayForecast(req.params.zone);
    res.json(forecast);
  } catch (err) {
    console.error("❌ 7-day forecast error:", err);
    res.status(500).json({ error: "7-day forecast service failed" });
  }
});

// --- SuperForecast ---
app.post("/api/superforecast", async (req, res) => {
  try {
    const { fusionData, lat, lon } = req.body;
    const result = await runSuperForecast(fusionData, lat, lon);
    res.json(result);
  } catch (err) {
    console.error("❌ SuperForecast error:", err);
    res.status(500).json({ error: "SuperForecast failed" });
  }
});

// --- Alerts ---
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    console.error("❌ Alerts error:", err);
    res.status(500).json({ error: "Alerts service failed" });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.addAlert(req.body);
    res.json(alert);
  } catch (err) {
    console.error("❌ Add alert error:", err);
    res.status(500).json({ error: "Add alert failed" });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  try {
    const result = await alertsService.deleteAlert(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("❌ Delete alert error:", err);
    res.status(500).json({ error: "Delete alert failed" });
  }
});

// --- Radar ---
app.get("/api/radar/:zone", checkCoverage, async (req, res) => {
  try {
    const data = await radarHandler(req.params.zone);
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

// --- Chat with J.E.A.N. ---
app.post("/api/chat", async (req, res) => {
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

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
