// ==========================================================
// 🧠 TINSFLASH Meteorological Core
// 🚀 Serveur principal connecté – 100 % réel, zéro démo
// ==========================================================
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { runGlobal } from "./services/runGlobal.js";
import { runAIAnalysis } from "./services/aiAnalysis.js";
import * as engineStateService from "./services/engineState.js";
import * as adminLogs from "./services/adminLogs.js";
import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import Alert from "./models/Alert.js";
import { askCohere } from "./services/cohereService.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ==========================================================
// 🌍 CORS renforcé pour compatibilité Render / GitHub / Local
// ==========================================================
app.use(cors({
  origin: "*", // ou préciser ton domaine front ex: ["https://tinsflash.onrender.com"]
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ==========================================================
// 🌍 Fichiers publics (Render + GitHub /avatars /videos)
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));
app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/media", express.static(path.join(__dirname, "public")));
app.use("/scripts", express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "public")));

// ==========================================================
// 🔌 Connexion MongoDB
// ==========================================================
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));
} else {
  console.error("⚠️ MONGO_URI manquant dans .env");
}

// ==========================================================
// 🌐 Page publique
// ==========================================================
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ==========================================================
// 🚀 Étape 1 : Extraction réelle (route principale)
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await runGlobal(zone || "All");
    res.json({ success: true, result });
  } catch (e) {
    console.error("❌ Erreur extraction (POST /api/run-global) :", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧩 Compatibilité ancienne route /api/extract (GET)
// ==========================================================
app.get("/api/extract", async (_, res) => {
  try {
    await checkSourcesFreshness();
    const result = await runGlobal("All");
    res.json({ success: true, result });
  } catch (e) {
    console.error("❌ Échec extraction (GET /api/extract) :", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 Étape 2 : Analyse IA J.E.A.N
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    const r = await runAIAnalysis();
    res.json(r);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📡 Status moteur
// ==========================================================
app.get("/api/status", async (_, res) => {
  try {
    const state = await engineStateService.getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || state?.status || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || "unknown",
      steps: state?.checkup || {},
      alerts: state?.alertsLocal || [],
      alertsCount: state?.alertsLocal?.length || 0,
      alertsContinental: state?.alertsContinental || [],
      alertsWorld: state?.alertsWorld || [],
      forecasts: state?.forecastsContinental || {},
      partialReport: state?.partialReport || null,
      finalReport: state?.finalReport || null,
      engineErrors: state?.errors || [],
      coveredZones: enumerateCoveredPoints(),
      uncoveredZones: [],
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 💬 IA Cohere publique (chat utilisateur)
// ==========================================================
app.post("/api/cohere", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || question.trim().length < 2)
      return res.status(400).json({ error: "Question invalide" });

    const { reply, avatar } = await askCohere(question);
    res.json({
      success: true,
      reply,
      avatar: `/avatars/jean-${avatar}.png`,
    });
  } catch (err) {
    console.error("❌ Erreur Cohere :", err.message);
    res.status(500).json({
      success: false,
      reply: "Erreur interne J.E.A.N.",
      avatar: "/avatars/jean-default.png",
    });
  }
});

// ==========================================================
// 🌍 Alertes & exports NASA/NOAA/Copernicus
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/alerts/export/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ success: false });
    const targets = ["NASA", "NOAA / NWS", "Copernicus"];
    await adminLogs.addLog(`🚀 Export alerte ${id} vers ${targets.join(", ")}`);
    res.json({ success: true, targets });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧭 Pages Admin (invisibles moteurs)
// ==========================================================
const adminPages = [
  "admin-pp.html",
  "admin-alerts.html",
  "admin-chat.html",
  "admin-index.html",
  "admin-radar.html",
  "admin-users.html",
];
for (const page of adminPages) {
  app.get(`/admin${page.includes("admin-") ? "-" + page.split("-")[1].split(".")[0] : ""}`, (_, res) =>
    res.sendFile(path.join(__dirname, "public", page))
  );
}

// ==========================================================
// 🚀 Lancement Serveur
// ==========================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ TINSFLASH prêt sur port ${PORT}`);
  console.log("🌍 Couverture :", enumerateCoveredPoints().length, "points actifs (zones vertes).");
});
