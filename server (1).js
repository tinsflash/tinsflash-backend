// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v4.0 PRO+++ REAL FULL CONNECT – ZONES REGROUPÉES)
// ==========================================================
// 100 % réel – IA J.E.A.N. – moteur complet + IA externes + analyse globale + vidéo IA Namur + alertDetectedLogger Mongo
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
import { checkReliability } from "./services/checkReliability.js"; // ✅ ajouté précédemment

// ==========================================================
// 🚀 INITIALISATION DES ZONES COUVERTES
// ==========================================================
import { initZones, enumerateCoveredPoints } from "./services/zonesCovered.js";
await initZones();

// ==========================================================
// 🧩 IMPORTS INTERNES – ZONES REGROUPÉES
// ==========================================================
import { runGlobalEurope } from "./services/runGlobalEurope.js";
import { runGlobalUSA } from "./services/runGlobalUSA.js";
import { runGlobalAfrique } from "./services/runGlobalAfrique.js";
import { runGlobalAsie } from "./services/runGlobalAsie.js";
import { runGlobalAmeriqueSud } from "./services/runGlobalAmeriqueSud.js";
import { runGlobalOceanie } from "./services/runGlobalOceanie.js";
import { runGlobalCanada } from "./services/runGlobalCanada.js";
import { runGlobalCaribbean } from "./services/runGlobalCaribbean.js";
import { runBouke } from "./services/runBouke.js";
import { runBelgique } from "./services/runBelgique.js";

import { runAIAnalysis } from "./services/aiAnalysis.js";        // 🧠 Phase 2
import { runAIExternal } from "./services/runAIExternal.js";    // 🧠 Phase 3
import { runAICompare } from "./services/runAICompare.js";      // 🧠 Phase 4
import { generateVideoNamur } from "./services/generateVideoNamur.js"; // 🎬 Automatisation Namur
import { runWorldAlerts } from "./services/runWorldAlerts.js";
import { runPhase5 } from "./services/aiphase5.js";
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
import { getDetectedAlerts } from "./services/alertDetectedLogger.js";
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
// ✅ Nouvelle route : Vérifier la fiabilité IA J.E.A.N.
// ==========================================================
app.get("/api/check-reliability", async (_, res) => {
  try {
    const data = await checkReliability();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
// 🌦️ ROUTE API FORECAST – IA J.E.A.N.
// ==========================================================
app.get("/api/forecast", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const country = req.query.country || "Unknown";
    const region = req.query.region || "GENERIC";

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: "Latitude et longitude obligatoires"
      });
    }

    // --- Appel du moteur IA ---
    const result = await generateForecast(lat, lon, country, region);

    // --- Fonction distance locale ---
    const R = 6371e3;
    const toRad = (v) => (v * Math.PI) / 180;
    const dist = (aLat, aLon, bLat, bLon) => {
      const φ1 = toRad(aLat),
        φ2 = toRad(bLat);
      const Δφ = toRad(bLat - aLat);
      const Δλ = toRad(bLon - aLon);
      const s =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(s));
    };

    // --- Recherche du point le plus proche (si les données existent) ---
    let best = null;
    let bestD = Infinity;
    if (result && result.forecast && Array.isArray(result.forecast)) {
      const latest = result.forecast;
      best = latest[0];
      bestD = dist(lat, lon, best.lat, best.lon);
      for (let i = 1; i < latest.length; i++) {
        const d = dist(lat, lon, latest[i].lat, latest[i].lon);
        if (d < bestD) {
          best = latest[i];
          bestD = d;
        }
      }
    }

    // --- Calcul fiabilité ---
    const r = typeof best?.reliability === "number" ? best.reliability : 0;
    const reliability_pct = r <= 1 ? Math.round(r * 100) : Math.round(r);

    // --- Réponse JSON ---
    res.json({
      lat,
      lon,
      nearestPoint: best
        ? {
            zone: best.zone,
            country: best.country,
            lat: best.lat,
            lon: best.lon,
            distance_m: Math.round(bestD),
          }
        : null,
      temperature: best?.temperature ?? null,
      temperature_min: best?.temperature_min ?? null,
      temperature_max: best?.temperature_max ?? null,
      humidity: best?.humidity ?? null,
      wind: best?.wind ?? null,
      precipitation: best?.precipitation ?? null,
      sources: best?.sources ?? [],
      localAdjust: best?.localAdjust ?? null,
      condition: undefined,
      updated: best?.timestamp || new Date(),
      source: "TINSFLASH Engine – IA J.E.A.N. (forecasts_ai_points)",
      reliability: r,
      reliability_pct,
      forecast: result.forecast,
      nextDays: result.localDaily,
      national: result.nationalDaily,
      alerts: result.alerts,
    });
  } catch (e) {
    await addEngineError("Erreur /api/forecast (IA): " + e.message, "forecast");
    res.status(500).json({ error: e.message });
  }
});
// ==========================================================
// ==========================================================
// 🛰️ ROUTES API DE RUN – PHASE 1 (ZONES REGROUPÉES)
// ==========================================================
app.post("/api/run-global-europe", safeRun(runGlobalEurope, "Europe"));
app.post("/api/run-global-usa", safeRun(runGlobalUSA, "USA"));
app.post("/api/run-global-afrique", safeRun(runGlobalAfrique, "Afrique"));
app.post("/api/run-global-asie", safeRun(runGlobalAsie, "Asie"));
app.post("/api/run-global-ameriquesud", safeRun(runGlobalAmeriqueSud, "AmériqueSud"));
app.post("/api/run-global-oceanie", safeRun(runGlobalOceanie, "Océanie"));
app.post("/api/run-global-canada", safeRun(runGlobalCanada, "Canada"));
app.post("/api/run-global-caribbean", safeRun(runGlobalCaribbean, "Caraïbes"));
app.post("/api/run-belgique", safeRun(runBelgique, "Belgique"));
app.post("/api/run-bouke", safeRun(runBouke, "Bouke"));

