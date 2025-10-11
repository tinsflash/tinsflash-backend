// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.14 PRO+++)
// ==========================================================
// Moteur global IA J.E.A.N – 100 % réel, 100 % connecté
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

import {
  runGlobalEurope, runGlobalUSA, runGlobalCanada,
  runGlobalAfricaNord, runGlobalAfricaCentrale,
  runGlobalAfricaOuest, runGlobalAfricaSud,
  runGlobalAmericaSud, runGlobalAsiaEst,
  runGlobalAsiaSud, runGlobalOceania, runGlobalCaribbean
} from "./services/indexGlobal.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));

// ==========================================================
// 🔌 MongoDB
// ==========================================================
async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, connectTimeoutMS: 20000, socketTimeoutMS: 45000
    });
    console.log("✅ MongoDB connecté");
    await initEngineState();
  } catch (err) {
    console.error("❌ Erreur MongoDB:", err.message);
    setTimeout(connectMongo, 10000);
  }
}
if (process.env.MONGO_URI) connectMongo();

// ==========================================================
// 🛑 STOP / RESET EXTRACTION
// ==========================================================
app.post("/api/stop-extraction", async (req, res) => {
  try {
    stopExtraction();
    await addEngineLog("🛑 Extraction stoppée manuellement via API", "warn", "core");
    res.json({ success: true });
  } catch (e) { await addEngineError(e.message, "core"); res.status(500).json({ success: false, error: e.message }); }
});
app.post("/api/reset-stop-extraction", async (req, res) => {
  try {
    resetStopFlag();
    await addEngineLog("✅ Flag reset", "info", "core");
    res.json({ success: true });
  } catch (e) { await addEngineError(e.message, "core"); res.status(500).json({ success: false, error: e.message }); }
});

// ==========================================================
// 🚀 RUNS PAR ZONES + IA ANALYSE
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped()) return res.status(400).json({ error: "Extraction stoppée" });
    await checkSourcesFreshness();
    const zone = req.body?.zone || "All";
    const r = await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète ${zone}`, "success", "runGlobal");
    res.json({ success: true, result: r });
  } catch (e) { await addEngineError(e.message, "runGlobal"); res.status(500).json({ error: e.message }); }
});

app.post("/api/ai-analyse", async (_, res) => {
  try {
    await addEngineLog("🧠 Lancement IA J.E.A.N.", "info", "IA.JEAN");
    const result = await runAIAnalysis();
    await addEngineLog("✅ IA J.E.A.N terminée", "success", "IA.JEAN");
    res.json({ success: true, result });
  } catch (e) { await addEngineError(e.message, "IA.JEAN"); res.status(500).json({ error: e.message }); }
});

// ==========================================================
// 🌤️ FORECAST PUBLIC
// ==========================================================
app.get("/api/forecast", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const country = (req.query.country || "").toString();
    const region = (req.query.region || "").toString();
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).json({ error: "lat/lon invalides" });
    const data = await generateForecast(lat, lon, country, region);
    return res.json(data);
  } catch (e) { await addEngineError(e.message, "forecast"); res.status(500).json({ error: e.message }); }
});

// ==========================================================
// 🌎 WORLD ALERTS + STATUS
// ==========================================================
app.post("/api/runWorldAlerts", async (_, res) => {
  try { const result = await runWorldAlerts(); res.json({ success: true, result }); }
  catch (e) { await addEngineError(e.message, "core"); res.status(500).json({ error: e.message }); }
});
app.get("/api/status", async (_, res) => {
  try { const s = await getEngineState(); res.json({ status: s?.status || "IDLE", lastRun: s?.lastRun }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================================
// 💬 CHATS INTÉGRÉS
// ==========================================================

// --- Chat technique (admin-pp.html)
app.post("/api/chat-tech", async (req, res) => {
  try {
    const { message } = req.body;
    const state = await getEngineState();
    let reply = "💬 Mode technique GPT-4o-mini connecté au moteur.";
    if (/status|moteur|logs/i.test(message))
      reply = `🧠 Moteur : ${state?.status || "inconnu"} | Dernier run : ${state?.lastRun || "aucun"}`;
    else if (/sources|modèles|data/i.test(message))
      reply = "📡 Sources : GFS, ECMWF, ICON, HRRR, AROME, Pangu, GraphCast, CorrDiff, AIFS, NASA, OpenWeather.";
    else if (/alertes/i.test(message))
      reply = "🚨 Vérifie admin-alerts.html pour visualiser les alertes fusionnées du moteur IA.";
    res.json({ reply });
  } catch (e) { res.json({ reply: "Erreur chat-tech : " + e.message }); }
});

// --- Chat météo admin (admin-chat.html)
app.post("/api/chat-meteo-admin", async (req, res) => {
  try {
    const { city, lat, lon } = req.body;
    const fc = await fetch(`${process.env.BASE_URL || ""}/api/forecast?lat=${lat}&lon=${lon}`);
    const d = await fc.json();
    res.json({
      reply: `🌦️ Prévision IA J.E.A.N pour ${city || "zone sélectionnée"} :
🌡️ Température : ${d.temperature?.toFixed(1) ?? "?"} °C
💨 Vent : ${d.wind?.toFixed(1) ?? "?"} km/h
☔ Précipitation : ${d.precipitation?.toFixed(1) ?? "?"} mm
📊 Fiabilité : ${(d.reliability * 100 || 0).toFixed(0)} %`
    });
  } catch (e) { res.json({ reply: "Erreur chat-meteo-admin : " + e.message }); }
});

// --- Chat public limité (index.html)
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
🌡️ ${d.temperature?.toFixed(1) ?? "?"} °C
💨 ${d.wind?.toFixed(1) ?? "?"} km/h
☔ ${d.precipitation?.toFixed(1) ?? "?"} mm
📊 Fiabilité ${(d.reliability * 100 || 0).toFixed(0)} %`
    });
  } catch (e) { res.json({ reply: "Erreur chat-public : " + e.message }); }
});

// ==========================================================
// 🧭 STATIC FILES
// ==========================================================
["admin-pp.html","admin-chat.html","admin-alerts.html","admin-index.html"].forEach((p) =>
  app.get(`/${p}`, (_, res) => res.sendFile(path.join(__dirname, "public", p)))
);
app.use(express.static(path.join(__dirname, "public")));

// ==========================================================
// 🚀 START
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => console.log(`⚡ TINSFLASH PRO+++ prêt sur port ${PORT}`));
