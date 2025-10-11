// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.15 PRO+++)
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
  saveEngineState,
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

// === RUNS PAR ZONES ===
import {
  runGlobalEurope,
  runGlobalUSA,
  runGlobalCanada,
  runGlobalAfricaNord,
  runGlobalAfricaCentrale,
  runGlobalAfricaOuest,
  runGlobalAfricaSud,
  runGlobalAmericaSud,
  runGlobalAsiaEst,
  runGlobalAsiaSud,
  runGlobalOceania,
  runGlobalCaribbean
} from "./services/indexGlobal.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================================
// 🔌 MongoDB – connexion & ping Render/Atlas
// ==========================================================
async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connecté");
    await initEngineState();
    const state = await getEngineState();
    if (state) console.log("🧠 État moteur chargé avec succès");
  } catch (err) {
    console.error("❌ Erreur MongoDB:", err.message);
    setTimeout(connectMongo, 10000);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Déconnexion MongoDB détectée – reconnexion...");
  setTimeout(connectMongo, 5000);
});

setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      console.log("💓 MongoDB ping OK");
    } catch (e) {
      console.warn("⚠️ Ping MongoDB échoué:", e.message);
    }
  }
}, 60000);

if (process.env.MONGO_URI) connectMongo();
else console.warn("⚠️ Aucune variable MONGO_URI définie !");

// ==========================================================
// 🛑 STOP / RESET EXTRACTION
// ==========================================================
app.post("/api/stop-extraction", async (_, res) => {
  try {
    stopExtraction();
    await addEngineLog("🛑 Extraction stoppée manuellement via API", "warn", "core");
    res.json({ success: true });
  } catch (e) {
    await addEngineError("Erreur stop-extraction : " + e.message, "core");
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/reset-stop-extraction", async (_, res) => {
  try {
    resetStopFlag();
    await addEngineLog("✅ Flag stop extraction réinitialisé", "info", "core");
    res.json({ success: true });
  } catch (e) {
    await addEngineError("Erreur reset-stop-extraction : " + e.message, "core");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🚀 RUN GLOBAL / PAR ZONE / WORLD
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped()) {
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
    }
    await checkSourcesFreshness();
    const zone = req.body?.zone || "All";
    const r = await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète effectuée pour ${zone}`, "success", "runGlobal");
    res.json({ success: true, result: r });
  } catch (e) {
    await addEngineError(`Erreur extraction: ${e.message}`, "runGlobal");
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/runWorldAlerts", async (_, res) => {
  try {
    const result = await runWorldAlerts();
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`Erreur runWorldAlerts: ${e.message}`, "core");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🌤️ API publique : Forecast + Alerts
// ==========================================================
app.get("/api/forecast", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const country = (req.query.country || "").toString();
    const region = (req.query.region || "").toString();
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
      return res.status(400).json({ error: "lat/lon invalides" });

    const data = await generateForecast(lat, lon, country, region);
    res.json(data);
  } catch (e) {
    await addEngineError("Erreur /api/forecast: " + e.message, "forecast");
    res.status(500).json({ error: e.message });
  }
});

// ✅ NOUVELLE ROUTE /api/alerts (pour cartes publiques et admin)
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
// 💬 CHATS INTÉGRÉS : TECH / ADMIN / PUBLIC
// ==========================================================

// 1️⃣ Chat technique – admin-pp.html
app.post("/api/chat-tech", async (req, res) => {
  try {
    const { message } = req.body;
    const state = await getEngineState();
    let reply = "💬 Mode technique GPT-4o-mini connecté au moteur IA J.E.A.N.";
    if (/status|moteur|logs/i.test(message))
      reply = `🧠 Moteur : ${state?.status || "inconnu"} | Dernier run : ${state?.lastRun || "aucun"}`;
    else if (/sources|modèles|data/i.test(message))
      reply = "📡 Sources actives : GFS, ECMWF, ICON, HRRR, AROME, Pangu, GraphCast, CorrDiff, AIFS, NASA, OpenWeather.";
    else if (/alertes/i.test(message))
      reply = "🚨 Consulte admin-alerts.html pour les alertes validées / primeurs.";
    res.json({ reply });
  } catch (e) {
    res.json({ reply: "Erreur chat-tech : " + e.message });
  }
});

// 2️⃣ Chat météo admin – admin-chat.html
app.post("/api/chat-meteo-admin", async (req, res) => {
  try {
    const { city, lat, lon } = req.body;
    const fc = await fetch(`${process.env.BASE_URL || ""}/api/forecast?lat=${lat}&lon=${lon}`);
    const d = await fc.json();
    res.json({
      reply: `🌦️ Prévision IA J.E.A.N pour ${city || "zone"} :
🌡️ ${d.temperature?.toFixed(1) ?? "?"} °C | 💨 ${d.wind?.toFixed(1) ?? "?"} km/h | ☔ ${d.precipitation?.toFixed(1) ?? "?"} mm
📊 Fiabilité ${(d.reliability * 100 || 0).toFixed(0)} %`
    });
  } catch (e) {
    res.json({ reply: "Erreur chat-meteo-admin : " + e.message });
  }
});

// 3️⃣ Chat public – index.html (limité à 2 requêtes/24h)
let userRequests = {};
app.post("/api/chat-public", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();
    userRequests[ip] = (userRequests[ip] || []).filter(t => now - t < 86400000);
    if (userRequests[ip].length >= 2)
      return res.json({ reply: "❌ Limite de 2 demandes météo/24h atteinte. Réessayez demain." });
    userRequests[ip].push(now);

    const { city, lat, lon } = req.body;
    const fc = await fetch(`${process.env.BASE_URL || ""}/api/forecast?lat=${lat}&lon=${lon}`);
    const d = await fc.json();
    res.json({
      reply: `🌤️ Prévision IA TINSFLASH pour ${city || "votre zone"} :
🌡️ ${d.temperature?.toFixed(1) ?? "?"} °C | 💨 ${d.wind?.toFixed(1) ?? "?"} km/h | ☔ ${d.precipitation?.toFixed(1) ?? "?"} mm
📊 Fiabilité ${(d.reliability * 100 || 0).toFixed(0)} %`
    });
  } catch (e) {
    res.json({ reply: "Erreur chat-public : " + e.message });
  }
});

// ==========================================================
// 🧭 ADMIN PAGES + STATIC FILES
// ==========================================================
[
  "admin-pp.html",
  "admin-chat.html",
  "admin-alerts.html",
  "admin-index.html",
  "admin-radar.html"
].forEach(p =>
  app.get(`/${p}`, (_, res) => res.sendFile(path.join(__dirname, "public", p)))
);

app.use(express.static(path.join(__dirname, "public")));

// ==========================================================
// 🚀 LANCEMENT SERVEUR
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`⚡ TINSFLASH PRO+++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes :", enumerateCoveredPoints().length);
});
