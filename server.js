// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.16 PRO+++)
// ==========================================================
// Moteur global IA J.E.A.N – 100 % réel, 100 % connecté
// Compatible Render / MongoDB / GitHub Actions / Admin Console
// ==========================================================

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import axios from "axios";
import fs from "fs";

import { runGlobal } from "./services/runGlobal.js";
import { runAIAnalysis } from "./services/aiAnalysis.js";
import {
  initEngineState,
  getEngineState,
  addEngineLog,
  addEngineError,
  stopExtraction,
  resetStopFlag,
  isExtractionStopped
} from "./services/engineState.js";

import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import { runWorldAlerts } from "./services/runWorldAlerts.js";
import Alert from "./models/Alert.js";
import * as chatService from "./services/chatService.js";
import { generateForecast } from "./services/forecastService.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));

// ==========================================================
// 🔌 Connexion MongoDB Render/Atlas
// ==========================================================
async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connecté");
    await initEngineState();
  } catch (err) {
    console.error("❌ Erreur MongoDB:", err.message);
    setTimeout(connectMongo, 8000);
  }
}
if (process.env.MONGO_URI) connectMongo();

// ==========================================================
// 🚀 Extraction, IA, Fusion
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped())
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });

    await checkSourcesFreshness();
    const zone = req.body?.zone || "All";
    const result = await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète effectuée pour ${zone}`, "success", "runGlobal");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("Erreur extraction: " + e.message, "runGlobal");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/runWorldAlerts", async (_, res) => {
  try {
    const result = await runWorldAlerts();
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("Erreur runWorldAlerts: " + e.message, "core");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🌤️ Forecast & Alerts publiques
// ==========================================================
app.get("/api/forecast", async (req, res) => {
  try {
    const { lat, lon, country = "", region = "" } = req.query;
    const data = await generateForecast(parseFloat(lat), parseFloat(lon), country, region);
    res.json(data);
  } catch (e) {
    await addEngineError("Erreur /api/forecast: " + e.message, "forecast");
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find().sort({ start: -1 }).limit(200);
    res.json(alerts);
  } catch (e) {
    await addEngineError("Erreur /api/alerts: " + e.message, "alerts");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🧠 STATUT MOTEUR IA – route /api/status
// ==========================================================
app.get("/api/status", async (_, res) => {
  try {
    const s = await getEngineState();
    res.json({
      status: s?.checkup?.engineStatus || s?.status || "IDLE",
      lastRun: s?.lastRun || null,
      errors: s?.errors || [],
      coveredZones: enumerateCoveredPoints(),
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uptime: process.uptime()
    });
  } catch (e) {
    await addEngineError("Erreur /api/status: " + e.message, "core");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 💬 Chats intégrés
// ==========================================================
app.post("/api/chat-tech", async (req, res) => {
  try {
    const { message } = req.body;
    const s = await getEngineState();
    let reply = "💬 Mode technique GPT-4o-mini connecté au moteur IA J.E.A.N.";
    if (/status|moteur/i.test(message))
      reply = `🧠 Moteur : ${s?.status || "inconnu"} | Dernier run : ${s?.lastRun || "aucun"}`;
    else if (/sources|modèles/i.test(message))
      reply = "📡 Sources actives : GFS, ECMWF, ICON, HRRR, AROME, GraphCast, CorrDiff, AIFS.";
    res.json({ reply });
  } catch (e) {
    res.json({ reply: "Erreur chat-tech : " + e.message });
  }
});

// ==========================================================
// 🧭 Pages admin + static
// ==========================================================
[
  "admin-pp.html",
  "admin-alerts.html",
  "admin-chat.html",
  "admin-index.html",
  "admin-radar.html",
  "admin-local.html",
  "admin-news.html",
  "admin-users.html"
].forEach(p => app.get(`/${p}`, (_, res) => res.sendFile(path.join(__dirname, "public", p))));

app.use(express.static(path.join(__dirname, "public")));

// ==========================================================
// 🚀 Lancement
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`⚡ TINSFLASH PRO+++ en ligne sur port ${PORT}`));