// ==========================================================
// 🧠 PHASES 2 à 5 (IA J.E.A.N.)
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

app.post("/api/runPhase5", async (_req, res) => {
  try {
    await addEngineLog("🚨 Phase 5 – Démarrage IA aiphase5", "info", "IA.PHASE5");
    const r = await runPhase5();
    await addEngineLog("✅ Phase 5 terminée – IA aiphase5 OK", "success", "IA.PHASE5");
    res.json(r);
  } catch (e) {
    await addEngineError("❌ Erreur Phase 5 – IA aiphase5 : " + e.message, "IA.PHASE5");
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/alerts-detected", async (req, res) => {
  try {
    const data = await getDetectedAlerts(100);
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});



// ==========================================================
// 🌍 TINSFLASH – Route de consultation des alertes (JSON pur)
// ==========================================================
import { MongoClient } from "mongodb";

app.get("/api/alerts", async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const alerts = await db.collection("alerts").find({}).toArray();
    await client.close();
    res.json(alerts || []);
  } catch (err) {
    console.error("Erreur /api/alerts:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================
// 🌦️ ROUTES API - Dôme de protection Floreffe (réel et connecté)
// ==========================================================

app.get("/api/forecast/floreffe", async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const data = await db.collection("forecasts").findOne({ zone: "Floreffe" });
    await client.close();

    if (!data) {
      return res.json({ error: "Aucune donnée disponible pour Floreffe" });
    }

    res.json(data);
  } catch (e) {
    console.error("Erreur API forecast Floreffe:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/alerts/floreffe", async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const alerts = await db
      .collection("alerts")
      .find({ zone: /Floreffe/i })
      .toArray();
    await client.close();

    res.json(alerts || []);
  } catch (e) {
    console.error("Erreur API alerts Floreffe:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🛰️ Log de confirmation au démarrage
console.log("✅ Routes TINSFLASH Floreffe actives : /api/forecast/floreffe & /api/alerts/floreffe");

// ==========================================================
// 🔭 TINSFLASH – Vision automatique (Phase 1B autonome)
// ==========================================================
// Télécharge les images satellites toutes les 30 minutes,
// sans déclencher l’analyse IA. L’IA les exploitera
// automatiquement lors des runs (Phase 2).
// ==========================================================

import { fetchVisionCaptures } from "./services/visionFetchers.js";

async function scheduleVisionFetch() {
  try {
    await fetchVisionCaptures();
  } catch (err) {
    await addEngineError("Erreur Vision auto: " + err.message, "server");
  }
}

// Démarrage immédiat au boot
scheduleVisionFetch();

// Relance toutes les 30 minutes (1 800 000 ms)
setInterval(scheduleVisionFetch, 30 * 60 * 1000);

await addEngineLog("✅ Planification VisionIA active (30 min)", "server");
// ==========================================================
// 🌐 SERVEURS DE FICHIERS STATIQUES (pages publiques & admin)
// ==========================================================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));
app.get("/", (_, res) => res.sendFile(path.join(publicPath, "index.html")));
app.get("/admin-pp.html", (_, res) => res.sendFile(path.join(publicPath, "admin-pp.html")));
app.get("/admin-alerts.html", (_, res) => res.sendFile(path.join(publicPath, "admin-alerts.html")));

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
