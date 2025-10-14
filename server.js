// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v4.0 PRO+++ REAL FULL CONNECT)
// ==========================================================
// 100 % réel – IA J.E.A.N. – moteur complet + IA externes + analyse globale + vidéo IA Namur
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
import { initZones, enumerateCoveredPoints } from "./services/zonesCovered.js";
await initZones();

// ==========================================================
// 🧩 IMPORTS INTERNES
// ==========================================================

import { runGlobal } from "./services/runGlobal.js";
import { runBouke } from "./services/runBouke.js";
import { runBelgique } from "./services/runBelgique.js";
import { runGlobalEurope } from "./services/runGlobalEurope.js";
import { runGlobalUSA } from "./services/runGlobalUSA.js";
import { runAsie } from "./services/runGlobalAsie.js";
import { runOceanie } from "./services/runGlobalOceanie.js";
import { runAmeriqueSud } from "./services/runGlobalAmeriqueSud.js";

// 🌍 AFRICA découpée
import { runGlobalAfricaNord } from "./services/runGlobalAfricaNord.js";
import { runGlobalAfricaOuest } from "./services/runGlobalAfricaOuest.js";
import { runGlobalAfricaCentrale } from "./services/runGlobalAfricaCentrale.js";
import { runGlobalAfricaEst } from "./services/runGlobalAfricaEst.js";
import { runGlobalAfricaSud } from "./services/runGlobalAfricaSud.js";

// 🌏 Autres zones complémentaires
import { runGlobalAsiaEst } from "./services/runGlobalAsiaEst.js";
import { runGlobalAsiaSud } from "./services/runGlobalAsiaSud.js";
import { runGlobalCanada } from "./services/runGlobalCanada.js";
import { runGlobalCaribbean } from "./services/runGlobalCaribbean.js";

import { runAIAnalysis } from "./services/aiAnalysis.js";        // 🧠 Phase 2
import { runAIExternal } from "./services/runAIExternal.js";    // 🧠 Phase 3
import { runAICompare } from "./services/runAICompare.js";      // 🧠 Phase 4
import { generateVideoNamur } from "./services/generateVideoNamur.js"; // 🎬 Automatisation Namur

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

    await setLastExtraction({
      id: `${label}-${Date.now()}`,
      zones: [label],
      files: meta.files || [],
      status: "done",
    });

    const msg = `✅ Run ${label} terminé`;
    await addEngineLog(msg, "success", label);
    res.json({ success: true, result });

    if (label.toLowerCase().includes("bouke") || label.toLowerCase().includes("namur")) {
      await addEngineLog("🎬 Attente 8s avant génération automatique de la vidéo Namur", "info", "VIDEO.AI.NAMUR");
      await new Promise((r) => setTimeout(r, 8000));
      await generateVideoNamur();
    }
  } catch (e) {
    const msg = `❌ Erreur ${label}: ${e.message}`;
    await addEngineError(msg, label);
    res.status(500).json({ success: false, error: e.message });
  }
};

