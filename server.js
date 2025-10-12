// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.96 PRO+++ REAL FULL CONNECT)
// ==========================================================
// Moteur IA J.E.A.N. + Authentification + Accès PRO sécurisé + Runs régionaux & médias
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
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { EventEmitter } from "events";

// ==========================================================
// 🚀 INITIALISATION DES ZONES COUVERTES (avant tout run)
// ==========================================================
import { initZones } from "./services/zonesCovered.js";
await initZones(); // 🔥 prépare toutes les zones couvertes dès le boot

// ==========================================================
// 🧩 IMPORTS INTERNES (modules moteur)
// ==========================================================
import { runGlobal } from "./services/runGlobal.js";
import { runBouke } from "./services/runBouke.js";
import { runBelgique } from "./services/runBelgique.js";
import { runGlobalEurope } from "./services/runGlobalEurope.js";
import { runGlobalUSA } from "./services/runGlobalUSA.js";
import { runAfrique } from "./services/runGlobalAfrique.js";
import { runAsie } from "./services/runGlobalAsie.js";
import { runOceanie } from "./services/runGlobalOceanie.js";
import { runAmeriqueSud } from "./services/runGlobalAmeriqueSud.js";
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
import { checkAIHealth } from "./services/aiHealth.js";
import User from "./models/User.js";

// ==========================================================
// ⚙️ CONFIG ENV
// ==========================================================
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ==========================================================
// 🔐 CLÉS STRIPE / JWT ADAPTÉES RENDER
// ==========================================================
const stripe = new Stripe(process.env.STRIPE_KEY);
const JWT_SECRET = process.env.SECRET_KEY || "tinsflash_secret_key";

// ==========================================================
// 🔌 MONGODB
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
// 👑 ADMIN AUTO (PATRICK)
// ==========================================================
const ADMIN_EMAIL = "pynnaertpat@gmail.com";
const ADMIN_PWD = "202679";

async function seedAdminUser() {
  try {
    const exist = await User.findOne({ email: ADMIN_EMAIL });
    if (exist) {
      console.log("✅ Admin déjà présent :", ADMIN_EMAIL);
      return;
    }
    const hash = await bcrypt.hash(ADMIN_PWD, 10);
    const admin = new User({
      email: ADMIN_EMAIL,
      name: "Patrick Pynnaert",
      passwordHash: hash,
      plan: "pro",
      credits: 1000,
      fanClub: true,
      zone: "covered",
      createdAt: new Date(),
    });
    await admin.save();
    console.log("✅ Admin créé :", ADMIN_EMAIL);
  } catch (err) {
    console.error("❌ Erreur seed admin :", err.message);
  }
}
seedAdminUser();

// ==========================================================
// 🔐 MIDDLEWARE AUTH
// ==========================================================
async function verifySession(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Non authentifié." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user || user.sessionToken !== token) throw new Error("Session invalide ou expirée.");
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
}

// ==========================================================
// 🛰️ LOGS TEMPS RÉEL (SSE)
// ==========================================================
const logStream = new EventEmitter();
export async function addEngineLogStream(message) {
  logStream.emit("update", { time: new Date(), message });
}
app.get("/api/logs", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const send = (log) => res.write(`data: ${JSON.stringify(log)}\n\n`);
  logStream.on("update", send);
  req.on("close", () => logStream.off("update", send));
});

// ==========================================================
// 💬 CHAT IA J.E.A.N.
// ==========================================================
app.post("/api/chat-public", verifySession, async (req, res) => {
  try {
    const { question } = req.body;
    const reply = await chatService.askJean(question);
    res.json({ reply });
  } catch (e) {
    await addEngineError("Erreur chat-public: " + e.message, "chat");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🌍 RUNS PRINCIPAUX + MÉDIAS
// ==========================================================
const safeRun = (fn, label) => async (req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped())
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
    await checkSourcesFreshness();
    const result = await fn();
    const msg = `✅ Run ${label} terminé`;
    await addEngineLog(msg, "success", label);
    await addEngineLogStream(msg);
    res.json({ success: true, result });
  } catch (e) {
    const msg = `❌ Erreur ${label}: ${e.message}`;
    await addEngineError(msg, label);
    await addEngineLogStream(msg);
    res.status(500).json({ success: false, error: e.message });
  }
};

// 🌍 Zones principales
app.post("/api/run-global", safeRun(() => runGlobal("All"), "Global"));
app.post("/api/run-global-europe", safeRun(runGlobalEurope, "Europe"));
app.post("/api/run-global-usa", safeRun(runGlobalUSA, "USA/Canada"));
app.post("/api/run-afrique", safeRun(runAfrique, "Afrique"));
app.post("/api/run-asie", safeRun(runAsie, "Asie"));
app.post("/api/run-oceanie", safeRun(runOceanie, "Océanie"));
app.post("/api/run-ameriquesud", safeRun(runAmeriqueSud, "Amérique du Sud"));

// 🎥 Médias
app.post("/api/run-bouke", safeRun(runBouke, "Bouké (Province de Namur)"));
app.post("/api/run-belgique", safeRun(runBelgique, "Belgique complète"));

// ==========================================================
// 🔔 AUTRES ENDPOINTS
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find().sort({ start: -1 }).limit(200);
    res.json(alerts);
  } catch (e) {
    await addEngineError("Erreur /api/alerts: " + e.message, "alerts");
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/status", async (_, res) => {
  try {
    const s = await getEngineState();
    res.json({
      status: s?.checkup?.engineStatus || s?.status || "IDLE",
      lastRun: s?.lastRun || null,
      errors: s?.errors || [],
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      coveredZones: enumerateCoveredPoints(),
      uptime: process.uptime(),
    });
  } catch (e) {
    await addEngineError("Erreur /api/status: " + e.message, "core");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🔒 PAGES PUBLIQUES / ADMIN
// ==========================================================
[
  "admin-pp.html", "admin-alerts.html", "admin-chat.html",
  "admin-index.html", "admin-radar.html", "admin-local.html",
  "admin-news.html", "admin-users.html",
  "premium.html", "pro.html", "protest.html"
].forEach(p =>
  app.get(`/${p}`, (_, res) => res.sendFile(path.join(__dirname, "public", p)))
);

app.use(express.static(path.join(__dirname, "public")));

// ==========================================================
// 🚀 LANCEMENT RENDER
// ==========================================================
const ENGINE_PORT = 10000;
const PORT = process.env.PORT || ENGINE_PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ TINSFLASH PRO+++ moteur IA J.E.A.N. en ligne`);
  console.log(`🌍 Zones couvertes : ${enumerateCoveredPoints().length}`);
  console.log(`🔌 Ports : logique ${ENGINE_PORT} | réseau ${PORT}`);
});
