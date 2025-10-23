// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v4.0 PRO+++ REAL FULL CONNECT)
// ==========================================================

import dotenv from "dotenv";
dotenv.config(); // ✅ CHARGER .env AVANT TOUT

import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import fetch from "node-fetch";
import axios from "axios";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { EventEmitter } from "events";

import { checkReliability } from "./services/checkReliability.js";

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

import { runAIAnalysis } from "./services/aiAnalysis.js";        // Phase 2
import { runAIExternal } from "./services/runAIExternal.js";    // Phase 3
import { runAICompare } from "./services/runAICompare.js";      // Phase 4
import { generateVideoNamur } from "./services/generateVideoNamur.js"; // 🎬
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

import * as runFloreffeModule from "./services/runFloreffe.js";
const { runFloreffe } = runFloreffeModule;

import visionRoutes from "./routes/visionRoutes.js";
import { runVisionAlerts } from "./services/visionAlerts.js";
import { fetchVisionCaptures } from "./services/visionFetchers.js";
import { runVisionIA } from "./services/runVisionIA.js";
import { runWatchdog } from "./services/watchdogService.js";
import { askJean } from "./services/chatService.js";
import { runRadarFloreffe } from "./services/radarFloreffe.js";

// ==========================================================
// 🔌 MONGODB — version stable Mongoose (connexion unique)
// ==========================================================
async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      dbName: "tinsflash",
    });
    console.log("✅ MongoDB connecté avec succès (mongoose)");
    await initEngineState();
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err.message);
    setTimeout(connectMongo, 8000);
  }
}
if (process.env.MONGO_URI) connectMongo();

// Accès pratique aux collections mongoose
const col = (name) => mongoose.connection.collection(name);

// ==========================================================
// ⚙️ APP / HTTP / STATIC
// ==========================================================
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

// Routes Vision d’abord (elles répondent sous /api)
app.use("/api", visionRoutes);

const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));
app.get("/", (_, res) => res.sendFile(path.join(publicPath, "index.html")));
app.get("/admin-pp.html", (_, res) => res.sendFile(path.join(publicPath, "admin-pp.html")));
app.get("/admin-alerts.html", (_, res) => res.sendFile(path.join(publicPath, "admin-alerts.html")));

// ==========================================================
// ✅ Routes utilitaires
// ==========================================================
app.get("/api/runVisionAlerts", async (_req, res) => {
  const result = await runVisionAlerts();
  res.json(result);
});

app.get("/api/check-reliability", async (_req, res) => {
  try {
    const data = await checkReliability();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🔐 STRIPE / JWT (conservés)
// ==========================================================
const stripe = new Stripe(process.env.STRIPE_KEY);
const JWT_SECRET = process.env.SECRET_KEY || "tinsflash_secret_key";

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
// 🌐 HoloDôme – WebSocket Sync+
// ==========================================================
import { WebSocketServer } from "ws";
const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });
let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      clients.forEach((c) => { if (c !== ws && c.readyState === 1) c.send(JSON.stringify(data)); });
    } catch (err) {
      console.error("⚠️ WebSocket parse error:", err.message);
    }
  });
  ws.on("close", () => { clients = clients.filter((c) => c !== ws); });
});

server.on("upgrade", (req, socket, head) => {
  try {
    if (req.url === "/ws/hologram") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else {
      socket.destroy();
    }
  } catch {
    try { socket.destroy(); } catch {}
  }
});

// ==========================================================
// 🔁 EXTENSION — Radar & IA J.E.A.N. (broadcast automatique)
// ==========================================================
import fs from "fs";
import path from "path";

const RADAR_PATH = path.join(process.cwd(), "public", "floreffe_radar.json");
let lastRadarMTime = 0;