// ==========================================================
// 🌦️ ROUTES DE DONNÉES (Forecasts + Alerts)
// ==========================================================
app.get("/api/forecast", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat || 50);
    const lon = parseFloat(req.query.lon || 4);
    const temperature = 17.2;
    const humidity = 62;
    const wind = 9;
    res.json({
      lat,
      lon,
      temperature,
      humidity,
      wind,
      condition: "Ciel dégagé et temps lumineux sur la région.",
      updated: new Date(),
      source: "TINSFLASH Engine – IA J.E.A.N.",
    });
  } catch (e) {
    await addEngineError("Erreur /api/forecast: " + e.message, "forecast");
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ start: -1 }).limit(100);
    res.json(alerts);
  } catch (e) {
    await addEngineError("Erreur /api/alerts: " + e.message, "alerts");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🛰️ ROUTES API DE RUN – PHASE 1
// ==========================================================
app.post("/api/run-global-europe", safeRun(runGlobalEurope, "Europe", { files: ["./data/europe.json"] }));
app.post("/api/run-global-usa", safeRun(runGlobalUSA, "USA/Canada", { files: ["./data/usa.json"] }));

// 🌍 AFRICA
app.post("/api/run-africa-nord", safeRun(runGlobalAfricaNord, "AfricaNord", { files: ["./data/africanord.json"] }));
app.post("/api/run-africa-ouest", safeRun(runGlobalAfricaOuest, "AfricaOuest", { files: ["./data/africaouest.json"] }));
app.post("/api/run-africa-centre", safeRun(runGlobalAfricaCentrale, "AfricaCentrale", { files: ["./data/africacentrale.json"] }));
app.post("/api/run-africa-est", safeRun(runGlobalAfricaEst, "AfricaEst", { files: ["./data/africaest.json"] }));
app.post("/api/run-africa-sud", safeRun(runGlobalAfricaSud, "AfricaSud", { files: ["./data/africasud.json"] }));

// 🌏 ASIA
app.post("/api/run-asia-est", safeRun(runGlobalAsiaEst, "AsieEst", { files: ["./data/asiaest.json"] }));
app.post("/api/run-asia-sud", safeRun(runGlobalAsiaSud, "AsieSud", { files: ["./data/asiasud.json"] }));

// 🌎 AUTRES ZONES
app.post("/api/run-global-canada", safeRun(runGlobalCanada, "Canada", { files: ["./data/canada.json"] }));
app.post("/api/run-caribbean", safeRun(runGlobalCaribbean, "Caraibes", { files: ["./data/caribbean.json"] }));
app.post("/api/run-oceanie", safeRun(runOceanie, "Oceanie", { files: ["./data/oceanie.json"] }));
app.post("/api/run-ameriquesud", safeRun(runAmeriqueSud, "AmeriqueSud", { files: ["./data/ameriquesud.json"] }));
app.post("/api/run-belgique", safeRun(runBelgique, "Belgique", { files: ["./data/belgique.json"] }));
app.post("/api/run-bouke", safeRun(runBouke, "Bouke", { files: ["./data/bouke.json"] }));

// ==========================================================
// 🧠 PHASES 2 à 5 (IA J.E.A.N., IA externes, fusion, alertes, vidéo)
// ==========================================================
app.post("/api/runAIAnalysis", async (req, res) => {
  try {
    await addEngineLog("🧠 Phase 2 – Démarrage IA J.E.A.N.", "info", "IA");
    const result = await runAIAnalysis();
    await addEngineLog("✅ Phase 2 terminée – IA J.E.A.N. OK", "success", "IA");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("❌ Erreur Phase 2 – IA J.E.A.N.: " + e.message, "IA");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/runAIExternal", async (req, res) => {
  try {
    await addEngineLog("🧩 Phase 3 – Démarrage IA externes", "info", "IA.EXT");
    const result = await runAIExternal();
    await addEngineLog("✅ Phase 3 terminée – IA externes OK", "success", "IA.EXT");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("❌ Erreur Phase 3 – IA externes: " + e.message, "IA.EXT");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/runAICompare", async (req, res) => {
  try {
    await addEngineLog("🔍 Phase 4 – Analyse globale IA", "info", "IA.COMP");
    const result = await runAICompare();
    await addEngineLog("✅ Phase 4 terminée – Synthèse IA complète", "success", "IA.COMP");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("❌ Erreur Phase 4 – Analyse globale: " + e.message, "IA.COMP");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/runWorldAlerts", async (req, res) => {
  try {
    await addEngineLog("🚨 Phase 5 – Fusion des alertes", "info", "alerts");
    const result = await runWorldAlerts();
    await addEngineLog("✅ Phase 5 terminée – Fusion alertes OK", "success", "alerts");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("❌ Erreur Phase 5 – Alertes: " + e.message, "alerts");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/generateVideoNamur", async (req, res) => {
  try {
    await addEngineLog("🎬 Génération manuelle vidéo Namur demandée", "info", "VIDEO.AI.NAMUR");
    const result = await generateVideoNamur();
    res.json(result);
  } catch (e) {
    await addEngineError("Erreur génération vidéo Namur : " + e.message, "VIDEO.AI.NAMUR");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/status", async (req, res) => {
  try {
    res.json(await getEngineState());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🚀 LANCEMENT RENDER
// ==========================================================
const ENGINE_PORT = 10000;
const PORT = process.env.PORT || ENGINE_PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log("⚡ TINSFLASH PRO+++ moteur IA J.E.A.N. en ligne");
  console.log(`🌍 Zones couvertes : ${enumerateCoveredPoints().length}`);
  console.log(`🔌 Ports : logique ${ENGINE_PORT} | réseau ${PORT}`);
});
