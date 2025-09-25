// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import { getForecast, getLocalForecast } from "./services/forecastService.js";
import { runSuperForecast } from "./services/superForecast.js";
import alertsRouter from "./services/alertsService.js";
import { radarHandler } from "./services/radarService.js";
import { generateBulletin } from "./services/bulletinService.js";
import { chatWithJean } from "./services/chatService.js";
import { addLog } from "./services/logsService.js";
import { checkZoneCoverage } from "./services/checkCoverage.js";

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
app.get("/api/forecast/:zone", async (req, res) => {
  try {
    const forecast = await getForecast(req.params.zone);
    res.json(forecast);
  } catch (err) {
    console.error("❌ Forecast error:", err);
    res.status(500).json({ error: "Forecast service failed" });
  }
});

app.get("/api/localforecast/:lat/:lon", async (req, res) => {
  try {
    const forecast = await getLocalForecast(req.params.lat, req.params.lon);
    res.json(forecast);
  } catch (err) {
    console.error("❌ Local forecast error:", err);
    res.status(500).json({ error: "Local forecast service failed" });
  }
});

// --- SuperForecast ---
app.get("/api/superforecast", async (req, res) => {
  try {
    const result = await runSuperForecast();
    res.json(result);
  } catch (err) {
    console.error("❌ SuperForecast error:", err);
    res.status(500).json({ error: "SuperForecast failed" });
  }
});

// --- Alerts ---
app.use("/api/alerts", alertsRouter);

// --- Radar ---
app.get("/api/radar/:zone", async (req, res) => {
  try {
    const data = await radarHandler(req.params.zone);
    res.json(data);
  } catch (err) {
    console.error("❌ Radar error:", err);
    res.status(500).json({ error: "Radar service failed" });
  }
});

// --- Bulletins ---
app.get("/api/bulletin/:zone", async (req, res) => {
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

// --- Coverage check ---
app.get("/api/coverage/:zone", async (req, res) => {
  try {
    const result = await checkZoneCoverage(req.params.zone);
    res.json(result);
  } catch (err) {
    console.error("❌ Coverage error:", err);
    res.status(500).json({ error: "Coverage service failed" });
  }
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