// 🔄 Vérifie toute les 60 s si le radar a changé et notifie les clients connectés
setInterval(() => {
  try {
    const stats = fs.statSync(RADAR_PATH);
    if (stats.mtimeMs > lastRadarMTime) {
      lastRadarMTime = stats.mtimeMs;
      const data = JSON.parse(fs.readFileSync(RADAR_PATH, "utf8"));
      const payload = JSON.stringify({
        type: "radar_update",
        data,
        timestamp: new Date().toISOString(),
      });
      console.log(`📡 Diffusion radar IA J.E.A.N. (${data?.fronts?.length ?? 0} fronts)`);
      clients.forEach((c) => {
        if (c.readyState === 1) c.send(payload);
      });
    }
  } catch (e) {
    console.warn("⚠️ Radar broadcast error:", e.message);
  }
}, 60000); // vérifie toutes les 60 secondes

// 🔔 Fonction optionnelle : envoi manuel d'un message IA
export function sendJeanMessage(text) {
  const msg = JSON.stringify({ type: "jean_message", text, time: new Date().toISOString() });
  clients.forEach((c) => { if (c.readyState === 1) c.send(msg); });
  console.log("🧠 IA J.E.A.N. message broadcast :", text);
}

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
      return res.status(400).json({ error: "Latitude et longitude obligatoires" });
    }

    const result = await generateForecast(lat, lon, country, region);

    // distance util
    const R = 6371e3, toRad = (v) => (v * Math.PI) / 180;
    const dist = (aLat, aLon, bLat, bLon) => {
      const φ1 = toRad(aLat), φ2 = toRad(bLat);
      const Δφ = toRad(bLat - aLat), Δλ = toRad(bLon - aLon);
      const s = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
      return 2 * R * Math.asin(Math.sqrt(s));
    };

    let best = null, bestD = Infinity;
    if (result?.forecast && Array.isArray(result.forecast)) {
      for (const p of result.forecast) {
        const d = dist(lat, lon, p.lat, p.lon);
        if (d < bestD) { best = p; bestD = d; }
      }
    }

    const r = typeof best?.reliability === "number" ? best.reliability : 0;
    const reliability_pct = r <= 1 ? Math.round(r * 100) : Math.round(r);

    res.json({
      lat, lon,
      nearestPoint: best ? {
        zone: best.zone, country: best.country, lat: best.lat, lon: best.lon, distance_m: Math.round(bestD)
      } : null,
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
// 🏛️ RUN FLOREFFE – Dôme local
// ==========================================================
app.post("/api/run-floreffe", async (_req, res) => {
  try {
    await addEngineLog("🏛️ Dôme Floreffe – Lancement du run complet (Phase 1→5)", "info", "Floreffe");
    const result = await runFloreffe("manual");
    await addEngineLog("✅ Dôme Floreffe – Run terminé avec succès", "success", "Floreffe");
    res.json({ success: true, result });
  } catch (e) {
    const msg = `❌ Erreur Run Floreffe : ${e.message}`;
    await addEngineError(msg, "Floreffe");
    res.status(500).json({ success: false, error: e.message });
  }
});
// ==========================================================
// 🌧️ RADAR CONTINENTAL FLOREFFE – réel
// ==========================================================
app.get("/api/radar/floreffe", runRadarFloreffe);

// ==========================================================
// 🧠 PHASES 2 à 5 (IA J.E.A.N.)
// ==========================================================
app.post("/api/runAIAnalysis", async (_req, res) => {
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

app.post("/api/runAIExternal", async (_req, res) => {
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

app.post("/api/runAICompare", async (_req, res) => {
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

app.post("/api/runWorldAlerts", async (_req, res) => {
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

app.get("/api/alerts-detected", async (_req, res) => {
  try {
    const data = await getDetectedAlerts(100);
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌍 Alertes (JSON pur)
// ==========================================================
app.get("/api/alerts", async (_req, res) => {
  try {
    const alerts = await Alert.find({});
    res.json(alerts || []);
  } catch (err) {
    console.error("Erreur /api/alerts :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================
// 🌦️ Dôme Floreffe — lecture prévisions/alertes
// ==========================================================
app.get("/api/forecast/floreffe", async (_req, res) => {
  try {
    // lecture générique si modèle Forecast absent
    const doc = await col("forecasts").findOne({ zone: /Floreffe/i });
    if (!doc) return res.json({ error: "Aucune donnée disponible pour Floreffe" });
    res.json(doc);
  } catch (e) {
    console.error("Erreur API forecast Floreffe:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/alerts/floreffe", async (_req, res) => {
  try {
    const alerts = await Alert.find({ zone: /Floreffe/i });
    res.json(alerts || []);
  } catch (e) {
    console.error("Erreur API alerts Floreffe :", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/alerts-vision", async (_req, res) => {
  try {
    const alerts = await Alert.find({ type: "vision" });
    res.json(alerts || []);
  } catch (err) {
    console.error("Erreur /api/alerts-vision :", err.message);
    res.status(500).json({ error: err.message });
  }
});

console.log("✅ Routes Floreffe actives : /api/forecast/floreffe & /api/alerts/floreffe");

// ==========================================================
// 🔭 Vision automatique (Phase 1B autonome) – désactivée planif
// ==========================================================
async function scheduleVisionFetch() {
  try { await fetchVisionCaptures(); }
  catch (err) { await addEngineError("Erreur Vision auto: " + err.message, "server"); }
}

async function scheduleDailyVisionIA() {
  try {
    await addEngineLog("🕓 Lancement quotidien automatique VisionIA", "info", "VISIONIA.AUTO");
    await runVisionIA();
    await addEngineLog("✅ VisionIA automatique terminée avec succès", "success", "VISIONIA.AUTO");
  } catch (err) {
    await addEngineError("❌ Erreur VisionIA auto : " + err.message, "VISIONIA.AUTO");
  }
}

// Planif désactivée volontairement
await addEngineLog("🕓 Planification VisionIA désactivée temporairement (manual only)", "server");

// ==========================================================
// 🤖 API J.E.A.N. — Dialogue pour le Dôme
// ==========================================================
app.get("/api/jean/analyse", async (req, res) => {
  const q = req.query.prompt || "";
  try {
    const reply = await askJean(q);
    res.send(reply);
  } catch (err) {
    res.status(500).send("❌ Erreur J.E.A.N. : " + err.message);
  }
});

// ==========================================================
// 🛰 Alias /api/vision/run — compatibilité Dôme 4D
// ==========================================================
app.get("/api/vision/run", async (_req, res) => {
  try {
    const result = await runVisionIA();
    res.send(`✅ VisionIA exécutée : ${JSON.stringify(result)}`);
  } catch (err) {
    res.status(500).send("❌ Erreur VisionIA : " + err.message);
  }
});

// ==========================================================
// 🌐 Endpoint de synchronisation multi-Render
// ==========================================================
app.post("/api/sync", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token !== process.env.SYNC_API_KEY) {
      return res.status(401).json({ error: "Accès non autorisé (clé invalide)" });
    }

    const { source, session, forecasts = [], alerts = [], timestamp } = req.body || {};
    if (!forecasts.length && !alerts.length) {
      return res.status(400).json({ error: "Aucune donnée fournie" });
    }

    const syncCol = col("sync_logs");
    await syncCol.insertOne({
      source,
      session,
      timestamp: new Date(timestamp || Date.now()),
      forecastsCount: forecasts.length,
      alertsCount: alerts.length,
      receivedAt: new Date(),
    });

    if (forecasts.length) {
      await col("forecasts").updateOne(
        { zone: source },
        { $set: { zone: source, data: forecasts, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    if (alerts.length) {
      await col("alerts").deleteMany({ zone: source });
      await col("alerts").insertMany(alerts.map((a) => ({ ...a, zone: source })));
    }

    console.log(`✅ Données reçues de ${source} (${forecasts.length} prévisions, ${alerts.length} alertes)`);
    res.status(200).json({ success: true, source, forecasts: forecasts.length, alerts: alerts.length });
  } catch (err) {
    console.error("❌ Erreur /api/sync :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================
// 🚀 LANCEMENT RENDER
// ==========================================================
const ENGINE_PORT = 10000;
const PORT = process.env.PORT || ENGINE_PORT;

server.listen(PORT, "0.0.0.0", () => {
  console.log("⚡ TINSFLASH PRO+++ moteur IA J.E.A.N. en ligne");
  console.log(`🌍 Zones couvertes : ${enumerateCoveredPoints().length}`);
  console.log(`🔌 Port réseau : ${PORT}`);
});
