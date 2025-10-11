// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.9 PRO+++)
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
  isExtractionStopped,
} from "./services/engineState.js";

import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import { runWorldAlerts } from "./services/runWorldAlerts.js";
import Alert from "./models/Alert.js";
import * as chatService from "./services/chatService.js";
import { generateForecast } from "./services/forecastService.js";

// === RUNS PAR ZONES ===
import { runGlobalEurope } from "./services/runGlobalEurope.js";
import { runGlobalUSA } from "./services/runGlobalUSA.js";
import { runGlobalCanada } from "./services/runGlobalCanada.js";
import { runGlobalAfricaNord } from "./services/runGlobalAfricaNord.js";
import { runGlobalAfricaCentrale } from "./services/runGlobalAfricaCentrale.js";
import { runGlobalAfricaOuest } from "./services/runGlobalAfricaOuest.js";
import { runGlobalAfricaSud } from "./services/runGlobalAfricaSud.js";
import { runGlobalAmericaSud } from "./services/runGlobalAmericaSud.js";
import { runGlobalAsiaEst } from "./services/runGlobalAsiaEst.js";
import { runGlobalAsiaSud } from "./services/runGlobalAsiaSud.js";
import { runGlobalOceania } from "./services/runGlobalOceania.js";
import { runGlobalCaribbean } from "./services/runGlobalCaribbean.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());

// ==========================================================
// 🌐 CORS
// ==========================================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================================
// 🧠 Séparation des flux IA (GPT-5 moteur / GPT-4o-mini console)
// ==========================================================
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api/ai-analyse") ||
    req.path.startsWith("/api/run-global") ||
    req.path.startsWith("/api/runGlobal")
  ) {
    req.headers["X-IA-Engine"] = "ChatGPT-5";
  } else if (
    req.path.startsWith("/api/ai-admin") ||
    req.path.startsWith("/api/ai-user") ||
    req.path.startsWith("/api/chat")
  ) {
    req.headers["X-IA-Engine"] = "GPT-4o-mini";
  }
  next();
});

