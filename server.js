// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.98 PRO+++ REAL FULL CONNECT)
// ==========================================================
// 100 % réel – IA J.E.A.N. – moteur complet + pages publiques Render-safe
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
// 🚀 INITIALISATION DES ZONES COUVERTES
// ==========================================================
import { initZones } from "./services/zonesCovered.js";
await initZones();

// ==========================================================
// 🧩 IMPORTS INTERNES
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
  isExtractionStopped,
  setLastExtraction,
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
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================================
// 🔐 STRIPE / JWT
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
// 👑 ADMIN AUTO
// ==========================================================
const ADMIN_EMAIL = "pynnaertpat@gmail.com";
const ADMIN_PWD = "202679";

async function seedAdminUser() {
  const exist = await User.findOne({ email: ADMIN_EMAIL });
  if (exist) return;
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
}
seedAdminUser();

// ==========================================================
// 🌍 RUNS PRINCIPAUX (avec enregistrement extraction)
// ==========================================================
const safeRun = (fn, label, meta = {}) => async (req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped())
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });

    await checkSourcesFreshness();
    const result = await fn();

    // 🧩 Enregistrer la dernière extraction
    await setLastExtraction({
      id: `${label}-${Date.now()}`,
      zones: [label],
      files: meta.files || [],
      status: "done",
    });

    const msg = `✅ Run ${label} terminé`;
    await addEngineLog(msg, "success", label);
    res.json({ success: true, result });
  } catch (e) {
    const msg = `❌ Erreur ${label}: ${e.message}`;
    await addEngineError(msg, label);
    res.status(500).json({ success: false, error: e.message });
  }
};

// ==========================================================
// 🌐 PAGES PUBLIQUES ET ADMIN (Render-safe)
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));

[
  "index.html", "jean.html", "admin-pp.html", "admin-alerts.html",
  "admin-chat.html", "admin-index.html", "admin-radar.html",
  "admin-local.html", "admin-news.html", "admin-users.html",
  "premium.html", "pro.html", "protest.html",
  "cockpit.html", "cockpit-pro.html", "cockpit-proplus.html",
  "cockpit-premium.html", "provincenamur.html"
].forEach((p) =>
  app.get(`/${p}`, (_, res) =>
    res.sendFile(path.join(__dirname, "public", p))
  )
);

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================================
// 🛰️ ROUTES API
// ==========================================================
app.post("/api/run-global-europe", safeRun(runGlobalEurope, "Europe", { files: ["./data/europe.json"] }));
app.post("/api/run-global-usa", safeRun(runGlobalUSA, "USA/Canada", { files: ["./data/usa.json"] }));
app.post("/api/run-afrique", safeRun(runAfrique, "Afrique", { files: ["./data/afrique.json"] }));
app.post("/api/run-asie", safeRun(runAsie, "Asie", { files: ["./data/asie.json"] }));
app.post("/api/run-oceanie", safeRun(runOceanie, "Océanie", { files: ["./data/oceanie.json"] }));
app.post("/api/run-ameriquesud", safeRun(runAmeriqueSud, "Amérique du Sud", { files: ["./data/ameriquesud.json"] }));
app.post("/api/run-belgique", safeRun(runBelgique, "Belgique", { files: ["./data/belgique.json"] }));
app.post("/api/run-bouke", safeRun(runBouke, "Bouké", { files: ["./data/bouke.json"] }));

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
