// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.40 PRO+++ REAL FULL CONNECT)
// ==========================================================
// Moteur IA J.E.A.N. + Authentification + Accès PRO sécurisé
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

// ==========================================================
// 🧩 Imports internes
// ==========================================================
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
import { checkAIHealth } from "./services/aiHealth.js";
import User from "./models/User.js";

// ==========================================================
// ⚙️ CONFIGURATION ENVIRONNEMENT
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
// 🔐 Clés Stripe / JWT adaptées Render
// ==========================================================
const stripe = new Stripe(process.env.STRIPE_KEY);
const JWT_SECRET = process.env.SECRET_KEY || "tinsflash_secret_key";

// ==========================================================
// 🔌 Connexion MongoDB
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
// 👑 Seed Admin User (Patrick) – accès pro direct
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
// 🔐 Middleware Auth
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
// 💬 CHAT PUBLIC IA J.E.A.N.
// ==========================================================
app.post("/api/chat-public", verifySession, async (req, res) => {
  try {
    const { question } = req.body;
    const user = req.user;
    const today = new Date().toISOString().slice(0, 10);
    user.dailyQuestions = user.dailyQuestions || {};
    const todayCount = user.dailyQuestions[today] || 0;

    if (user.plan === "pro" || user.plan === "pro+") {
      // accès illimité
    } else if (user.plan === "premium") {
      if (todayCount >= 2)
        return res.status(403).json({
          error:
            "Limite Premium atteinte (2 questions/jour). Passez Pro : https://buy.stripe.com/dRm4gBeBX9h782p74Bgfu01",
        });
    } else {
      if (user.credits <= 0)
        return res.status(403).json({
          error:
            "Aucun crédit IA disponible. Achetez 100 crédits : https://buy.stripe.com/00w28t3Xj9h70zX0Gdgfu02",
        });
    }

    const reply = await chatService.askJean(question);
    if (user.plan === "premium") user.dailyQuestions[today] = todayCount + 1;
    else if (user.plan === "free") user.credits -= 1;
    await user.save();
    res.json({ reply });
  } catch (e) {
    await addEngineError("Erreur chat-public: " + e.message, "chat");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 💳 STRIPE WEBHOOK
// ==========================================================
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_email;
      if (!email) return res.json({ received: true });
      const user = await User.findOne({ email });
      if (!user) return res.json({ received: true });
      const url = session.success_url || "";
      if (url.includes("00w28t3Xj9h70zX0Gdgfu02")) user.credits += 100;
      else if (url.includes("cNiaEZgK5bpffuRex3gfu00")) user.plan = "premium";
      else if (url.includes("dRm4gBeBX9h782p74Bgfu01")) user.plan = "pro";
      await user.save();
    }
    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook Stripe:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ==========================================================
// 🌍 API Forecast / Alerts / News / Health / Status
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

app.get("/api/news", async (_, res) => {
  try {
    const data = await getNews(10, "fr");
    res.json(data);
  } catch (e) {
    await addEngineError("Erreur /api/news: " + e.message, "news");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/ai-health", async (_, res) => {
  try {
    const result = await checkAIHealth();
    res.json(result);
  } catch (e) {
    await addEngineError("Erreur /api/ai-health: " + e.message, "IA.HEALTH");
    res.status(500).json({ status: "error", message: e.message });
  }
});

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
// 🔒 Accès pages Pro / Premium
// ==========================================================
app.get("/pro.html", verifySession, async (req, res) => {
  try {
    const user = req.user;
    if (!["pro", "pro+"].includes(user.plan))
      return res.status(403).send("⛔ Accès réservé aux abonnés Pro / Pro+.");
    res.sendFile(path.join(__dirname, "public", "pro.html"));
  } catch (e) {
    await addEngineError("Erreur /pro.html : " + e.message, "auth");
    res.status(500).send("Erreur serveur.");
  }
});

// ==========================================================
// 🧭 Fichiers publics / admin
// ==========================================================
[
  "admin-pp.html", "admin-alerts.html", "admin-chat.html",
  "admin-index.html", "admin-radar.html", "admin-local.html",
  "admin-news.html", "admin-users.html",
  "premium.html", "pro.html", "protest.html"
].forEach(p => app.get(`/${p}`, (_, res) =>
  res.sendFile(path.join(__dirname, "public", p))
));
app.use(express.static(path.join(__dirname, "public")));

// ==========================================================
// 🚀 Lancement du moteur TINSFLASH
// ==========================================================
const ENGINE_PORT = 10000;
const PORT = process.env.PORT || ENGINE_PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ TINSFLASH PRO+++ en ligne`);
  console.log(`🌍 Zones couvertes : ${enumerateCoveredPoints().length}`);
  console.log(`🔌 Ports : logique ${ENGINE_PORT} | réseau ${PORT}`);
});