// ==========================================================
// 🔌 MongoDB – Connexion stabilisée Render + Atlas Paris + auto-ping
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
    if (state) console.log("🧠 État moteur chargé avec succès.");
  } catch (err) {
    console.error("❌ Erreur MongoDB:", err.message);
    setTimeout(connectMongo, 10000);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Déconnexion MongoDB détectée – reconnexion automatique...");
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
app.post("/api/stop-extraction", async (req, res) => {
  try {
    stopExtraction();
    await addEngineLog("🛑 Extraction stoppée manuellement via API", "warn", "core");
    res.json({ success: true, message: "Extraction stoppée" });
  } catch (e) {
    await addEngineError("Erreur stop-extraction : " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/reset-stop-extraction", async (req, res) => {
  try {
    resetStopFlag();
    await addEngineLog("✅ Flag stop extraction réinitialisé", "info", "core");
    res.json({ success: true });
  } catch (e) {
    await addEngineError("Erreur reset-stop-extraction : " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🚀 RUN GLOBAL & PAR ZONES
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped()) {
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
    }
    await checkSourcesFreshness();
    const zone = req.body?.zone || "All";
    await addEngineLog(`🚀 Lancement extraction ${zone}`, "info", "runGlobal");
    const r = await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète effectuée pour ${zone}`, "success", "runGlobal");
    res.json({ success: true, result: r });
  } catch (e) {
    await addEngineError(`Erreur extraction: ${e.message}`, "runGlobal");
    res.status(500).json({ success: false, error: e.message });
  }
});

const zoneRoutes = [
  { route: "/api/runGlobalEurope", fn: runGlobalEurope, label: "Europe" },
  { route: "/api/runGlobalUSA", fn: runGlobalUSA, label: "USA" },
  { route: "/api/runGlobalCanada", fn: runGlobalCanada, label: "Canada" },
  { route: "/api/runGlobalAfricaNord", fn: runGlobalAfricaNord, label: "Afrique du Nord" },
  { route: "/api/runGlobalAfricaCentrale", fn: runGlobalAfricaCentrale, label: "Afrique Centrale" },
  { route: "/api/runGlobalAfricaOuest", fn: runGlobalAfricaOuest, label: "Afrique de l’Ouest" },
  { route: "/api/runGlobalAfricaSud", fn: runGlobalAfricaSud, label: "Afrique du Sud" },
  { route: "/api/runGlobalAmericaSud", fn: runGlobalAmericaSud, label: "Amérique du Sud" },
  { route: "/api/runGlobalAsiaEst", fn: runGlobalAsiaEst, label: "Asie Est" },
  { route: "/api/runGlobalAsiaSud", fn: runGlobalAsiaSud, label: "Asie Sud" },
  { route: "/api/runGlobalOceania", fn: runGlobalOceania, label: "Océanie" },
  { route: "/api/runGlobalCaribbean", fn: runGlobalCaribbean, label: "Caraïbes" },
];

zoneRoutes.forEach(({ route, fn, label }) => {
  app.post(route, async (_, res) => {
    try {
      if (isExtractionStopped && isExtractionStopped()) {
        return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
      }
      await addEngineLog(`🚀 Lancement extraction ${label}`, "info", "runGlobal");
      const result = await fn();
      const state = await getEngineState();
      state.lastRun = new Date();
      await saveEngineState(state);
      await addEngineLog(`✅ Extraction ${label} terminée avec succès`, "success", "runGlobal");
      res.json({ success: true, result });
    } catch (e) {
      await addEngineError(`Erreur extraction ${label}: ${e.message}`, "runGlobal");
      res.status(500).json({ success: false, error: e.message });
    }
  });
});

// ==========================================================
// 🧠 ANALYSE IA J.E.A.N. (GPT-5)
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    await addEngineLog("🧠 IA J.E.A.N. (GPT-5) – Analyse en cours...", "info", "IA.JEAN");
    const result = await runAIAnalysis();
    await addEngineLog("✅ IA J.E.A.N. – Analyse terminée avec succès", "success", "IA.JEAN");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`Erreur IA J.E.A.N. : ${e.message}`, "IA.JEAN");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 💬 CHAT ADMIN / UTILISATEURS – GPT-4o-mini
// ==========================================================
app.post("/api/ai-admin", async (req, res) => {
  try {
    const { message, mode } = req.body;
    const result = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es l’assistant console TINSFLASH, connecté à J.E.A.N." },
          { role: "user", content: message },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    res.json({ reply: result.data.choices[0].message.content });
  } catch (e) {
    await addEngineError(`Erreur /api/ai-admin : ${e.message}`, "IA.Chat");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🌤️ API publique : /api/forecast (page index.html)
// ==========================================================
app.get("/api/forecast", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const country = (req.query.country || "").toString();
    const region = (req.query.region || "").toString();
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "lat/lon invalides" });
    }
    const data = await generateForecast(lat, lon, country, region);
    res.json(data);
  } catch (e) {
    await addEngineError("Erreur /api/forecast: " + e.message, "forecast");
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🌎 FUSION MONDIALE + STATUS + ADMIN
// ==========================================================
app.post("/api/runWorldAlerts", async (_, res) => {
  try {
    await addEngineLog("🌍 Fusion globale des alertes en cours...", "info", "core");
    const result = await runWorldAlerts();
    await addEngineLog("✅ Fusion mondiale terminée", "success", "core");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`Erreur runWorldAlerts: ${e.message}`, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/status", async (_, res) => {
  try {
    const s = await getEngineState();
    res.json({
      status: s?.checkup?.engineStatus || s?.status || "IDLE",
      lastRun: s?.lastRun,
      errors: s?.errors || [],
      coveredZones: enumerateCoveredPoints(),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🛰️ EXPORT TEMPS RÉEL DES LOGS POUR CONTRÔLE EXTERNE
// ==========================================================
app.get("/api/logs-live", async (_, res) => {
  try {
    const s = await getEngineState();
    res.json({
      status: s?.status || "unknown",
      lastRun: s?.lastRun || null,
      logs: (s?.logs || []).slice(-100),
      errors: (s?.errors || []).slice(-20),
      checkup: s?.checkup || {},
    });
  } catch (e) {
    console.error("❌ Erreur /api/logs-live :", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🧭 ADMIN PAGES + STATIC FILES
// ==========================================================
[
  "admin-pp.html",
  "admin-alerts.html",
  "admin-chat.html",
  "admin-index.html",
  "admin-radar.html",
  "admin-users.html",
].forEach((p) =>
  app.get(`/${p}`, (_, res) => res.sendFile(path.join(__dirname, "public", p)))
);

app.use(express.static(path.join(__dirname, "public")));
["avatars", "videos", "assets", "demo"].forEach((d) =>
  app.use(`/${d}`, express.static(path.join(__dirname, `public/${d}`)))
);

// ==========================================================
// 🚀 LANCEMENT SERVEUR
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`⚡ TINSFLASH PRO+++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes:", enumerateCoveredPoints().length);
});
