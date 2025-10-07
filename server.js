// ==========================================================
// 🌍 TINSFLASH – Central Meteorological Engine (Everest Protocol v1.2)
// 100 % réel – IA J.E.A.N. (GPT-5 moteur / GPT-4o-mini console)
// ==========================================================
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import EventEmitter from "events";

import { runGlobal } from "./services/runGlobal.js";
import { runAIAnalysis } from "./services/aiAnalysis.js";
import * as engineStateService from "./services/engineState.js";
import * as adminLogs from "./services/adminLogs.js";
import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import Alert from "./models/Alert.js";
import { askCohere } from "./services/cohereService.js";
import * as chatService from "./services/chatService.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ==========================================================
// 🌐 CORS global
// ==========================================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================================
// 📁 Fichiers statiques (public + sous-dossiers)
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));
app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/demo", express.static(path.join(__dirname, "public/demo"))); // ✅ pour la démo météo

// ==========================================================
// 🌍 Correctif MIME pour modules Three.js (Render HTTPS)
// ==========================================================
app.get("/three.module.js", (_, res) =>
  res.redirect("https://unpkg.com/three@0.161.0/build/three.module.js")
);
app.get("/OrbitControls.js", (_, res) =>
  res.redirect(
    "https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js"
  )
);

// ==========================================================
// 🔌 MongoDB
// ==========================================================
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("❌ Erreur MongoDB :", err));
} else console.error("⚠️ MONGO_URI manquant dans .env");

// ==========================================================
// 🌍 Index public
// ==========================================================
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ==========================================================
// 🌤️ Démo publique météo 3D (Open-Meteo + GPS)
// ==========================================================
// URL directe : https://tinsflash-backend.onrender.com/demo/meteo3d-gps-jour.html
app.get("/demo/meteo3d-gps-jour.html", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "demo", "meteo3d-gps-jour.html"))
);

// ==========================================================
// 🚀 Extraction réelle
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await runGlobal(zone || "All");
    await addLog(`⚙️ Extraction complète effectuée pour ${zone || "All"}`);
    res.json({ success: true, result });
  } catch (e) {
    await addLog(`❌ Erreur extraction: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 Analyse IA J.E.A.N. (GPT-5 moteur)
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    const r = await runAIAnalysis();
    await addLog("🧠 Analyse IA J.E.A.N terminée avec succès");
    res.json(r);
  } catch (e) {
    await addLog(`❌ Erreur IA J.E.A.N: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📊 Statut moteur
// ==========================================================
app.get("/api/status", async (_, res) => {
  try {
    const state = await engineStateService.getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || state?.status || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || {},
      alerts: state?.alertsLocal || [],
      alertsContinental: state?.alertsContinental || [],
      alertsWorld: state?.alertsWorld || [],
      partialReport: state?.partialReport || null,
      finalReport: state?.finalReport || null,
      errors: state?.errors || [],
      coveredZones: enumerateCoveredPoints(),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 💬 IA publique Cohere (J.E.A.N. grand public)
// ==========================================================
app.post("/api/cohere", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || question.trim().length < 2)
      return res.status(400).json({ error: "Question invalide" });

    const { reply, avatar } = await askCohere(question);
    await addLog(`💬 Question publique J.E.A.N: "${question}"`);
    res.json({ success: true, reply, avatar: `/avatars/jean-${avatar}.png` });
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
// 💬 IA console admin (GPT-4o-mini)
// ==========================================================
app.post("/api/ai-admin", async (req, res) => {
  try {
    const { message, mode } = req.body;
    if (!message || message.trim().length < 2)
      return res.status(400).json({ success: false, error: "Message vide" });

    let reply = "";
    if (mode === "meteo") reply = await chatService.askAIAdmin(message, "meteo");
    else reply = await chatService.askAIAdmin(message, "moteur");

    await addLog(`💬 Question console (${mode}) : "${message}"`);
    res.json({ success: true, reply });
  } catch (e) {
    console.error("❌ Erreur /api/ai-admin :", e.message);
    await addLog(`❌ Erreur IA admin : ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌋 Alertes (Everest Protocol)
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find().sort({ certainty: -1 });
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ... [reste de tes routes inchangé] ...

// ==========================================================
// 🚀 Lancement
// ==========================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ TINSFLASH prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes :", enumerateCoveredPoints().length);
});
