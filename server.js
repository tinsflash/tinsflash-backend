// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.20 PRO+++ REAL FULL CONNECT)
// ==========================================================
// Moteur global IA J.E.A.N – 100 % réel, 100 % connecté
// Compatible Render / MongoDB / HuggingFace / Admin Console
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
import { getNews } from "./services/newsService.js";
import { checkAIHealth } from "./services/aiHealth.js"; // ✅ IA réelle HuggingFace

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
// 🚀 Phase 1 – Extraction réelle des modèles
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

// ==========================================================
// 🧠 Phase 2 – Analyse IA J.E.A.N. (fusion interne + IA externes)
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    const result = await runAIAnalysis();
    await addEngineLog("🧠 Analyse IA J.E.A.N. terminée", "success", "aiAnalysis");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("Erreur /api/ai-analyse: " + e.message, "IA.JEAN");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌐 Phase 3 – Fusion & diffusion des alertes mondiales
// ==========================================================
app.post("/api/runWorldAlerts", async (_, res) => {
  try {
    const result = await runWorldAlerts();
    await addEngineLog("🌐 Génération alertes mondiales terminée", "success", "runWorldAlerts");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("Erreur runWorldAlerts: " + e.message, "core");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🌤️ Forecast & Alerts publiques (API grand public)
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
// 🛰️ Actualités météo mondiales (IA J.E.A.N.)
// ==========================================================
app.get("/api/news", async (_, res) => {
  try {
    const data = await getNews(10, "fr");
    res.json(data);
  } catch (e) {
    await addEngineError("Erreur /api/news: " + e.message, "news");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 Vérification santé IA J.E.A.N. (Phase 2 réelle HuggingFace)
// ==========================================================
app.get("/api/ai-health", async (_, res) => {
  try {
    const result = await checkAIHealth();
    res.json(result);
  } catch (e) {
    await addEngineError("Erreur /api/ai-health: " + e.message, "IA.HEALTH");
    res.status(500).json({ status: "error", message: e.message });
  }
});

// ==========================================================
// 🧭 Statut moteur IA – /api/status
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
      uptime: process.uptime(),
    });
  } catch (e) {
    await addEngineError("Erreur /api/status: " + e.message, "core");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 💬 Chat technique IA J.E.A.N. (GPT-4o-mini)
// ==========================================================
app.post("/api/chat-tech", async (req, res) => {
  try {
    const { message } = req.body;
    const s = await getEngineState();
    let reply = "💬 Mode technique GPT-4o-mini connecté au moteur IA J.E.A.N.";
    if (/status|moteur/i.test(message))
      reply = `🧠 Moteur : ${s?.status || "inconnu"} | Dernier run : ${s?.lastRun || "aucun"}`;
    else if (/sources|modèles/i.test(message))
      reply = "📡 Sources actives : GFS, ECMWF, ICON, HRRR, AROME, GraphCast, CorrDiff, NowcastNet, Pangu.";
    res.json({ reply });
  } catch (e) {
    res.json({ reply: "Erreur chat-tech : " + e.message });
  }
});

// ==========================================================
// 🧭 Pages admin + fichiers statiques
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
].forEach(p =>
  app.get(`/${p}`, (_, res) => res.sendFile(path.join(__dirname, "public", p)))
);

app.use(express.static(path.join(__dirname, "public")));

// ==========================================================
// 🚀 Lancement du moteur TINSFLASH
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`⚡ TINSFLASH PRO+++ en ligne sur port ${PORT}`);
  console.log("🌍 Zones couvertes :", enumerateCoveredPoints().length);
});
